import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAdminAuth, isAuthenticated } from "./adminAuth";
import { insertCustomerSchema, insertProductSchema, insertSegmentSchema, insertCampaignSchema, csvColumnMapping, type InsertCustomer, type InsertAiCustomerPrediction, type InsertAiAnalysis } from "@shared/schema";
import OpenAI from "openai";
import ExcelJS from "exceljs";
import multer from "multer";

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

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

// OpenAI client - supports both Replit AI Integrations and standard API key
const openaiApiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
const openaiBaseUrl = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;

let openai: OpenAI | null = null;
if (openaiApiKey) {
  openai = new OpenAI({
    apiKey: openaiApiKey,
    ...(openaiBaseUrl ? { baseURL: openaiBaseUrl } : {}),
  });
} else {
  console.warn("WARNING: No OpenAI API key found. AI features will be disabled.");
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAdminAuth(app);

  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      // For admin auth, user is directly in req.user
      const user = req.user;
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

  // Paginated customers endpoint - must be before /:id route
  app.get("/api/customers/paginated", isAuthenticated, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const search = req.query.search as string;
      const city = req.query.city as string;
      const branch = req.query.branch as string;
      const segment = req.query.segment as string;
      const renewalDays = req.query.renewalDays ? parseInt(req.query.renewalDays as string) : undefined;
      const aiPredictionType = req.query.aiPredictionType as string;
      const aiAnalysisId = req.query.aiAnalysisId as string;
      const customerType = req.query.customerType as string;
      const dateType = req.query.dateType as string;
      const dateFrom = req.query.dateFrom as string;
      const dateTo = req.query.dateTo as string;
      const hasBranch = req.query.hasBranch as string;
      const notHasBranch = req.query.notHasBranch as string;
      const minAge = req.query.minAge ? parseInt(req.query.minAge as string) : undefined;
      // Advanced filter parameters
      const hasBranch2 = req.query.hasBranch2 as string;
      const notHasBranch2 = req.query.notHasBranch2 as string;
      const policyCountMin = req.query.policyCountMin ? parseInt(req.query.policyCountMin as string) : undefined;
      const policyCountMax = req.query.policyCountMax ? parseInt(req.query.policyCountMax as string) : undefined;
      const renewalProduct = req.query.renewalProduct as string;
      const vehicleCountMin = req.query.vehicleCountMin ? parseInt(req.query.vehicleCountMin as string) : undefined;
      const vehicleAgeMax = req.query.vehicleAgeMax ? parseInt(req.query.vehicleAgeMax as string) : undefined;

      console.log("[DEBUG] Paginated customers request:", { page, limit, search, city, branch, segment, renewalDays, aiPredictionType, aiAnalysisId, customerType, dateType, dateFrom, dateTo, hasBranch, notHasBranch, minAge, hasBranch2, notHasBranch2, policyCountMin, policyCountMax, renewalProduct, vehicleCountMin, vehicleAgeMax });

      const result = await storage.getCustomersPaginated({
        page,
        limit,
        search,
        city,
        branch,
        segment,
        renewalDays,
        aiPredictionType,
        aiAnalysisId,
        customerType,
        dateType,
        dateFrom,
        dateTo,
        hasBranch,
        notHasBranch,
        minAge,
        hasBranch2,
        notHasBranch2,
        policyCountMin,
        policyCountMax,
        renewalProduct,
        vehicleCountMin,
        vehicleAgeMax,
      });
      
      res.json(result);
    } catch (error) {
      console.error("Error getting paginated customers:", error);
      res.status(500).json({ message: "Müşteriler yüklenemedi" });
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

  // Excel Import endpoint - handles .xlsx files with proper Turkish character encoding
  app.post("/api/customers/import-excel", isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Dosya yüklenmedi" });
      }

      const overwrite = req.body.overwrite === 'true';
      const clearExisting = req.body.clearExisting === 'true';
      
      console.log("[Excel Import] Starting import, file size:", req.file.size, "bytes");
      console.log("[Excel Import] Options - overwrite:", overwrite, "clearExisting:", clearExisting);

      // If clearExisting is true, delete all existing customers first
      if (clearExisting) {
        console.log("[Excel Import] Clearing existing customers...");
        await storage.deleteAllCustomers();
        console.log("[Excel Import] Existing customers cleared");
      }

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(req.file.buffer);
      
      const worksheet = workbook.getWorksheet(1);
      if (!worksheet) {
        return res.status(400).json({ message: "Excel dosyasında çalışma sayfası bulunamadı" });
      }

      const results = {
        created: 0,
        updated: 0,
        duplicates: [] as any[],
        errors: [] as string[],
        totalRows: 0,
      };

      // Get headers from first row
      const headerRow = worksheet.getRow(1);
      const headers: string[] = [];
      headerRow.eachCell((cell, colNumber) => {
        headers[colNumber] = cell.value?.toString() || '';
      });

      console.log("[Excel Import] Headers found:", headers.filter(h => h).length);

      // Process each data row
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header row
        results.totalRows++;
      });

      let processedRows = 0;
      for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
        const row = worksheet.getRow(rowNumber);
        const rowData: Record<string, string> = {};
        
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber];
          if (header) {
            let value = '';
            if (cell.value instanceof Date) {
              value = cell.value.toISOString().split('T')[0];
            } else if (typeof cell.value === 'object' && cell.value !== null) {
              value = (cell.value as any).text || (cell.value as any).result?.toString() || '';
            } else {
              value = cell.value?.toString() || '';
            }
            rowData[header] = value;
          }
        });

        // Skip empty rows
        if (Object.keys(rowData).length === 0) continue;

        try {
          const customerRecord = parseCustomerFromCsv(rowData);

          // Check for duplicates by TC Kimlik No
          if (customerRecord.tcKimlikNo) {
            const existing = await storage.getCustomerByTcKimlik(customerRecord.tcKimlikNo);
            if (existing && !overwrite && !clearExisting) {
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
          processedRows++;
          
          // Log progress every 100 rows
          if (processedRows % 100 === 0) {
            console.log(`[Excel Import] Processed ${processedRows} rows...`);
          }
        } catch (err: any) {
          results.errors.push(`Satır ${rowNumber}: ${err.message}`);
        }
      }

      console.log("[Excel Import] Completed - Created:", results.created, "Updated:", results.updated, "Duplicates:", results.duplicates.length);
      res.json(results);
    } catch (error) {
      console.error("Error importing Excel:", error);
      res.status(500).json({ message: "Excel dosyası işlenirken hata oluştu" });
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

      if (!openai) {
        return res.status(503).json({ message: "AI ozellikleri aktif degil. OPENAI_API_KEY gerekli." });
      }

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

  app.delete("/api/ai/analyses/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteAiAnalysis(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Analiz silinemedi" });
    }
  });

  app.post("/api/ai/analyze", isAuthenticated, async (req, res) => {
    try {
      const { type } = req.body;
      // Use customer profiles with hashtags for richer AI analysis
      const profiles = await storage.getAllCustomerProfilesForAiAnalysis();

      if (profiles.length === 0) {
        return res.json({ analyses: [] });
      }

      await storage.deleteAiAnalysesByType(type);

      if (!openai) {
        return res.status(503).json({ message: "AI ozellikleri aktif degil. OPENAI_API_KEY gerekli." });
      }

      const prompt = getProfileAnalysisPrompt(type, profiles);

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

      if (!openai) {
        return res.status(503).json({ message: "AI ozellikleri aktif degil. OPENAI_API_KEY gerekli." });
      }

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

  // Export customer profiles to Excel (same format as import)
  app.post("/api/customer-profiles/export-excel", isAuthenticated, async (req, res) => {
    try {
      const { filters } = req.body;
      
      // Get all profiles matching filters (no pagination)
      const hashtagArray = filters?.hashtags 
        ? filters.hashtags.split(",").map((h: string) => h.trim()).filter((h: string) => h).map((h: string) => h.replace(/^#/, ''))
        : undefined;
      
      const result = await storage.getCustomerProfilesPaginated({
        page: 1,
        limit: 100000, // Large limit to get all
        search: filters?.search,
        city: filters?.city,
        customerType: filters?.customerType,
        policyType: filters?.policyType,
        hashtags: hashtagArray,
        product: filters?.product,
        hasBranch: filters?.hasBranch,
        notHasBranch: filters?.notHasBranch,
        policyCountMin: filters?.policyCountMin ? parseInt(filters.policyCountMin) : undefined,
        policyCountMax: filters?.policyCountMax ? parseInt(filters.policyCountMax) : undefined,
        vehicleCountMin: filters?.vehicleCountMin ? parseInt(filters.vehicleCountMin) : undefined,
        vehicleAgeMax: filters?.vehicleAgeMax ? parseInt(filters.vehicleAgeMax) : undefined,
      });
      
      // Get hesapKodulari from filtered profiles
      const hesapKodulari = result.profiles.map(p => p.hesapKodu).filter(Boolean);
      
      // Get customer data for export (using customer table which has all columns)
      let customersToExport: any[] = [];
      const allCustomers = await storage.getAllCustomers();
      
      if (hesapKodulari.length > 0) {
        const hesapKoduSet = new Set(hesapKodulari);
        customersToExport = allCustomers.filter(c => hesapKoduSet.has(c.hesapKodu));
      } else {
        customersToExport = allCustomers;
      }

      if (customersToExport.length === 0) {
        return res.status(400).json({ message: "Export için müşteri bulunamadı" });
      }

      // Create reverse mapping from csvColumnMapping (field -> first Turkish header)
      const exportColumnMapping: Record<string, string> = {};
      const seenFields = new Set<string>();
      for (const [header, field] of Object.entries(csvColumnMapping)) {
        if (!seenFields.has(field as string)) {
          exportColumnMapping[field as string] = header;
          seenFields.add(field as string);
        }
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Müşteriler");

      // Set columns with Turkish headers
      const columns = Object.entries(exportColumnMapping).map(([key, header]) => ({
        header,
        key,
        width: 20,
      }));
      worksheet.columns = columns;

      // Add data rows
      customersToExport.forEach((customer: any) => {
        const rowData: Record<string, any> = {};
        for (const [fieldName] of Object.entries(exportColumnMapping)) {
          rowData[fieldName] = customer[fieldName] || "";
        }
        worksheet.addRow(rowData);
      });

      // Style header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      };

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename=musteri_profilleri_${Date.now()}.xlsx`);

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error("Error exporting customer profiles:", error);
      res.status(500).json({ message: "Export başarısız oldu" });
    }
  });

  // Get predictions for a specific customer
  app.get("/api/ai/predictions/customer/:customerId", isAuthenticated, async (req, res) => {
    try {
      const { customerId } = req.params;
      const predictions = await storage.getCustomerPredictionsByCustomerId(customerId);
      res.json(predictions);
    } catch (error) {
      console.error("Error getting customer predictions:", error);
      res.status(500).json({ message: "Failed to get customer predictions" });
    }
  });

  // Get customer predictions with filters
  app.get("/api/ai/predictions", isAuthenticated, async (req, res) => {
    try {
      const { analysisType, minProbability, maxProbability, search, product, city } = req.query;
      
      const predictions = await storage.getCustomerPredictions({
        analysisType: analysisType as string,
        minProbability: minProbability ? parseInt(minProbability as string) : undefined,
        maxProbability: maxProbability ? parseInt(maxProbability as string) : undefined,
        search: search as string,
        product: product as string,
        city: city as string,
      });
      
      res.json(predictions);
    } catch (error) {
      console.error("Error getting predictions:", error);
      res.status(500).json({ message: "Failed to get predictions" });
    }
  });

  // Run customer-specific AI analysis
  app.post("/api/ai/analyze-customers", isAuthenticated, async (req, res) => {
    try {
      const { type } = req.body;
      
      if (!openai) {
        return res.status(503).json({ message: "AI özellikleri aktif değil. OPENAI_API_KEY gerekli." });
      }

      // Use customer profiles with hashtags for richer AI analysis
      const profiles = await storage.getAllCustomerProfilesForAiAnalysis();
      if (profiles.length === 0) {
        return res.status(400).json({ message: "Analiz için müşteri profili bulunamadı" });
      }

      // Delete existing predictions for this type
      await storage.deleteCustomerPredictionsByType(type);

      // For large datasets, sample profiles intelligently
      const sampleSize = Math.min(200, profiles.length);
      const sampledProfiles = profiles.slice(0, sampleSize);

      const prompt = getCustomerProfilePredictionPrompt(type, sampledProfiles);

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_completion_tokens: 16000,
        temperature: 0.3,
      });

      let content = response.choices[0]?.message?.content || "[]";
      
      // Remove markdown code blocks if present
      content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      
      console.log("AI Response content length:", content.length);
      console.log("AI Response first 500 chars:", content.substring(0, 500));
      let predictions: InsertAiCustomerPrediction[] = [];

      try {
        // Try multiple parsing strategies
        let rawPredictions: any[] = [];
        
        // Strategy 1: Direct JSON parse
        try {
          const parsed = JSON.parse(content);
          rawPredictions = Array.isArray(parsed) ? parsed : (parsed.predictions || parsed.data || []);
          console.log("Strategy 1 succeeded, count:", rawPredictions.length);
        } catch (e1) {
          console.log("Strategy 1 failed:", (e1 as Error).message);
          // Strategy 2: Find any JSON-like content between first [ and last ]
          const startIdx = content.indexOf('[');
          const endIdx = content.lastIndexOf(']');
          console.log("Strategy 2: startIdx=", startIdx, "endIdx=", endIdx);
          if (startIdx !== -1 && endIdx > startIdx) {
            const jsonStr = content.substring(startIdx, endIdx + 1);
            console.log("JSON substring length:", jsonStr.length);
            try {
              rawPredictions = JSON.parse(jsonStr);
              console.log("Strategy 2 succeeded, count:", rawPredictions.length);
            } catch (e2) {
              console.log("Strategy 2 failed:", (e2 as Error).message);
              console.log("JSON substring first 200 chars:", jsonStr.substring(0, 200));
            }
          }
        }
        
        console.log("Parsed predictions count:", rawPredictions.length);
        if (rawPredictions.length > 0) {
          console.log("First prediction sample:", JSON.stringify(rawPredictions[0]));
        }
        
        predictions = rawPredictions.map((p: any) => ({
          analysisType: type,
          customerId: String(p.customerId || p.profileId || p.id || ""),
          profileId: String(p.profileId || p.customerId || p.id || ""),
          customerName: String(p.customerName || p.name || p.müşteri_adı || ""),
          currentProduct: String(p.currentProduct || p.product || p.mevcut_ürün || ""),
          suggestedProduct: p.suggestedProduct || p.suggested_product || p.önerilen_ürün || null,
          probability: Math.min(100, Math.max(0, parseInt(p.probability || p.olasılık || p.risk) || 50)),
          reason: String(p.reason || p.sebep || p.açıklama || ""),
          city: p.city || p.şehir || null,
          hashtags: p.hashtags || null,
        })).filter((p: any) => p.customerId && p.customerName);
        console.log("Filtered predictions count:", predictions.length);
      } catch (parseError) {
        console.error("Error parsing AI response:", parseError);
        console.log("Raw AI response:", content.substring(0, 1000));
      }

      if (predictions.length > 0) {
        await storage.createCustomerPredictions(predictions);
      }

      const savedPredictions = await storage.getCustomerPredictions({ analysisType: type });
      res.json({ success: true, count: savedPredictions.length, predictions: savedPredictions });
    } catch (error) {
      console.error("Error analyzing customers:", error);
      res.status(500).json({ message: "Müşteri analizi başarısız oldu" });
    }
  });

  // Export predictions to Excel
  app.post("/api/ai/predictions/export", isAuthenticated, async (req, res) => {
    try {
      const { analysisType, minProbability, maxProbability, search, product, city } = req.body;
      
      const predictions = await storage.getCustomerPredictions({
        analysisType,
        minProbability: minProbability !== undefined ? parseInt(minProbability) : undefined,
        maxProbability: maxProbability !== undefined ? parseInt(maxProbability) : undefined,
        search,
        product,
        city,
      });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Tahminler");

      if (analysisType === "churn_prediction") {
        worksheet.columns = [
          { header: "Müşteri Adı", key: "customerName", width: 30 },
          { header: "Mevcut Ürün", key: "currentProduct", width: 20 },
          { header: "İptal Olasılığı (%)", key: "probability", width: 18 },
          { header: "Potansiyel İptal Sebebi", key: "reason", width: 50 },
          { header: "Şehir", key: "city", width: 15 },
        ];
      } else {
        worksheet.columns = [
          { header: "Müşteri Adı", key: "customerName", width: 30 },
          { header: "Mevcut Ürün", key: "currentProduct", width: 20 },
          { header: "Önerilen Ürün", key: "suggestedProduct", width: 20 },
          { header: "Satış Olasılığı (%)", key: "probability", width: 18 },
          { header: "Satış Argümanı", key: "reason", width: 50 },
          { header: "Şehir", key: "city", width: 15 },
        ];
      }

      predictions.forEach((p) => {
        worksheet.addRow({
          customerName: p.customerName,
          currentProduct: p.currentProduct,
          suggestedProduct: p.suggestedProduct,
          probability: p.probability,
          reason: p.reason,
          city: p.city,
        });
      });

      // Style header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      };

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename=tahminler_${analysisType}_${Date.now()}.xlsx`);

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error("Error exporting predictions:", error);
      res.status(500).json({ message: "Export başarısız oldu" });
    }
  });

  // Custom segment creation with AI
  app.post("/api/ai/analyze-custom-segment", isAuthenticated, async (req, res) => {
    try {
      const { prompt } = req.body;
      
      if (!openai) {
        return res.status(503).json({ message: "AI özellikleri aktif değil. OPENAI_API_KEY gerekli." });
      }

      if (!prompt || prompt.trim().length < 10) {
        return res.status(400).json({ message: "Lütfen en az 10 karakterlik bir kriter girin" });
      }

      const customers = await storage.getAllCustomers();
      if (customers.length === 0) {
        return res.status(400).json({ message: "Analiz için müşteri bulunamadı" });
      }

      const sampleSize = Math.min(100, customers.length);
      const sampledCustomers = customers.slice(0, sampleSize).map((c) => ({
        id: c.id,
        name: c.musteriIsmi,
        city: c.sehir,
        branch: c.anaBrans,
        premium: c.brut,
        startDate: c.baslangicTarihi,
        endDate: c.bitisTarihi,
      }));

      // Get available branches and cities for filtering
      const branchSet = new Set(customers.map((c) => c.anaBrans).filter(Boolean));
      const citySet = new Set(customers.map((c) => c.sehir).filter(Boolean));
      const availableBranches = Array.from(branchSet);
      const availableCities = Array.from(citySet);

      // Get hashtags from customer profiles for segment filtering
      const allProfiles = await storage.getAllCustomerProfilesForAiAnalysis();
      const allHashtags = new Set<string>();
      allProfiles.forEach((p: any) => {
        if (p.aiAnaliz) {
          p.aiAnaliz.split(/\s+/).filter((t: string) => t.startsWith('#')).forEach((t: string) => allHashtags.add(t));
        }
      });
      const availableHashtags = Array.from(allHashtags).slice(0, 40);

      const systemPrompt = `Sen deneyimli bir sigorta uzmanısın. Kullanıcının belirttiği kriterlere göre müşteri segmenti analizi yap.

Müşteri verisi (örnek ${sampleSize} müşteri, toplam ${customers.length} müşteri):
${JSON.stringify(sampledCustomers.slice(0, 30), null, 2)}

Kullanıcının kriterleri: ${prompt}

ÖNEMLİ: Segment oluştururken aşağıdaki filtreleme seçeneklerini kullanabilirsin:

HASHTAG FİLTRELERİ (ÖNCELİKLİ - Segment tanımlamada hashtag'leri yoğun kullan!):
- hashtag: Tek bir hashtag (örn: "#sadik_musteri")
- hashtags: Birden fazla hashtag kombinasyonu (örn: ["#kurumsal", "#yuksek_potansiyel"])
Kullanılabilir hashtag'ler: ${availableHashtags.join(", ")}

HASHTAG KOMBİNASYON ÖRNEKLERİ:
- Ürün + Hashtag: hasBranch="Oto Kaza (Kasko)" + hashtag="#sadik_musteri" → Kasko sahipleri arasında sadık müşteriler
- Şehir + Hashtag: city="İSTANBUL" + hashtag="#yuksek_potansiyel" → İstanbul'daki yüksek potansiyelli müşteriler
- Hashtag + Hashtag: hashtags=["#kurumsal", "#saglik"] → Kurumsal ve sağlık etiketli müşteriler
- Ürün + Çoklu Hashtag: hasBranch="Sağlık" + hashtags=["#bireysel", "#orta_yas"] → Bireysel orta yaş sağlık sahipleri

DİĞER FİLTRELER:
- city: Şehir (Kullanılabilir değerler: ${availableCities.slice(0, 20).join(", ")})
- branch: Ürün/Branş (Kullanılabilir değerler: ${availableBranches.join(", ")})
- customerType: Müşteri tipi ("bireysel" veya "kurumsal")
- hasBranch: Bu ürüne sahip müşteriler (örn: "Oto Kaza (Kasko)")
- notHasBranch: Bu ürüne sahip OLMAYAN müşteriler (örn: "Oto Kaza (Trafik)")
- hasBranch2: İkinci ürüne sahip müşteriler - çoklu ürün sorguları için
- notHasBranch2: İkinci ürüne sahip OLMAYAN müşteriler
- minAge: Minimum müşteri yaşı (sayı, örn: 25)
- policyCountMin: Minimum poliçe sayısı
- policyCountMax: Maximum poliçe sayısı
- renewalProduct: Yenileme yaklaşan ürün
- vehicleCountMin: Minimum araç sayısı
- vehicleAgeMax: Maximum araç yaşı

ÖRNEK SEGMENTLER:
- Kasko'lu Sadık Müşteriler: hasBranch="Oto Kaza (Kasko)", hashtag="#sadik_musteri"
- İstanbul Yüksek Potansiyel: city="İSTANBUL", hashtag="#yuksek_potansiyel"
- Kurumsal Sağlık Müşterileri: hashtags=["#kurumsal", "#saglik"]
- Anadolu Yenileme Riskli: hashtags=["#anadolu", "#yenileme_riski"]
- Trafiği Var Kaskosu Yok: hasBranch="Oto Kaza (Trafik)", notHasBranch="Oto Kaza (Kasko)"
- Büyükşehir Kasko Sahipleri: hasBranch="Oto Kaza (Kasko)", hashtag="#buyuksehir"

Bu kriterlere göre bir segment analizi oluştur. Şu JSON formatında döndür:
{
  "title": "Segment adı - Türkçe ve açıklayıcı olmalı",
  "insight": "Segment özellikleri, davranış kalıpları ve pazarlama önerileri (detaylı)",
  "confidence": 85,
  "metadata": { 
    "customerCount": 500, 
    "avgPremium": 5000 
  },
  "filters": {
    "hasBranch": "Oto Kaza (Kasko)",
    "hashtag": "#sadik_musteri"
  }
}

NOT: "filters" objesinde SADECE kullanıcının isteğine uygun filtreleri dahil et.
Hashtag kullanırken mutlaka # ile başlasın. Birden fazla hashtag için "hashtags" dizisi kullan.
Segment başlığı Türkçe olmalı ve filtreleri yansıtmalı.

Sadece JSON objesi döndür, başka metin ekleme.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: systemPrompt }],
        max_completion_tokens: 1000,
        temperature: 0.3,
      });

      let content = response.choices[0]?.message?.content || "{}";
      content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      
      try {
        const segmentData = JSON.parse(content);
        
        // Merge filters into metadata for URL generation
        const metadata = {
          ...(segmentData.metadata || { customerCount: 0, avgPremium: 0 }),
          filters: segmentData.filters || {},
        };
        
        const analysis: InsertAiAnalysis = {
          analysisType: "segmentation",
          title: segmentData.title || "Özel Segment",
          insight: segmentData.insight || prompt,
          confidence: Math.min(100, Math.max(0, parseInt(segmentData.confidence) || 75)),
          category: "Segmentasyon",
          customerIds: [],
          metadata,
          isActive: true,
        };

        await storage.createAiAnalysis(analysis);
        const analyses = await storage.getAllAiAnalyses();
        res.json({ success: true, analyses });
      } catch (parseError) {
        console.error("Error parsing custom segment response:", parseError);
        res.status(500).json({ message: "AI yanıtı işlenemedi" });
      }
    } catch (error) {
      console.error("Error creating custom segment:", error);
      res.status(500).json({ message: "Özel segment oluşturulamadı" });
    }
  });

  // Surprise Me - Find niche segment with max 10 customers
  app.post("/api/ai/surprise-me", isAuthenticated, async (req, res) => {
    try {
      if (!openai) {
        return res.status(503).json({ message: "AI özellikleri aktif değil. OPENAI_API_KEY gerekli." });
      }

      const profiles = await storage.getAllCustomerProfilesForAiAnalysis();
      if (profiles.length === 0) {
        return res.status(400).json({ message: "Analiz için müşteri profili bulunamadı" });
      }

      // Sample profiles with their hashtags for analysis
      const sampleSize = Math.min(200, profiles.length);
      const sampledProfiles = profiles.slice(0, sampleSize).map((p: any) => ({
        id: p.id,
        name: p.musteriIsmi,
        city: p.sehir,
        customerType: p.musteriTipi,
        products: p.products,
        totalPolicies: p.totalPolicies,
        totalPremium: p.totalPremium,
        vehicleCount: p.vehicleCount,
        hashtags: p.aiAnaliz,
      }));

      // Get available hashtags from profiles
      const allHashtags = new Set<string>();
      sampledProfiles.forEach((p: any) => {
        if (p.hashtags) {
          p.hashtags.split(/\s+/).filter((t: string) => t.startsWith('#')).forEach((t: string) => allHashtags.add(t));
        }
      });
      const availableHashtags = Array.from(allHashtags).slice(0, 30);

      const systemPrompt = `Sen yaratıcı bir sigorta analisti. Görevin: Müşteri verilerini analiz ederek ŞAŞIRTICI ve NİŞ bir segment bulmak.

Kurallar:
1. SADECE 3-10 müşteri profilini kapsayan çok spesifik bir niş segment bul
2. HASHTAG KOMBİNASYONLARI KULLAN! En az 1-2 hashtag içeren filtreler oluştur
3. Ya yeni ürün önerisi YA çapraz satış fırsatı YA da beklenmedik bir segment olsun
4. Gerçekten şaşırtıcı ve ilginç olsun!

Kullanılabilir hashtag'ler: ${availableHashtags.join(", ")}

Müşteri profilleri (örnek ${sampleSize} profil):
${JSON.stringify(sampledProfiles.slice(0, 50), null, 2)}

ÖNEMLİ: HASHTAG KOMBİNASYONLARI ÖNCELİKLİ!

HASHTAG KOMBİNASYON ÖRNEKLERİ (bunları yoğun kullan):
- Ürün + Hashtag: hasBranch="Oto Kaza (Kasko)" + hashtag="#sadik_musteri" → Kasko sahipleri arasında sadık müşteriler
- Şehir + Hashtag: city="İSTANBUL" + hashtag="#yuksek_potansiyel" → İstanbul'daki yüksek potansiyelli müşteriler
- Hashtag + Hashtag: hashtags=["#kurumsal", "#saglik"] → Kurumsal ve sağlık etiketli müşteriler
- Üç Hashtag: hashtags=["#bireysel", "#orta_yas", "#buyuksehir"] → Bireysel orta yaş büyükşehir müşterileri

Kullanılabilir filtreler:
- customerType: "Bireysel" veya "Kurumsal"
- city: Şehir adı (örn: "İSTANBUL")
- hashtag: Tek bir hashtag (örn: "#sadik_musteri")
- hashtags: Birden fazla hashtag (örn: ["#kurumsal", "#yuksek_potansiyel"])
- hasBranch: Ürün adı (örn: "Sağlık" veya "Oto Kaza (Kasko)")

Şu JSON formatında döndür:
{
  "title": "Şaşırtıcı segment adı (Türkçe, dikkat çekici)",
  "insight": "Bu segment neden özel? Ne önerilebilir? Detaylı açıklama ve pazarlama stratejisi.",
  "targetCustomers": ["Müşteri adı 1", "Müşteri adı 2", ...],
  "commonTraits": ["Ortak özellik 1", "Ortak özellik 2"],
  "recommendation": "Spesifik ürün/kampanya önerisi",
  "potentialRevenue": "Tahmini gelir potansiyeli",
  "filters": {
    "hashtags": ["#kurumsal", "#yuksek_potansiyel"],
    "city": "İSTANBUL"
  }
}

NOT: filters objesinde mutlaka en az bir hashtag veya hashtags filtresi kullan!
Hashtag kullanırken mutlaka # ile başlasın. Birden fazla hashtag için "hashtags" dizisi kullan.
Sadece JSON objesi döndür.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: systemPrompt }],
        max_completion_tokens: 1500,
        temperature: 0.8, // Higher temperature for more creative results
      });

      let content = response.choices[0]?.message?.content || "{}";
      content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      
      try {
        const surpriseData = JSON.parse(content);
        
        const analysis: InsertAiAnalysis = {
          analysisType: "segmentation",
          title: `[Surpriz] ${surpriseData.title || "Surpriz Segment"}`,
          insight: `${surpriseData.insight || ""}\n\nHedef Musteriler (${surpriseData.targetCustomers?.length || 0} kisi): ${surpriseData.targetCustomers?.join(", ") || "Belirleniyor"}\n\nOrtak Ozellikler: ${surpriseData.commonTraits?.join(", ") || ""}\n\nOneri: ${surpriseData.recommendation || ""}\n\nPotansiyel: ${surpriseData.potentialRevenue || "Hesaplanıyor"}`,
          confidence: 90,
          category: "Sürpriz Segment",
          customerIds: [],
          metadata: {
            customerCount: surpriseData.targetCustomers?.length || 0,
            isSurprise: true,
            targetCustomers: surpriseData.targetCustomers || [],
            commonTraits: surpriseData.commonTraits || [],
            filters: surpriseData.filters || {},
          },
          isActive: true,
        };

        await storage.createAiAnalysis(analysis);
        const analyses = await storage.getAllAiAnalyses();
        res.json({ success: true, analyses });
      } catch (parseError) {
        console.error("Error parsing surprise segment response:", parseError);
        console.log("Raw response:", content);
        res.status(500).json({ message: "AI yanıtı işlenemedi" });
      }
    } catch (error) {
      console.error("Error creating surprise segment:", error);
      res.status(500).json({ message: "Sürpriz segment oluşturulamadı" });
    }
  });

  // Customer Profiles API
  app.get("/api/customer-profiles/policy-types", isAuthenticated, async (req, res) => {
    try {
      const policyTypes = await storage.getDistinctPolicyTypes();
      res.json(policyTypes);
    } catch (error) {
      console.error("Error fetching policy types:", error);
      res.status(500).json({ message: "Poliçe türleri alınamadı" });
    }
  });

  app.get("/api/customer-profiles", isAuthenticated, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 25;
      const search = req.query.search as string;
      const city = req.query.city as string;
      const customerType = req.query.customerType as string;
      const policyType = req.query.policyType as string;
      let hashtags: string[] | undefined;
      const hashtagQuery = req.query.hashtag;
      const hashtagsQuery = req.query.hashtags as string;
      if (Array.isArray(hashtagQuery)) {
        hashtags = hashtagQuery.map(h => String(h).trim()).filter(h => h);
      } else if (hashtagQuery) {
        hashtags = [String(hashtagQuery).trim()];
      } else if (hashtagsQuery) {
        hashtags = hashtagsQuery.split(",").map(h => h.trim()).filter(h => h);
      }
      const product = req.query.product as string;
      const vehicleBrand = req.query.vehicleBrand as string;
      const hasAiAnalysis = req.query.hasAiAnalysis === "true";
      const hasBranch = req.query.hasBranch as string;
      const notHasBranch = req.query.notHasBranch as string;
      // Sanitize numeric params - ensure valid finite numbers
      const parsedPolicyCountMin = Number(req.query.policyCountMin);
      const policyCountMin = Number.isFinite(parsedPolicyCountMin) ? parsedPolicyCountMin : undefined;
      const parsedPolicyCountMax = Number(req.query.policyCountMax);
      const policyCountMax = Number.isFinite(parsedPolicyCountMax) ? parsedPolicyCountMax : undefined;
      const parsedVehicleCountMin = Number(req.query.vehicleCountMin);
      const vehicleCountMin = Number.isFinite(parsedVehicleCountMin) ? parsedVehicleCountMin : undefined;
      const parsedVehicleAgeMax = Number(req.query.vehicleAgeMax);
      const vehicleAgeMax = Number.isFinite(parsedVehicleAgeMax) ? parsedVehicleAgeMax : undefined;
      
      const result = await storage.getCustomerProfilesPaginated({
        page,
        limit,
        search,
        city,
        customerType,
        policyType,
        hashtags,
        product,
        vehicleBrand,
        hasAiAnalysis,
        hasBranch,
        notHasBranch,
        policyCountMin,
        policyCountMax,
        vehicleCountMin,
        vehicleAgeMax,
      });
      
      res.json(result);
    } catch (error) {
      console.error("Error fetching customer profiles:", error);
      res.status(500).json({ message: "Müşteri profilleri alınamadı" });
    }
  });

  app.get("/api/customer-profiles/:id", isAuthenticated, async (req, res) => {
    try {
      const profile = await storage.getCustomerProfile(req.params.id);
      if (!profile) {
        return res.status(404).json({ message: "Müşteri profili bulunamadı" });
      }
      res.json(profile);
    } catch (error) {
      console.error("Error fetching customer profile:", error);
      res.status(500).json({ message: "Müşteri profili alınamadı" });
    }
  });

  app.get("/api/customer-profiles/:id/policies", isAuthenticated, async (req, res) => {
    try {
      const profile = await storage.getCustomerProfile(req.params.id);
      if (!profile || !profile.hesapKodu) {
        return res.status(404).json({ message: "Müşteri profili bulunamadı" });
      }
      const policies = await storage.getCustomerPolicies(profile.hesapKodu);
      res.json(policies);
    } catch (error) {
      console.error("Error fetching customer policies:", error);
      res.status(500).json({ message: "Müşteri poliçeleri alınamadı" });
    }
  });

  app.post("/api/customer-profiles/sync", isAuthenticated, async (req, res) => {
    try {
      const result = await storage.syncCustomerProfiles();
      res.json({ 
        success: true, 
        message: `${result.created} yeni profil oluşturuldu, ${result.updated} profil güncellendi`,
        ...result 
      });
    } catch (error) {
      console.error("Error syncing customer profiles:", error);
      res.status(500).json({ message: "Müşteri profilleri senkronize edilemedi" });
    }
  });

  // AI Analysis for customer profiles - generates hashtags
  app.post("/api/customer-profiles/ai-analyze", isAuthenticated, async (req, res) => {
    try {
      if (!openai) {
        return res.status(503).json({ message: "AI özellikleri aktif değil. OPENAI_API_KEY gerekli." });
      }

      const profiles = await storage.getAllCustomerProfilesForAiAnalysis();
      if (profiles.length === 0) {
        return res.json({ success: true, message: "Analiz edilecek profil bulunamadı", analyzed: 0 });
      }

      let analyzed = 0;
      const batchSize = 10;

      for (let i = 0; i < profiles.length; i += batchSize) {
        const batch = profiles.slice(i, i + batchSize);
        
        const prompt = `Sen bir sigorta müşteri segmentasyon uzmanısın. Aşağıdaki müşteri profillerini analiz et ve her biri için hashtag'ler oluştur.

Hashtag'ler şunları yansıtmalı:
- Müşteri tipi (#bireysel, #kurumsal, #tuzel)
- Sahip olduğu sigorta ürünleri (#kasko, #trafik, #saglik, #konut, #isyeri, #nakliyat, #mesleki)
- Araç markası varsa segment (#premium, #luks, #ekonomik)
- Demografik özellikler (#genc, #orta_yas, #emekli, #aile)
- Şehir segmenti (#buyuksehir, #anadolu)
- Potansiyel (#yuksek_potansiyel, #sadik_musteri, #yenileme_riski)

Müşteri profilleri:
${batch.map((p, idx) => `
${idx + 1}. ID: ${p.id}
   Müşteri: ${p.musteriIsmi || 'Bilinmiyor'}
   Tip: ${p.musteriTipi || 'Bireysel'}
   Şehir: ${p.sehir || 'Bilinmiyor'}
   Ürünler: ${p.sahipOlunanUrunler || 'Yok'}
   Poliçe Türleri: ${p.sahipOlunanPoliceTurleri || 'Yok'}
   Araçlar: ${p.aracBilgileri || 'Yok'}
   Aktif Poliçe: ${p.aktifPolice || 0}
   Toplam Prim: ${p.toplamBrutPrim || 0} TL
   Referans Grubu: ${p.referansGrubu || 'Yok'}
`).join('')}

Her müşteri için JSON formatında yanıt ver:
[
  {"id": "profil_id", "hashtags": "#tag1 #tag2 #tag3 ..."},
  ...
]

Sadece JSON array döndür, başka açıklama ekleme.`;

        try {
          const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: prompt }],
            max_completion_tokens: 2000,
            temperature: 0.3,
          });

          const content = response.choices[0]?.message?.content || "[]";
          const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          
          try {
            const results = JSON.parse(cleanContent);
            for (const result of results) {
              if (result.id && result.hashtags) {
                await storage.updateProfileAiAnalysis(result.id, result.hashtags);
                analyzed++;
              }
            }
          } catch (parseError) {
            console.error("Error parsing AI response:", parseError);
          }
        } catch (aiError) {
          console.error("Error calling OpenAI:", aiError);
        }

        // Small delay between batches to avoid rate limiting
        if (i + batchSize < profiles.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      res.json({ 
        success: true, 
        message: `${analyzed} müşteri profili analiz edildi`,
        analyzed,
        total: profiles.length
      });
    } catch (error) {
      console.error("Error in AI profile analysis:", error);
      res.status(500).json({ message: "AI analizi başarısız oldu" });
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
    case "cross_sell":
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
    case "churn_prediction":
      return `Sen deneyimli bir sigorta uzmanısın. İptal riski yüksek müşterileri ve iptal nedenlerini analiz et.

İptal istatistikleri:
- Toplam iptal: ${summary.cancellations}
- Toplam müşteri: ${summary.total}

Örnek veriler:
${JSON.stringify(sample.filter((c) => c.iptalSebebi).slice(0, 10), null, 2)}

Lütfen şu formatta iptal tahmin analizi yap:
[
  {
    "title": "Risk kategorisi veya analiz başlığı",
    "insight": "İptal nedenleri, risk faktörleri ve önleme önerileri",
    "confidence": 80,
    "category": "İptal Tahmini",
    "metadata": { "riskCustomers": 50 }
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

    case "segmentation":
      return `Sen deneyimli bir sigorta uzmanısın. Müşteri portföyünü segmentlere ayırarak analiz et.

Portföy özeti:
- Toplam müşteri: ${summary.total}
- Branşlar: ${summary.branches.join(", ")}
- Şehirler: ${summary.cities.join(", ")}

Örnek müşteriler:
${JSON.stringify(sample.slice(0, 5), null, 2)}

Lütfen şu formatta 4-6 müşteri segmenti belirle:
[
  {
    "title": "Segment adı",
    "insight": "Segment özellikleri, davranış kalıpları ve pazarlama önerileri",
    "confidence": 85,
    "category": "Segmentasyon",
    "metadata": { "customerCount": 500, "avgPremium": 5000 }
  }
]

Sadece JSON array döndür.`;

    default:
      return `Müşteri portföyünü genel olarak analiz et. Toplam ${summary.total} müşteri var.`;
  }
}

function getCustomerPredictionPrompt(type: string, customers: any[]): string {
  const customerData = customers.slice(0, 100).map((c) => ({
    id: c.id,
    name: c.musteriIsmi,
    product: c.anaBrans,
    city: c.sehir,
    premium: c.brut,
    cancelReason: c.iptalSebebi || c.iptalNedeni,
  }));

  if (type === "churn_prediction") {
    return `Sen deneyimli bir sigorta uzmanısın. Aşağıdaki müşterilerin iptal risklerini analiz et.

Müşteri listesi:
${JSON.stringify(customerData, null, 2)}

Her müşteri için iptal riski tahmini yap. Şu JSON formatında döndür:
[
  {
    "customerId": "müşteri id",
    "customerName": "müşteri adı",
    "currentProduct": "mevcut sigorta ürünü",
    "probability": 75,
    "reason": "Potansiyel iptal sebebi açıklaması",
    "city": "şehir"
  }
]

Kurallar:
- probability 0-100 arası olasılık yüzdesi olmalı
- En yüksek riskli müşterilerden başla
- reason alanına müşterinin neden iptal edebileceğini açıkla
- EN AZ 50 müşteri için tahmin yap, mümkünse tüm müşteriler için
- Sadece JSON array döndür, başka metin ekleme`;
  }

  if (type === "cross_sell") {
    return `Sen deneyimli bir sigorta uzmanısın. Aşağıdaki müşterilere çapraz satış fırsatlarını analiz et.

Müşteri listesi:
${JSON.stringify(customerData, null, 2)}

Her müşteri için çapraz satış önerisi yap. Şu JSON formatında döndür:
[
  {
    "customerId": "müşteri id",
    "customerName": "müşteri adı",
    "currentProduct": "mevcut sigorta ürünü",
    "suggestedProduct": "önerilen yeni ürün",
    "probability": 85,
    "reason": "Neden bu ürünü satın alabilir açıklaması",
    "city": "şehir"
  }
]

Kurallar:
- probability 0-100 arası satış başarı olasılığı olmalı
- suggestedProduct olarak Kasko, Trafik, Sağlık, Konut, DASK, Ferdi Kaza, Seyahat gibi ürünler öner
- En yüksek satış potansiyeli olan müşterilerden başla
- reason alanına satış argümanını açıkla
- EN AZ 50 müşteri için öneri yap, mümkünse tüm müşteriler için
- Sadece JSON array döndür, başka metin ekleme`;
  }

  return `Müşteri portföyünü analiz et. ${customers.length} müşteri var.`;
}

// Analysis prompt using customer profiles with hashtags
function getProfileAnalysisPrompt(type: string, profiles: any[]): string {
  const sample = profiles.slice(0, 50);
  const branchSet = new Set<string>();
  const citySet = new Set<string>();
  const hashtagSet = new Set<string>();
  
  profiles.forEach(p => {
    if (p.sahipOlunanUrunler) {
      p.sahipOlunanUrunler.split(',').forEach((b: string) => branchSet.add(b.trim()));
    }
    if (p.sehir) citySet.add(p.sehir);
    if (p.aiAnaliz) {
      p.aiAnaliz.split(' ').filter((h: string) => h.startsWith('#')).forEach((h: string) => hashtagSet.add(h));
    }
  });
  
  const summary = {
    total: profiles.length,
    branches: Array.from(branchSet),
    cities: Array.from(citySet).slice(0, 10),
    hashtags: Array.from(hashtagSet).slice(0, 20),
  };

  switch (type) {
    case "crossSell":
    case "cross_sell":
      return `Sen deneyimli bir sigorta uzmanısın. Müşteri profillerini ve hashtag'lerini analiz ederek çapraz satış fırsatlarını belirle.

Portföy özeti:
- Toplam müşteri profili: ${summary.total}
- Branşlar: ${summary.branches.join(", ")}
- Şehirler: ${summary.cities.join(", ")}
- Mevcut Hashtag'ler: ${summary.hashtags.join(" ")}

Örnek profiller (hashtag'ler dahil):
${JSON.stringify(sample.slice(0, 5).map(p => ({
  isim: p.musteriIsmi,
  urunler: p.sahipOlunanUrunler,
  sehir: p.sehir,
  hashtags: p.aiAnaliz
})), null, 2)}

Lütfen şu formatta 3-5 çapraz satış fırsatı belirle. Hashtag'leri dikkate al:
[
  {
    "title": "Fırsat başlığı",
    "insight": "Detaylı açıklama - hashtag'lere dayalı önerileri içersin",
    "confidence": 85,
    "category": "Çapraz Satış",
    "metadata": { "potentialCustomers": 100, "filters": { "hasBranch": "mevcut ürün", "notHasBranch": "önerilen ürün" } }
  }
]

Sadece JSON array döndür.`;

    case "cancellation":
    case "churn_prediction":
      return `Sen deneyimli bir sigorta uzmanısın. Müşteri profillerini ve hashtag'lerini analiz ederek iptal riski yüksek segmentleri belirle.

Portföy özeti:
- Toplam müşteri profili: ${summary.total}
- Mevcut Hashtag'ler: ${summary.hashtags.join(" ")}

Örnek profiller:
${JSON.stringify(sample.slice(0, 5).map(p => ({
  isim: p.musteriIsmi,
  urunler: p.sahipOlunanUrunler,
  hashtags: p.aiAnaliz
})), null, 2)}

Lütfen şu formatta iptal riski analizi yap. #yenileme_riski, #sadik_musteri gibi hashtag'leri dikkate al:
[
  {
    "title": "Risk kategorisi veya analiz başlığı",
    "insight": "İptal nedenleri, risk faktörleri ve önleme önerileri - hashtag'lere dayalı",
    "confidence": 80,
    "category": "İptal Tahmini",
    "metadata": { "riskCustomers": 50 }
  }
]

Sadece JSON array döndür.`;

    case "segmentation":
      return `Sen deneyimli bir sigorta uzmanısın. Müşteri profillerini ve hashtag'lerini kullanarak segmentlere ayır.

Portföy özeti:
- Toplam müşteri profili: ${summary.total}
- Branşlar: ${summary.branches.join(", ")}
- Şehirler: ${summary.cities.join(", ")}
- Mevcut Hashtag'ler: ${summary.hashtags.join(" ")}

Örnek profiller:
${JSON.stringify(sample.slice(0, 5).map(p => ({
  isim: p.musteriIsmi,
  tip: p.musteriTipi,
  urunler: p.sahipOlunanUrunler,
  sehir: p.sehir,
  hashtags: p.aiAnaliz
})), null, 2)}

Lütfen şu formatta 4-6 müşteri segmenti belirle. Hashtag'leri dikkate al (#premium, #ekonomik, #aile, #kurumsal vb.):
[
  {
    "title": "Segment adı",
    "insight": "Segment özellikleri, davranış kalıpları ve pazarlama önerileri - hashtag'lere dayalı",
    "confidence": 85,
    "category": "Segmentasyon",
    "metadata": { "customerCount": 500, "avgPremium": 5000, "filters": { "customerType": "Bireysel", "hasBranch": "ürün" } }
  }
]

Sadece JSON array döndür.`;

    case "products":
      return `Sen deneyimli bir sigorta uzmanısın. Mevcut portföy ve hashtag'lere göre yeni ürün önerileri ver.

Mevcut branşlar: ${summary.branches.join(", ")}
Toplam müşteri profili: ${summary.total}
Mevcut Hashtag'ler: ${summary.hashtags.join(" ")}

Lütfen şu formatta 2-4 yeni ürün önerisi ver:
[
  {
    "title": "Ürün önerisi başlığı",
    "insight": "Neden bu ürün ve hangi segmente sunulmalı - hashtag'lere dayalı",
    "confidence": 75,
    "category": "Ürün Önerisi"
  }
]

Sadece JSON array döndür.`;

    default:
      return `Müşteri profillerini ve hashtag'lerini analiz et. Toplam ${summary.total} profil var. Hashtag'ler: ${summary.hashtags.join(" ")}`;
  }
}

// New function using customer profiles with hashtags for richer AI analysis
function getCustomerProfilePredictionPrompt(type: string, profiles: any[]): string {
  const profileData = profiles.slice(0, 100).map((p) => ({
    profileId: p.id,
    name: p.musteriIsmi,
    customerType: p.musteriTipi,
    city: p.sehir,
    products: p.sahipOlunanUrunler,
    policyTypes: p.sahipOlunanPoliceTurleri,
    activePolicy: p.aktifPolice,
    totalPremium: p.toplamBrutPrim,
    vehicles: p.aracBilgileri,
    hashtags: p.aiAnaliz || "",
  }));

  if (type === "churn_prediction") {
    return `Sen deneyimli bir sigorta uzmanısın. Aşağıdaki müşteri profillerinin iptal risklerini analiz et.

Müşteri Profilleri (Hashtag'ler dahil):
${JSON.stringify(profileData, null, 2)}

Her müşteri profili için iptal riski tahmini yap. Hashtag'leri de dikkate al (örn: #yenileme_riski, #sadik_musteri, #yuksek_potansiyel).
Şu JSON formatında döndür:
[
  {
    "profileId": "profil id",
    "customerName": "müşteri adı",
    "currentProduct": "sahip olduğu ana ürünler",
    "probability": 75,
    "reason": "Potansiyel iptal sebebi açıklaması - hashtag'leri de kullanarak",
    "city": "şehir",
    "hashtags": "ilgili hashtag'ler"
  }
]

Kurallar:
- probability 0-100 arası olasılık yüzdesi olmalı
- Hashtag'ler analizi zenginleştirmeli (örn: #yenileme_riski yüksek risk gösterir)
- En yüksek riskli müşterilerden başla
- reason alanına müşterinin neden iptal edebileceğini açıkla
- EN AZ 50 profil için tahmin yap, mümkünse tüm profiller için
- Sadece JSON array döndür, başka metin ekleme`;
  }

  if (type === "cross_sell") {
    return `Sen deneyimli bir sigorta uzmanısın. Aşağıdaki müşteri profillerine çapraz satış fırsatlarını analiz et.

Müşteri Profilleri (Hashtag'ler dahil):
${JSON.stringify(profileData, null, 2)}

Her müşteri profili için çapraz satış önerisi yap. Hashtag'leri de dikkate al (örn: #yuksek_potansiyel, #premium, #aile).
Şu JSON formatında döndür:
[
  {
    "profileId": "profil id",
    "customerName": "müşteri adı",
    "currentProduct": "sahip olduğu ana ürünler",
    "suggestedProduct": "önerilen yeni ürün",
    "probability": 85,
    "reason": "Neden bu ürünü satın alabilir - hashtag'lere dayalı önerileri içersin",
    "city": "şehir",
    "hashtags": "ilgili hashtag'ler"
  }
]

Kurallar:
- probability 0-100 arası satış başarı olasılığı olmalı
- Hashtag'ler önerilerinizi desteklemeli (örn: #aile olan müşteriye çocuk sağlık sigortası öner)
- suggestedProduct: Kasko, Trafik, Sağlık, Konut, DASK, Ferdi Kaza, Seyahat, İşyeri gibi ürünler
- En yüksek satış potansiyeli olan profillerden başla
- reason alanına satış argümanını açıkla
- EN AZ 50 profil için öneri yap, mümkünse tüm profiller için
- Sadece JSON array döndür, başka metin ekleme`;
  }

  return `Müşteri profillerini analiz et. ${profiles.length} profil var.`;
}
