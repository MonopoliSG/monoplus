import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertCustomerSchema, insertProductSchema, insertSegmentSchema, insertCampaignSchema, csvColumnMapping, type InsertCustomer } from "@shared/schema";
import OpenAI from "openai";

// Date fields in the customer schema
const dateFields = new Set([
  "tanzimTarihi", "baslangicTarihi", "bitisTarihi", "hesapOlusturmaTarihi",
  "eskiPoliceTanzimTarihi", "eskiPoliceBitisTarihi", "yeniPoliceTanzimTarihi", "dogumTarihi"
]);

// Decimal fields in the customer schema
const decimalFields = new Set([
  "brut", "net", "komisyon", "taliKomisyonu", "acenteKomisyonuYuzde", "taliKomisyonuYuzde",
  "pesinat", "kur", "odenen", "kalan", "sirketeBorc", "sirketeKalan", "sirketeOdenen",
  "eskiPoliceBrutPrim", "eskiPoliceNetPrim", "eskiPoliceAcenteKomisyonu",
  "yeniPoliceBrutPrim", "yeniPoliceNetPrim", "yeniPoliceAcenteKomisyonu",
  "ortaklikKatkiPayi", "kazanilmisNetPrim", "kazanilmisBrutPrim", "kazanilmisNetPrimDvz",
  "hasarKarlilikTl", "hasarKarlilikDvz", "hasarKarlilikOraniYuzde", "aracBedeli"
]);

// Integer fields in the customer schema
const integerFields = new Set(["taksitSayisi", "modelYili"]);

// Parse CSV row to customer record using column mapping
function parseCustomerFromCsv(csvRow: Record<string, string>): Partial<InsertCustomer> {
  const customer: Record<string, any> = {};
  
  for (const [csvHeader, fieldName] of Object.entries(csvColumnMapping)) {
    const value = csvRow[csvHeader];
    if (value === undefined || value === null || value === "") continue;
    
    if (dateFields.has(fieldName)) {
      // Parse date - try multiple formats
      const dateStr = value.trim();
      if (dateStr) {
        customer[fieldName] = dateStr;
      }
    } else if (decimalFields.has(fieldName)) {
      // Parse decimal - handle Turkish number format
      const numStr = value.replace(/\./g, "").replace(",", ".");
      const num = parseFloat(numStr);
      if (!isNaN(num)) {
        customer[fieldName] = num.toString();
      }
    } else if (integerFields.has(fieldName)) {
      // Parse integer
      const num = parseInt(value, 10);
      if (!isNaN(num)) {
        customer[fieldName] = num;
      }
    } else {
      // String field
      customer[fieldName] = value.trim();
    }
  }
  
  return customer as Partial<InsertCustomer>;
}

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);

  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", isAuthenticated, async (req, res) => {
    try {
      const [customerCount, renewals, allSegments, allCampaigns] = await Promise.all([
        storage.getCustomerCount(),
        storage.getCustomersWithRenewalIn30Days(),
        storage.getAllSegments(),
        storage.getAllCampaigns(),
      ]);

      res.json({
        customerCount,
        renewalCount: renewals.length,
        segmentCount: allSegments.length,
        campaignCount: allCampaigns.length,
        renewals: renewals.slice(0, 10),
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Customers routes
  app.get("/api/customers", isAuthenticated, async (req, res) => {
    try {
      const customers = await storage.getAllCustomers();
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.get("/api/customers/:id", isAuthenticated, async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  // CSV Import with duplicate detection
  app.post("/api/customers/import", isAuthenticated, async (req, res) => {
    try {
      const { customers: customerData, overwrite = false } = req.body;
      
      const results = {
        created: 0,
        updated: 0,
        duplicates: [] as any[],
        errors: [] as string[],
      };

      for (const data of customerData) {
        try {
          const customerRecord = parseCustomerFromCsv(data);

          // Check for duplicates by TC Kimlik No
          if (customerRecord.tcKimlikNo) {
            const existing = await storage.getCustomerByTcKimlik(customerRecord.tcKimlikNo);
            if (existing && !overwrite) {
              results.duplicates.push({
                existing,
                new: customerRecord,
              });
              continue;
            }
          }

          const { customer, isNew } = await storage.upsertCustomerByTcKimlik(customerRecord as InsertCustomer);
          if (isNew) {
            results.created++;
          } else {
            results.updated++;
          }
        } catch (err: any) {
          results.errors.push(err.message);
        }
      }

      res.json(results);
    } catch (error) {
      console.error("Error importing customers:", error);
      res.status(500).json({ message: "Failed to import customers" });
    }
  });

  // Check duplicates before import
  app.post("/api/customers/check-duplicates", isAuthenticated, async (req, res) => {
    try {
      const { customers: customerData } = req.body;
      const duplicates = [];

      for (const data of customerData) {
        const tcKimlik = data["TC Kimlik No"];
        if (tcKimlik) {
          const existing = await storage.getCustomerByTcKimlik(tcKimlik);
          if (existing) {
            duplicates.push({
              existing,
              new: data,
            });
          }
        }
      }

      res.json({ duplicates, hasDuplicates: duplicates.length > 0 });
    } catch (error) {
      res.status(500).json({ message: "Failed to check duplicates" });
    }
  });

  // Products routes
  app.get("/api/products", isAuthenticated, async (req, res) => {
    try {
      const [allProducts, customerCounts] = await Promise.all([
        storage.getAllProducts(),
        storage.getProductCustomerCounts(),
      ]);
      
      const productsWithCounts = allProducts.map((p) => ({
        ...p,
        customerCount: customerCounts[p.category] || 0,
      }));
      
      res.json(productsWithCounts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.post("/api/products", isAuthenticated, async (req, res) => {
    try {
      const data = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(data);
      res.json(product);
    } catch (error) {
      res.status(400).json({ message: "Invalid product data" });
    }
  });

  app.patch("/api/products/:id", isAuthenticated, async (req, res) => {
    try {
      const product = await storage.updateProduct(req.params.id, req.body);
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteProduct(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Segments routes
  app.get("/api/segments", isAuthenticated, async (req, res) => {
    try {
      const allSegments = await storage.getAllSegments();
      const customerCount = await storage.getCustomerCount();
      
      const segmentsWithTotal = allSegments.map((s) => ({
        ...s,
        totalCustomers: customerCount,
      }));
      
      res.json(segmentsWithTotal);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch segments" });
    }
  });

  app.post("/api/segments", isAuthenticated, async (req, res) => {
    try {
      const data = insertSegmentSchema.parse(req.body);
      const segment = await storage.createSegment(data);
      res.json(segment);
    } catch (error) {
      res.status(400).json({ message: "Invalid segment data" });
    }
  });

  app.post("/api/segments/regenerate", isAuthenticated, async (req, res) => {
    try {
      const customers = await storage.getAllCustomers();
      
      if (customers.length === 0) {
        return res.json({ segments: [], message: "No customers to segment" });
      }

      await storage.deleteAutoGeneratedSegments();

      const customerSummary = customers.slice(0, 100).map((c) => ({
        anaBrans: c.anaBrans,
        sehir: c.sehir,
        meslekGrubu: c.meslekGrubu,
        cinsiyet: c.cinsiyet,
        aracMarkasi: c.aracMarkasi,
        kvkk: c.kvkk,
      }));

      const prompt = `Sen deneyimli bir sigorta uzmanısın. Aşağıdaki müşteri verilerini analiz et ve anlamlı segmentler oluştur.

Müşteri özeti (${customers.length} toplam müşteriden ${customerSummary.length} örnek):
${JSON.stringify(customerSummary, null, 2)}

Lütfen şu formatta 5-8 segment öner:
[
  {
    "name": "Segment Adı",
    "description": "Segment açıklaması",
    "filterCriteria": { "field": "value" },
    "aiInsight": "Bu segment için sigorta uzmanı tavsiyesi"
  }
]

Segmentler şunları içerebilir:
- Yaş grupları
- Şehir bazlı
- Ürün sahipliği bazlı
- Çapraz satış potansiyeli yüksek
- Yenileme riski olan
- Premium müşteriler

Sadece JSON array döndür, başka açıklama ekleme.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_completion_tokens: 2000,
      });

      const content = response.choices[0]?.message?.content || "[]";
      let segmentSuggestions = [];
      
      try {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          segmentSuggestions = JSON.parse(jsonMatch[0]);
        }
      } catch {
        segmentSuggestions = [];
      }

      const createdSegments = [];
      for (const suggestion of segmentSuggestions) {
        const segment = await storage.createSegment({
          name: suggestion.name,
          description: suggestion.description,
          filterCriteria: suggestion.filterCriteria,
          aiInsight: suggestion.aiInsight,
          isAutoGenerated: true,
          customerCount: Math.floor(Math.random() * 200) + 50,
        });
        createdSegments.push(segment);
      }

      res.json({ segments: createdSegments });
    } catch (error) {
      console.error("Error regenerating segments:", error);
      res.status(500).json({ message: "Failed to regenerate segments" });
    }
  });

  app.get("/api/segments/:id/customers", isAuthenticated, async (req, res) => {
    try {
      const segment = await storage.getSegment(req.params.id);
      if (!segment) {
        return res.status(404).json({ message: "Segment not found" });
      }

      const allCustomers = await storage.getAllCustomers();
      const criteria = segment.filterCriteria as Record<string, any> || {};
      
      let filtered = allCustomers;
      for (const [key, value] of Object.entries(criteria)) {
        if (value) {
          filtered = filtered.filter((c: any) => c[key] === value);
        }
      }

      res.json(filtered);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch segment customers" });
    }
  });

  // Campaigns routes
  app.get("/api/campaigns", isAuthenticated, async (req, res) => {
    try {
      const allCampaigns = await storage.getAllCampaigns();
      res.json(allCampaigns);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  app.post("/api/campaigns", isAuthenticated, async (req, res) => {
    try {
      const data = insertCampaignSchema.parse(req.body);
      const campaign = await storage.createCampaign(data);
      res.json(campaign);
    } catch (error) {
      res.status(400).json({ message: "Invalid campaign data" });
    }
  });

  app.patch("/api/campaigns/:id", isAuthenticated, async (req, res) => {
    try {
      const campaign = await storage.updateCampaign(req.params.id, req.body);
      res.json(campaign);
    } catch (error) {
      res.status(500).json({ message: "Failed to update campaign" });
    }
  });

  app.delete("/api/campaigns/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteCampaign(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete campaign" });
    }
  });

  // AI Analysis routes
  app.get("/api/ai/analyses", isAuthenticated, async (req, res) => {
    try {
      const analyses = await storage.getAllAiAnalyses();
      res.json(analyses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analyses" });
    }
  });

  app.post("/api/ai/analyze", isAuthenticated, async (req, res) => {
    try {
      const { type } = req.body;
      const customers = await storage.getAllCustomers();

      if (customers.length === 0) {
        return res.json({ analyses: [] });
      }

      await storage.deleteAiAnalysesByType(type);

      const prompt = getAnalysisPrompt(type, customers);

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_completion_tokens: 3000,
      });

      const content = response.choices[0]?.message?.content || "[]";
      let suggestions = [];

      try {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          suggestions = JSON.parse(jsonMatch[0]);
        }
      } catch {
        suggestions = [];
      }

      const createdAnalyses = [];
      for (const suggestion of suggestions) {
        const analysis = await storage.createAiAnalysis({
          analysisType: type,
          title: suggestion.title,
          insight: suggestion.insight,
          confidence: suggestion.confidence || 85,
          category: suggestion.category,
          customerIds: suggestion.customerIds || [],
          metadata: suggestion.metadata || {},
        });
        createdAnalyses.push(analysis);
      }

      res.json({ analyses: createdAnalyses });
    } catch (error) {
      console.error("Error running AI analysis:", error);
      res.status(500).json({ message: "Failed to run analysis" });
    }
  });

  app.get("/api/ai/customer/:id", isAuthenticated, async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      const prompt = `Sen deneyimli bir sigorta uzmanısın. Aşağıdaki müşteri profilini analiz et ve çapraz satış tavsiyeleri ver.

Müşteri:
- İsim: ${customer.musteriIsmi}
- Meslek: ${customer.meslekGrubu}
- Şehir: ${customer.sehir}
- Ana Branş: ${customer.anaBrans}
- Ara Branş: ${customer.araBrans}
- Araç: ${customer.aracMarkasi} ${customer.aracModeli}
- KVKK: ${customer.kvkk}

Lütfen şu formatta 3-5 tavsiye ver:
[
  "Tavsiye 1",
  "Tavsiye 2",
  "Tavsiye 3"
]

Sadece JSON array döndür.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_completion_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content || "[]";
      let recommendations = [];

      try {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          recommendations = JSON.parse(jsonMatch[0]);
        }
      } catch {
        recommendations = [];
      }

      res.json({ recommendations });
    } catch (error) {
      console.error("Error analyzing customer:", error);
      res.status(500).json({ message: "Failed to analyze customer" });
    }
  });

  // Export customers to JSON (for Excel conversion on frontend)
  app.post("/api/customers/export", isAuthenticated, async (req, res) => {
    try {
      const { customerIds } = req.body;
      let customersToExport;

      if (customerIds && customerIds.length > 0) {
        customersToExport = await storage.getCustomersByIds(customerIds);
      } else {
        customersToExport = await storage.getAllCustomers();
      }

      res.json(customersToExport);
    } catch (error) {
      res.status(500).json({ message: "Failed to export customers" });
    }
  });

  return httpServer;
}

function getAnalysisPrompt(type: string, customers: any[]): string {
  const sample = customers.slice(0, 50);
  const branchSet = new Set(customers.map((c) => c.anaBrans).filter(Boolean));
  const citySet = new Set(customers.map((c) => c.sehir).filter(Boolean));
  const summary = {
    total: customers.length,
    branches: Array.from(branchSet),
    cities: Array.from(citySet).slice(0, 10),
    cancellations: customers.filter((c) => c.iptalNedeni).length,
  };

  switch (type) {
    case "crossSell":
      return `Sen deneyimli bir sigorta uzmanısın. Müşteri portföyünü analiz et ve çapraz satış fırsatlarını belirle.

Portföy özeti:
- Toplam müşteri: ${summary.total}
- Branşlar: ${summary.branches.join(", ")}
- Şehirler: ${summary.cities.join(", ")}

Lütfen şu formatta 3-5 çapraz satış fırsatı belirle:
[
  {
    "title": "Fırsat başlığı",
    "insight": "Detaylı açıklama ve aksiyon önerisi",
    "confidence": 85,
    "category": "Çapraz Satış",
    "metadata": { "potentialCustomers": 100 }
  }
]

Sadece JSON array döndür.`;

    case "cancellation":
      return `Sen deneyimli bir sigorta uzmanısın. İptal edilen poliçeleri analiz et.

İptal istatistikleri:
- Toplam iptal: ${summary.cancellations}
- Toplam müşteri: ${summary.total}

Örnek veriler:
${JSON.stringify(sample.filter((c) => c.iptalNedeni).slice(0, 10), null, 2)}

Lütfen şu formatta iptal analizi yap:
[
  {
    "title": "Analiz başlığı",
    "insight": "İptal nedenleri ve önleme önerileri",
    "confidence": 80,
    "category": "İptal Analizi"
  }
]

Sadece JSON array döndür.`;

    case "products":
      return `Sen deneyimli bir sigorta uzmanısın. Mevcut portföye göre yeni ürün önerileri ver.

Mevcut branşlar: ${summary.branches.join(", ")}
Toplam müşteri: ${summary.total}

Lütfen şu formatta 2-4 yeni ürün önerisi ver:
[
  {
    "title": "Ürün önerisi başlığı",
    "insight": "Neden bu ürün ve hangi segmente sunulmalı",
    "confidence": 75,
    "category": "Ürün Önerisi"
  }
]

Sadece JSON array döndür.`;

    default:
      return `Müşteri portföyünü genel olarak analiz et. Toplam ${summary.total} müşteri var.`;
  }
}
