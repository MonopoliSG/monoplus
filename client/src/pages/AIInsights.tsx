import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, RefreshCw, TrendingUp, AlertTriangle, ShoppingCart, FileSpreadsheet, Users, ExternalLink, Search, Filter, Wand2, Trash2, Hash, Tag, Gift, Save, Phone, Mail, MapPin } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { AiCustomerPrediction, AiAnalysis, CustomerProfile } from "@shared/schema";
import { buildCustomerFilterUrl } from "./Customers";

// Build URL for customer profiles page with filters
function buildProfileFilterUrl(filters: {
  search?: string;
  city?: string;
  customerType?: string;
  policyType?: string;
  product?: string;
  hashtag?: string;
  hashtags?: string[];
  hasBranch?: string;
  notHasBranch?: string;
  policyCountMin?: number;
  policyCountMax?: number;
  vehicleCountMin?: number;
  vehicleAgeMax?: number;
}): string {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.city) params.set("city", filters.city);
  if (filters.customerType) params.set("customerType", filters.customerType);
  if (filters.policyType) params.set("policyType", filters.policyType);
  if (filters.product) params.set("product", filters.product);
  if (filters.hashtags && filters.hashtags.length > 0) {
    filters.hashtags.forEach(h => params.append("hashtag", h.replace(/^#/, '')));
  } else if (filters.hashtag) {
    params.append("hashtag", filters.hashtag.replace(/^#/, ''));
  }
  if (filters.hasBranch) params.set("hasBranch", filters.hasBranch);
  if (filters.notHasBranch) params.set("notHasBranch", filters.notHasBranch);
  if (filters.policyCountMin !== undefined) params.set("policyCountMin", filters.policyCountMin.toString());
  if (filters.policyCountMax !== undefined) params.set("policyCountMax", filters.policyCountMax.toString());
  if (filters.vehicleCountMin !== undefined) params.set("vehicleCountMin", filters.vehicleCountMin.toString());
  if (filters.vehicleAgeMax !== undefined) params.set("vehicleAgeMax", filters.vehicleAgeMax.toString());
  const queryString = params.toString();
  return queryString ? `/customer-profiles?${queryString}` : "/customer-profiles";
}

// Product name mapping for Turkish insurance products
const productNameMapping: Record<string, string> = {
  "kasko": "Oto Kaza (Kasko)",
  "trafik": "Oto Kaza (Trafik)",
  "dask": "Dask",
  "sağlık": "Sağlık",
  "saglik": "Sağlık",
  "konut": "Yangın (Konut)",
  "yangın": "Yangın (Konut)",
  "yangin": "Yangın (Konut)",
  "seyahat": "Seyahat Sağlık",
  "ferdi kaza": "Ferdi Kaza",
  "nakliyat": "Nakliyat",
  "işyeri": "Yangın (İşyeri)",
  "isyeri": "Yangın (İşyeri)",
  "mühendislik": "Mühendislik",
  "muhendislik": "Mühendislik",
  "sorumluluk": "Sorumluluk",
  "hayat": "Hayat",
};

// Helper to find product name from text
function findProductInText(text: string): string | null {
  const lowerText = text.toLowerCase().replace(/i̇/g, 'i').replace(/ı/g, 'i');
  
  // Check multi-word products first (like "ferdi kaza")
  for (const [key, value] of Object.entries(productNameMapping)) {
    if (key.includes(" ") && lowerText.includes(key)) {
      return value;
    }
  }
  
  // Then check single-word products
  for (const [key, value] of Object.entries(productNameMapping)) {
    if (!key.includes(" ") && lowerText.includes(key)) {
      return value;
    }
  }
  
  return null;
}

// Extended metadata type with filters from AI
interface SegmentMetadata {
  city?: string;
  branch?: string;
  customerType?: string;
  filters?: {
    city?: string;
    branch?: string;
    customerType?: string;
    hasBranch?: string;
    notHasBranch?: string;
    hashtag?: string;
    hashtags?: string[];
    minAge?: number;
    // Advanced filters for management reports
    hasBranch2?: string;
    notHasBranch2?: string;
    policyCountMin?: number;
    policyCountMax?: number;
    renewalProduct?: string;
    vehicleCountMin?: number;
    vehicleAgeMax?: number;
  };
}

// Reverse mapping from display name to raw branch key for profile filters
const reverseProductMapping: Record<string, string> = {
  "Oto Kaza (Kasko)": "Kasko",
  "Oto Kaza (Trafik)": "Trafik",
  "Dask": "DASK",
  "Sağlık": "Sağlık",
  "Yangın (Konut)": "Konut",
  "Seyahat Sağlık": "Seyahat",
  "Ferdi Kaza": "Ferdi Kaza",
  "Nakliyat": "Nakliyat",
  "Yangın (İşyeri)": "İşyeri",
  "Mühendislik": "Mühendislik",
  "Sorumluluk": "Sorumluluk",
  "Hayat": "Hayat",
};

// Parse segment title and metadata to build profile filter URL (uses customer_profiles)
function buildSegmentProfileUrl(segmentTitle: string, metadata?: SegmentMetadata): string {
  const title = segmentTitle;
  const lowerTitle = title.toLowerCase().replace(/i̇/g, 'i').replace(/ı/g, 'i');
  const filters: { 
    city?: string; 
    customerType?: string; 
    product?: string; 
    policyType?: string;
    hasBranch?: string;
    notHasBranch?: string;
    hashtag?: string;
    hashtags?: string[];
    policyCountMin?: number;
    policyCountMax?: number;
    vehicleCountMin?: number;
    vehicleAgeMax?: number;
  } = {};
  
  // Use filters from metadata if available (most accurate - from AI response)
  if (metadata?.filters) {
    const f = metadata.filters;
    if (f.city) filters.city = f.city;
    if (f.customerType) filters.customerType = f.customerType;
    if (f.branch) {
      filters.product = reverseProductMapping[f.branch] || f.branch;
    }
    // Normalize hasBranch/notHasBranch to raw branch keys for sahipOlunanUrunler matching
    if (f.hasBranch) {
      filters.hasBranch = reverseProductMapping[f.hasBranch] || f.hasBranch;
    }
    if (f.notHasBranch) {
      filters.notHasBranch = reverseProductMapping[f.notHasBranch] || f.notHasBranch;
    }
    if (f.policyCountMin !== undefined) filters.policyCountMin = f.policyCountMin;
    if (f.policyCountMax !== undefined) filters.policyCountMax = f.policyCountMax;
    if (f.vehicleCountMin !== undefined) filters.vehicleCountMin = f.vehicleCountMin;
    if (f.vehicleAgeMax !== undefined) filters.vehicleAgeMax = f.vehicleAgeMax;
    if (f.hashtags && f.hashtags.length > 0) {
      filters.hashtags = f.hashtags;
    } else if (f.hashtag) {
      filters.hashtags = [f.hashtag];
    }
  }
  
  // Also check legacy metadata fields
  if (!filters.city && metadata?.city) filters.city = metadata.city;
  if (!filters.customerType && metadata?.customerType) filters.customerType = metadata.customerType;
  if (!filters.product && metadata?.branch) {
    filters.product = reverseProductMapping[metadata.branch] || metadata.branch;
  }
  
  // Detect customer type from title if not already set
  if (!filters.customerType) {
    if (lowerTitle.includes("kurumsal") || lowerTitle.includes("tüzel")) {
      filters.customerType = "Kurumsal";
    } else if (lowerTitle.includes("bireysel") || lowerTitle.includes("gerçek")) {
      filters.customerType = "Bireysel";
    }
  }
  
  // Detect product from title using raw branch key if not already set
  // Don't set product if notHasBranch is set (they're contradictory - notHasBranch means customer DOESN'T have that product)
  if (!filters.product && !filters.hasBranch && !filters.notHasBranch) {
    const displayProduct = findProductInText(title);
    if (displayProduct) {
      filters.product = reverseProductMapping[displayProduct] || displayProduct;
    }
  }
  
  return buildProfileFilterUrl(filters);
}

// Parse segment title and metadata to build appropriate filters (legacy - uses customers table)
function buildSegmentFilterUrl(segmentTitle: string, metadata?: SegmentMetadata): string {
  const title = segmentTitle;
  const lowerTitle = title.toLowerCase().replace(/i̇/g, 'i').replace(/ı/g, 'i');
  const filters: Parameters<typeof buildCustomerFilterUrl>[0] = {};
  
  // Priority 1: Use filters from metadata if available (most accurate - from AI response)
  if (metadata?.filters) {
    const f = metadata.filters;
    if (f.city) filters.city = f.city;
    if (f.branch) filters.branch = f.branch;
    if (f.customerType) filters.customerType = f.customerType;
    if (f.hasBranch) filters.hasBranch = f.hasBranch;
    if (f.notHasBranch) filters.notHasBranch = f.notHasBranch;
    if (f.minAge) filters.minAge = f.minAge;
    // Advanced filters from AI
    if (f.hasBranch2) filters.hasBranch2 = f.hasBranch2;
    if (f.notHasBranch2) filters.notHasBranch2 = f.notHasBranch2;
    if (f.policyCountMin !== undefined) filters.policyCountMin = f.policyCountMin;
    if (f.policyCountMax !== undefined) filters.policyCountMax = f.policyCountMax;
    if (f.renewalProduct) filters.renewalProduct = f.renewalProduct;
    if (f.vehicleCountMin !== undefined) filters.vehicleCountMin = f.vehicleCountMin;
    if (f.vehicleAgeMax !== undefined) filters.vehicleAgeMax = f.vehicleAgeMax;
    
    // If we have filters from metadata, use them directly
    if (Object.keys(filters).length > 0) {
      return buildCustomerFilterUrl(filters);
    }
  }
  
  // Priority 2: Use legacy metadata fields
  if (metadata?.city) {
    filters.city = metadata.city;
  }
  if (metadata?.customerType) {
    filters.customerType = metadata.customerType;
  }
  
  // Advanced pattern detection: "X Olan" (has product) and "X Olmayan" (doesn't have product)
  // Pattern: "Kasko Sigortası Olan, Trafik Sigortası Olmayan Müşteriler"
  // Pattern: "Kasko Sigortası Olan ve Trafik Sigortası Olmayan Müşteriler"
  
  // Split by comma and "ve" (and) to handle multiple conditions
  const parts = title.split(/[,،]|\s+ve\s+/i);
  
  for (const part of parts) {
    const trimmedPart = part.trim();
    const lowerPart = trimmedPart.toLowerCase().replace(/i̇/g, 'i').replace(/ı/g, 'i');
    
    // Check for "Olmayan" pattern (NOT has product)
    if (lowerPart.includes("olmayan") || lowerPart.includes(" yok") || lowerPart.includes("sahip olmayan")) {
      const product = findProductInText(trimmedPart);
      if (product && !filters.notHasBranch) {
        filters.notHasBranch = product;
      }
    }
    // Check for "Olan" pattern (HAS product) - but not if it contains "olmayan"
    else if ((lowerPart.includes(" olan") || lowerPart.includes("sahip") || lowerPart.includes(" var")) && 
             !lowerPart.includes("olmayan")) {
      const product = findProductInText(trimmedPart);
      if (product && !filters.hasBranch) {
        filters.hasBranch = product;
      }
    }
  }
  
  // If no hasBranch/notHasBranch patterns found, use metadata branch or detect from title
  if (!filters.hasBranch && !filters.notHasBranch) {
    if (metadata?.branch) {
      filters.branch = metadata.branch;
    } else {
      // Simple branch detection for segments without "olan/olmayan" pattern
      const product = findProductInText(title);
      if (product) {
        filters.branch = product;
      }
    }
  }
  
  // Detect customer type from title if not in metadata
  if (!filters.customerType) {
    if (lowerTitle.includes("kurumsal") || lowerTitle.includes("tüzel")) {
      filters.customerType = "kurumsal";
    } else if (lowerTitle.includes("bireysel") || lowerTitle.includes("gerçek")) {
      filters.customerType = "bireysel";
    }
  }
  
  // Detect city from title
  if (!filters.city) {
    const turkishCities = [
      "istanbul", "ankara", "izmir", "bursa", "antalya", "adana", "konya", 
      "gaziantep", "mersin", "diyarbakır", "kayseri", "eskişehir", "samsun",
      "denizli", "şanlıurfa", "malatya", "trabzon", "erzurum", "van"
    ];
    for (const city of turkishCities) {
      if (lowerTitle.includes(city)) {
        filters.city = city.charAt(0).toUpperCase() + city.slice(1).toUpperCase();
        break;
      }
    }
  }
  
  // Detect age-based filters (e.g., "25 yaş üstü", "65 yaş üzeri")
  const ageMatch = lowerTitle.match(/(\d+)\s*yaş\s*(üstü|üzeri|ve üzeri|ve üstü)/);
  if (ageMatch) {
    filters.minAge = parseInt(ageMatch[1]);
  }
  
  return buildCustomerFilterUrl(filters);
}

interface Filters {
  search: string;
  product: string;
  city: string;
  minProbability: number;
  maxProbability: number;
}

export default function AIInsights() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("churn");
  const [churnFilters, setChurnFilters] = useState<Filters>({
    search: "",
    product: "",
    city: "",
    minProbability: 0,
    maxProbability: 100,
  });
  const [crossSellFilters, setCrossSellFilters] = useState<Filters>({
    search: "",
    product: "",
    city: "",
    minProbability: 0,
    maxProbability: 100,
  });
  const [customSegmentPrompt, setCustomSegmentPrompt] = useState("");
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);

  const { data: churnPredictions = [], isLoading: churnLoading } = useQuery<AiCustomerPrediction[]>({
    queryKey: ["/api/ai/predictions", "churn_prediction", churnFilters],
    queryFn: async () => {
      const params = new URLSearchParams({
        analysisType: "churn_prediction",
        ...(churnFilters.search && { search: churnFilters.search }),
        ...(churnFilters.product && { product: churnFilters.product }),
        ...(churnFilters.city && { city: churnFilters.city }),
        ...(churnFilters.minProbability > 0 && { minProbability: churnFilters.minProbability.toString() }),
        ...(churnFilters.maxProbability < 100 && { maxProbability: churnFilters.maxProbability.toString() }),
      });
      const res = await fetch(`/api/ai/predictions?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch predictions");
      return res.json();
    },
  });

  const { data: crossSellPredictions = [], isLoading: crossSellLoading } = useQuery<AiCustomerPrediction[]>({
    queryKey: ["/api/ai/predictions", "cross_sell", crossSellFilters],
    queryFn: async () => {
      const params = new URLSearchParams({
        analysisType: "cross_sell",
        ...(crossSellFilters.search && { search: crossSellFilters.search }),
        ...(crossSellFilters.product && { product: crossSellFilters.product }),
        ...(crossSellFilters.city && { city: crossSellFilters.city }),
        ...(crossSellFilters.minProbability > 0 && { minProbability: crossSellFilters.minProbability.toString() }),
        ...(crossSellFilters.maxProbability < 100 && { maxProbability: crossSellFilters.maxProbability.toString() }),
      });
      const res = await fetch(`/api/ai/predictions?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch predictions");
      return res.json();
    },
  });

  const { data: segmentAnalyses = [], isLoading: segmentLoading } = useQuery<AiAnalysis[]>({
    queryKey: ["/api/ai/analyses"],
    select: (data) => data.filter((a) => a.analysisType === "segmentation"),
  });

  // Cancellation Analysis Dashboard Data
  interface CancellationAnalysis {
    generalStats: { toplamPolice: number; iptalAdedi: number; iptalOrani: number };
    cancelReasons: { reason: string; count: number; percentage: number }[];
    monthlyTrend: { month: string; count: number }[];
    branchBreakdown: { branch: string; total: number; cancelled: number; cancelRate: number }[];
    companyBreakdown: { company: string; total: number; cancelled: number; cancelRate: number }[];
    lifetimeDistribution: { label: string; count: number; percentage: number }[];
    riskyProducts: { product: string; totalPolicies: number; cancelledPolicies: number; cancelRate: number }[];
  }

  const { data: cancellationAnalysis, isLoading: cancellationLoading } = useQuery<CancellationAnalysis>({
    queryKey: ["/api/ai/cancellation-analysis"],
    queryFn: async () => {
      const res = await fetch("/api/ai/cancellation-analysis", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch cancellation analysis");
      return res.json();
    },
  });

  const { data: profilesWithHashtags = [], isLoading: hashtagsLoading } = useQuery<CustomerProfile[]>({
    queryKey: ["/api/customer-profiles/all"],
    queryFn: async () => {
      const res = await fetch(`/api/customer-profiles?limit=10000`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch profiles");
      const data = await res.json();
      return data.profiles || [];
    },
  });

  const allHashtags = Array.from(
    new Set(
      profilesWithHashtags
        .filter(p => p.aiAnaliz)
        .flatMap(p => p.aiAnaliz?.split(/\s+/).filter(tag => tag.startsWith('#')) || [])
    )
  ).sort();

  const filteredProfiles = selectedHashtags.length === 0
    ? profilesWithHashtags.filter(p => p.aiAnaliz)
    : profilesWithHashtags.filter(p => {
        if (!p.aiAnaliz) return false;
        const profileTags = p.aiAnaliz.split(/\s+/).filter(tag => tag.startsWith('#'));
        return selectedHashtags.every(tag => profileTags.includes(tag));
      });

  const runChurnMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ai/analyze-customers", { type: "churn_prediction" });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/predictions", "churn_prediction"] });
      toast({ title: "Analiz tamamlandı", description: `${data.count} müşteri analiz edildi` });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Oturum sonlandı", variant: "destructive" });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({ title: "Hata", description: "Analiz yapılamadı", variant: "destructive" });
    },
  });

  const runCrossSellMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ai/analyze-customers", { type: "cross_sell" });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/predictions", "cross_sell"] });
      toast({ title: "Analiz tamamlandı", description: `${data.count} müşteri analiz edildi` });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Oturum sonlandı", variant: "destructive" });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({ title: "Hata", description: "Analiz yapılamadı", variant: "destructive" });
    },
  });

  const runSegmentMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ai/analyze", { type: "segmentation" });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/analyses"] });
      toast({ title: "Segment analizi tamamlandı" });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Oturum sonlandı", variant: "destructive" });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({ title: "Hata", description: "Analiz yapılamadı", variant: "destructive" });
    },
  });

  const runCustomSegmentMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const res = await apiRequest("POST", "/api/ai/analyze-custom-segment", { prompt });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/analyses"] });
      setCustomSegmentPrompt("");
      toast({ title: "Özel segment oluşturuldu" });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Oturum sonlandı", variant: "destructive" });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({ title: "Hata", description: "Segment oluşturulamadı", variant: "destructive" });
    },
  });

  const deleteSegmentMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/ai/analyses/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/analyses"] });
      toast({ title: "Segment silindi" });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Oturum sonlandı", variant: "destructive" });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({ title: "Hata", description: "Segment silinemedi", variant: "destructive" });
    },
  });

  const saveToSegmentsMutation = useMutation({
    mutationFn: async (analysis: AiAnalysis) => {
      const metadata = analysis.metadata as SegmentMetadata | null;
      const filters = metadata?.filters || {};
      
      const filterCriteria: Record<string, any> = { ...filters };
      
      if (filters.hashtag && !filterCriteria.hashtags) {
        filterCriteria.hashtags = [filters.hashtag];
      }
      
      if (metadata?.city && !filterCriteria.city) filterCriteria.city = metadata.city;
      if (metadata?.branch && !filterCriteria.branch) filterCriteria.branch = metadata.branch;
      if (metadata?.customerType && !filterCriteria.customerType) filterCriteria.customerType = metadata.customerType;
      
      const res = await apiRequest("POST", "/api/segments", {
        name: analysis.title,
        description: analysis.insight,
        filterCriteria,
        aiInsight: analysis.insight,
        isAutoGenerated: true,
        customerCount: 0,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/segments"] });
      toast({ title: "Segment kaydedildi", description: "Artık kampanya oluştururken bu segmenti seçebilirsiniz." });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Oturum sonlandı", variant: "destructive" });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({ title: "Hata", description: "Segment kaydedilemedi", variant: "destructive" });
    },
  });

  const surpriseMeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ai/surprise-me");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/analyses"] });
      toast({ title: "Sürpriz analiz tamamlandı", description: "Yeni bir niş segment keşfedildi!" });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Oturum sonlandı", variant: "destructive" });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({ title: "Hata", description: "Sürpriz analiz yapılamadı", variant: "destructive" });
    },
  });

  const exportToExcel = async (analysisType: string, filters: Filters) => {
    try {
      const res = await apiRequest("POST", "/api/ai/predictions/export", {
        analysisType,
        search: filters.search || undefined,
        product: filters.product || undefined,
        city: filters.city || undefined,
        minProbability: filters.minProbability > 0 ? filters.minProbability : undefined,
        maxProbability: filters.maxProbability < 100 ? filters.maxProbability : undefined,
      });
      
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${analysisType}_${new Date().toISOString().split("T")[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Excel dosyası indirildi" });
    } catch (error) {
      if (error instanceof Error && isUnauthorizedError(error)) {
        toast({ title: "Oturum sonlandı", variant: "destructive" });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      const errorMessage = error instanceof Error ? error.message : "Bilinmeyen hata";
      toast({ title: "Export başarısız", description: errorMessage, variant: "destructive" });
    }
  };

  const isAnalyzing = runChurnMutation.isPending || runCrossSellMutation.isPending || runSegmentMutation.isPending || runCustomSegmentMutation.isPending || surpriseMeMutation.isPending;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2" data-testid="text-page-title">
            <Sparkles className="h-6 w-6 text-primary" />
            AI Analizler
          </h1>
          <p className="text-muted-foreground">Müşteri bazında yapay zeka destekli tahminler</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              İptal Risk Tahminleri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{churnPredictions.length}</div>
            <p className="text-xs text-muted-foreground">müşteri analiz edildi</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Çapraz Satış Fırsatları
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{crossSellPredictions.length}</div>
            <p className="text-xs text-muted-foreground">fırsat belirlendi</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Segment Analizleri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{segmentAnalyses.length}</div>
            <p className="text-xs text-muted-foreground">analiz yapıldı</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="churn" data-testid="tab-churn">İptal Tahminleri</TabsTrigger>
          <TabsTrigger value="crosssell" data-testid="tab-crosssell">Çapraz Satış</TabsTrigger>
          <TabsTrigger value="segments" data-testid="tab-segments">Segmentasyon</TabsTrigger>
          <TabsTrigger value="hashtags" data-testid="tab-hashtags">
            <Hash className="h-4 w-4 mr-1" />
            Hashtag Segmentleri
          </TabsTrigger>
        </TabsList>

        <TabsContent value="churn" className="space-y-4">
          {/* Cancellation Analysis Dashboard */}
          {cancellationLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-muted rounded" />
                ))}
              </div>
            </div>
          ) : cancellationAnalysis && cancellationAnalysis.generalStats.toplamPolice > 0 ? (
            <>
              {/* General Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Poliçe</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-total-policies">
                      {cancellationAnalysis.generalStats.toplamPolice.toLocaleString("tr-TR")}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">İptal Edilen</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-destructive" data-testid="text-cancelled-policies">
                      {cancellationAnalysis.generalStats.iptalAdedi.toLocaleString("tr-TR")}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">İptal Oranı</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-cancel-rate">
                      %{cancellationAnalysis.generalStats.iptalOrani}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Cancel Reasons & Lifetime Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Cancel Reasons */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      İptal Sebepleri Dağılımı
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[280px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Sebep</TableHead>
                            <TableHead className="text-right">Adet</TableHead>
                            <TableHead className="text-right">Oran</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cancellationAnalysis.cancelReasons.map((r, i) => (
                            <TableRow key={i}>
                              <TableCell className="font-medium">{r.reason}</TableCell>
                              <TableCell className="text-right">{r.count.toLocaleString("tr-TR")}</TableCell>
                              <TableCell className="text-right">%{r.percentage}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Lifetime Distribution */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Poliçe Yaşam Süresi Dağılımı
                    </CardTitle>
                    <CardDescription>İptal edilen poliçelerin satıştan iptale kadar geçen süre</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {cancellationAnalysis.lifetimeDistribution.map((bucket, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-24 text-sm text-muted-foreground">{bucket.label}</div>
                          <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                            <div 
                              className="h-full bg-primary/60 rounded"
                              style={{ width: `${bucket.percentage}%` }}
                            />
                          </div>
                          <div className="w-20 text-sm text-right">
                            {bucket.count.toLocaleString("tr-TR")} (%{bucket.percentage})
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Branch & Company Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Branch Breakdown */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Branş Bazında İptal Oranları</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[250px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Branş</TableHead>
                            <TableHead className="text-right">Toplam</TableHead>
                            <TableHead className="text-right">İptal</TableHead>
                            <TableHead className="text-right">Oran</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cancellationAnalysis.branchBreakdown.slice(0, 10).map((b, i) => (
                            <TableRow key={i}>
                              <TableCell className="font-medium">{b.branch}</TableCell>
                              <TableCell className="text-right">{b.total.toLocaleString("tr-TR")}</TableCell>
                              <TableCell className="text-right">{b.cancelled.toLocaleString("tr-TR")}</TableCell>
                              <TableCell className="text-right">
                                <Badge variant={b.cancelRate > 20 ? "destructive" : b.cancelRate > 10 ? "secondary" : "outline"}>
                                  %{b.cancelRate}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Company Breakdown */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Sigorta Şirketi Bazında İptal Oranları</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[250px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Şirket</TableHead>
                            <TableHead className="text-right">Toplam</TableHead>
                            <TableHead className="text-right">İptal</TableHead>
                            <TableHead className="text-right">Oran</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cancellationAnalysis.companyBreakdown.slice(0, 10).map((c, i) => (
                            <TableRow key={i}>
                              <TableCell className="font-medium">{c.company}</TableCell>
                              <TableCell className="text-right">{c.total.toLocaleString("tr-TR")}</TableCell>
                              <TableCell className="text-right">{c.cancelled.toLocaleString("tr-TR")}</TableCell>
                              <TableCell className="text-right">
                                <Badge variant={c.cancelRate > 20 ? "destructive" : c.cancelRate > 10 ? "secondary" : "outline"}>
                                  %{c.cancelRate}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Monthly Trend */}
              {cancellationAnalysis.monthlyTrend.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Aylık İptal Trendi</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end gap-1 h-32">
                      {cancellationAnalysis.monthlyTrend.map((m, i) => {
                        const maxCount = Math.max(...cancellationAnalysis.monthlyTrend.map(t => t.count));
                        const height = maxCount > 0 ? (m.count / maxCount) * 100 : 0;
                        return (
                          <Tooltip key={i}>
                            <TooltipTrigger asChild>
                              <div className="flex-1 flex flex-col items-center gap-1">
                                <div 
                                  className="w-full bg-destructive/60 rounded-t hover:bg-destructive transition-colors cursor-pointer"
                                  style={{ height: `${Math.max(height, 4)}%` }}
                                />
                                <span className="text-xs text-muted-foreground rotate-45 origin-left whitespace-nowrap">
                                  {m.month.slice(5)}
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{m.month}: {m.count.toLocaleString("tr-TR")} iptal</p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Risky Products */}
              {cancellationAnalysis.riskyProducts.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      Yüksek Riskli Ürünler
                    </CardTitle>
                    <CardDescription>En yüksek iptal oranına sahip ürünler (min. 20 poliçe)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {cancellationAnalysis.riskyProducts.map((p, i) => (
                        <Badge key={i} variant="outline" className="py-2 px-3">
                          <span className="font-medium">{p.product}</span>
                          <span className="mx-2 text-muted-foreground">|</span>
                          <span className="text-destructive">%{p.cancelRate}</span>
                          <span className="mx-1 text-muted-foreground">({p.cancelledPolicies}/{p.totalPolicies})</span>
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : null}

          {/* AI-based Customer Churn Predictions */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Müşteri Bazlı İptal Risk Tahmini
                  </CardTitle>
                  <CardDescription>AI ile müşteri profillerini analiz ederek iptal riski tahmin et</CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => runChurnMutation.mutate()}
                  disabled={isAnalyzing}
                  data-testid="button-run-churn"
                >
                  {runChurnMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 mr-2" />
                  )}
                  İptal Tahmini Çalıştır
                </Button>
              </div>
            </CardHeader>
          </Card>
          
          <PredictionFilters
            filters={churnFilters}
            setFilters={setChurnFilters}
            onExport={() => exportToExcel("churn_prediction", churnFilters)}
            onRunAnalysis={() => runChurnMutation.mutate()}
            predictions={churnPredictions}
            isAnalyzing={isAnalyzing}
            analysisIcon={<AlertTriangle className="h-4 w-4 mr-2" />}
            analysisLabel="İptal Tahmini Çalıştır"
            analysisTestId="button-run-churn-filter"
            analysisType="churn_prediction"
          />
          
          {churnLoading ? (
            <div className="animate-pulse space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted rounded" />
              ))}
            </div>
          ) : churnPredictions.length === 0 ? (
            <Card className="p-8 text-center">
              <AlertTriangle className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
              <h3 className="text-base font-medium mb-2">Henüz müşteri bazlı iptal tahmini yok</h3>
              <p className="text-sm text-muted-foreground">
                "İptal Tahmini Çalıştır" butonuna tıklayarak müşteri bazında AI analizi yapabilirsiniz.
              </p>
            </Card>
          ) : (
            <PredictionTable
              predictions={churnPredictions}
              type="churn"
            />
          )}
        </TabsContent>

        <TabsContent value="crosssell" className="space-y-4">
          <PredictionFilters
            filters={crossSellFilters}
            setFilters={setCrossSellFilters}
            onExport={() => exportToExcel("cross_sell", crossSellFilters)}
            onRunAnalysis={() => runCrossSellMutation.mutate()}
            predictions={crossSellPredictions}
            isAnalyzing={isAnalyzing}
            analysisIcon={<ShoppingCart className="h-4 w-4 mr-2" />}
            analysisLabel="Çapraz Satış Analizi"
            analysisTestId="button-run-crosssell"
            analysisType="cross_sell"
          />
          
          {crossSellLoading ? (
            <div className="animate-pulse space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted rounded" />
              ))}
            </div>
          ) : crossSellPredictions.length === 0 ? (
            <Card className="p-12 text-center">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Henüz çapraz satış analizi yok</h3>
              <p className="text-muted-foreground mb-4">
                Yukarıdaki "Çapraz Satış Analizi" butonuna tıklayarak müşteri bazında analiz yapabilirsiniz.
              </p>
            </Card>
          ) : (
            <PredictionTable
              predictions={crossSellPredictions}
              type="crosssell"
            />
          )}
        </TabsContent>

        <TabsContent value="segments" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Segment Analizleri
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => surpriseMeMutation.mutate()}
                    disabled={isAnalyzing}
                    data-testid="button-surprise-me"
                  >
                    {surpriseMeMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Gift className="h-4 w-4 mr-2" />
                    )}
                    Beni Şaşırt
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => runSegmentMutation.mutate()}
                    disabled={isAnalyzing}
                    data-testid="button-run-segmentation"
                  >
                    {runSegmentMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    Segmentasyon Çalıştır
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Wand2 className="h-4 w-4" />
                Özel Segment Oluştur
              </CardTitle>
              <CardDescription>
                Kendi kriterlerinizi yazarak AI'ın bu kriterlere göre müşteri segmenti oluşturmasını sağlayın
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Örnek: İstanbul'da yaşayan, kasko sigortası olan ve son 1 yılda poliçe yenileme yapmış müşterileri analiz et..."
                value={customSegmentPrompt}
                onChange={(e) => setCustomSegmentPrompt(e.target.value)}
                className="min-h-[100px]"
                data-testid="textarea-custom-segment"
              />
              <Button
                onClick={() => runCustomSegmentMutation.mutate(customSegmentPrompt)}
                disabled={isAnalyzing || !customSegmentPrompt.trim()}
                className="w-full"
                data-testid="button-create-custom-segment"
              >
                {runCustomSegmentMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4 mr-2" />
                )}
                Özel Segment Oluştur
              </Button>
            </CardContent>
          </Card>
          
          {segmentLoading ? (
            <div className="animate-pulse space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-muted rounded" />
              ))}
            </div>
          ) : segmentAnalyses.length === 0 ? (
            <Card className="p-12 text-center">
              <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Henüz segment analizi yok</h3>
              <p className="text-muted-foreground mb-4">
                Yukarıdaki "Segmentasyon Çalıştır" butonuna tıklayarak analiz yapabilirsiniz.
              </p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {segmentAnalyses.map((analysis) => {
                const metadata = analysis.metadata as SegmentMetadata | null;
                return (
                  <Card key={analysis.id} data-testid={`card-segment-${analysis.id}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-base">{analysis.title}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge>AI</Badge>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7"
                                onClick={() => saveToSegmentsMutation.mutate(analysis)}
                                disabled={saveToSegmentsMutation.isPending}
                                data-testid={`button-save-segment-${analysis.id}`}
                              >
                                <Save className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Kampanyalarda kullanmak için kaydet</TooltipContent>
                          </Tooltip>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7"
                                data-testid={`button-delete-segment-${analysis.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Segmenti Sil</AlertDialogTitle>
                                <AlertDialogDescription>
                                  "{analysis.title}" segmentini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>İptal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteSegmentMutation.mutate(analysis.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  data-testid={`button-confirm-delete-${analysis.id}`}
                                >
                                  Sil
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                      <CardDescription>
                        <span>{new Date(analysis.createdAt!).toLocaleDateString("tr-TR")}</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">{analysis.insight}</p>
                      <Link href={buildSegmentProfileUrl(analysis.title, metadata || undefined)}>
                        <Button variant="outline" size="sm" className="w-full" data-testid={`button-view-segment-${analysis.id}`}>
                          <Users className="h-4 w-4 mr-2" />
                          Müşteri Profillerini Gör
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="hashtags" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Hashtag Segmentleri
                  </CardTitle>
                  <CardDescription>
                    AI tarafından oluşturulan hashtag'lerle müşteri segmentleri
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {filteredProfiles.length} müşteri
                  </Badge>
                  <Link href="/customer-profiles">
                    <Button variant="outline" size="sm" data-testid="button-goto-profiles">
                      <Users className="h-4 w-4 mr-2" />
                      Profillere Git
                    </Button>
                  </Link>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-xs mb-2 block">Hashtag Seç (birden fazla seçilebilir)</Label>
                  <div className="flex flex-wrap gap-2">
                    {allHashtags.map((tag) => (
                      <Badge
                        key={tag}
                        variant={selectedHashtags.includes(tag) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          if (selectedHashtags.includes(tag)) {
                            setSelectedHashtags(selectedHashtags.filter(t => t !== tag));
                          } else {
                            setSelectedHashtags([...selectedHashtags, tag]);
                          }
                        }}
                        data-testid={`badge-hashtag-${tag.replace('#', '')}`}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  {selectedHashtags.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={() => setSelectedHashtags([])}
                      data-testid="button-clear-hashtags"
                    >
                      Filtreleri Temizle
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {hashtagsLoading ? (
            <div className="animate-pulse space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted rounded" />
              ))}
            </div>
          ) : allHashtags.length === 0 ? (
            <Card className="p-12 text-center">
              <Hash className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Henüz hashtag analizi yok</h3>
              <p className="text-muted-foreground mb-4">
                Müşteri Profilleri sayfasından "AI ile Analiz Et" butonuna tıklayarak hashtag oluşturabilirsiniz.
              </p>
              <Link href="/customer-profiles">
                <Button data-testid="button-goto-profiles-empty">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Müşteri Profillerine Git
                </Button>
              </Link>
            </Card>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Müşteri</TableHead>
                    <TableHead>Tip</TableHead>
                    <TableHead>Şehir</TableHead>
                    <TableHead>Hashtag'ler</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProfiles.slice(0, 100).map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell className="font-medium">{profile.musteriIsmi || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {profile.musteriTipi || "Bireysel"}
                        </Badge>
                      </TableCell>
                      <TableCell>{profile.sehir || "-"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {profile.aiAnaliz?.split(/\s+/).filter(tag => tag.startsWith('#')).slice(0, 5).map((tag, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {(profile.aiAnaliz?.split(/\s+/).filter(tag => tag.startsWith('#')).length || 0) > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{(profile.aiAnaliz?.split(/\s+/).filter(tag => tag.startsWith('#')).length || 0) - 5}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/customer-profiles/${profile.id}`}>
                          <Button variant="ghost" size="sm" data-testid={`button-view-profile-${profile.id}`}>
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredProfiles.length > 100 && (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  {filteredProfiles.length - 100} müşteri daha var. Tamamını görmek için Müşteri Profillerine gidin.
                </div>
              )}
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PredictionFilters({
  filters,
  setFilters,
  onExport,
  onRunAnalysis,
  predictions,
  isAnalyzing,
  analysisIcon,
  analysisLabel,
  analysisTestId,
  analysisType,
}: {
  filters: Filters;
  setFilters: (f: Filters) => void;
  onExport: () => void;
  onRunAnalysis: () => void;
  predictions: AiCustomerPrediction[];
  isAnalyzing: boolean;
  analysisIcon: React.ReactNode;
  analysisLabel: string;
  analysisTestId: string;
  analysisType: string;
}) {
  // Normalize product names to simple categories for filtering
  const normalizeProductName = (product: string): string => {
    const lower = product.toLowerCase();
    if (lower.includes("kasko")) return "Kasko";
    if (lower.includes("trafik")) return "Trafik";
    if (lower.includes("dask")) return "DASK";
    if (lower.includes("sağlık") || lower.includes("saglik")) return "Sağlık";
    if (lower.includes("konut")) return "Konut";
    if (lower.includes("işyeri") || lower.includes("isyeri")) return "İşyeri";
    if (lower.includes("nakliyat")) return "Nakliyat";
    if (lower.includes("mühendislik") || lower.includes("muhendislik")) return "Mühendislik";
    if (lower.includes("hayat")) return "Hayat";
    if (lower.includes("ferdi kaza")) return "Ferdi Kaza";
    return product; // Return original if no match
  };
  
  // Get unique normalized product names
  const products = Array.from(new Set(
    predictions.map((p) => p.currentProduct).filter(Boolean).map(p => normalizeProductName(p!))
  )).sort();
  const cities = Array.from(new Set(predictions.map((p) => p.city).filter(Boolean))).sort();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtreler
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              asChild
              disabled={predictions.length === 0}
              data-testid="button-view-customers"
            >
              <Link href={`/customer-profiles`}>
                <Users className="h-4 w-4 mr-2" />
                Profilleri Gör ({predictions.length})
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              disabled={predictions.length === 0}
              data-testid="button-export-excel"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button
              size="sm"
              onClick={onRunAnalysis}
              disabled={isAnalyzing}
              data-testid={analysisTestId}
            >
              {isAnalyzing ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : analysisIcon}
              {analysisLabel}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label className="text-xs">Ürün</Label>
            <Select
              value={filters.product}
              onValueChange={(v) => setFilters({ ...filters, product: v === "all" ? "" : v })}
            >
              <SelectTrigger data-testid="select-product">
                <SelectValue placeholder="Tümü" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                {products.map((p) => (
                  <SelectItem key={p} value={p!}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label className="text-xs">Şehir</Label>
            <Select
              value={filters.city}
              onValueChange={(v) => setFilters({ ...filters, city: v === "all" ? "" : v })}
            >
              <SelectTrigger data-testid="select-city">
                <SelectValue placeholder="Tümü" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                {cities.map((c) => (
                  <SelectItem key={c} value={c!}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <Label className="text-xs">
              Olasılık Aralığı: {filters.minProbability}% - {filters.maxProbability}%
            </Label>
            <div className="pt-2 px-1">
              <Slider
                min={0}
                max={100}
                step={5}
                value={[filters.minProbability, filters.maxProbability]}
                onValueChange={([min, max]) => setFilters({ ...filters, minProbability: min, maxProbability: max })}
                data-testid="slider-probability"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PredictionTable({
  predictions,
  type,
}: {
  predictions: AiCustomerPrediction[];
  type: "churn" | "crosssell";
}) {
  const getProbabilityBadge = (probability: number) => {
    if (probability >= 70) {
      return <Badge variant="destructive">{probability}%</Badge>;
    } else if (probability >= 40) {
      return <Badge variant="secondary">{probability}%</Badge>;
    }
    return <Badge variant="outline">{probability}%</Badge>;
  };

  const getPriorityBadge = (priority: string | undefined) => {
    if (!priority) return null;
    const p = priority.toLowerCase();
    if (p === "high") return <Badge variant="destructive" className="text-xs">Yüksek</Badge>;
    if (p === "medium") return <Badge variant="secondary" className="text-xs">Orta</Badge>;
    return <Badge variant="outline" className="text-xs">Düşük</Badge>;
  };

  const getActionIcon = (action: string | undefined) => {
    if (!action) return null;
    const a = action.toLowerCase();
    if (a === "call") return <Phone className="h-3 w-3 inline mr-1" />;
    if (a === "email") return <Mail className="h-3 w-3 inline mr-1" />;
    return <MapPin className="h-3 w-3 inline mr-1" />;
  };

  return (
    <Card>
      <ScrollArea className="h-[500px]">
        <Table>
          <TableHeader className="sticky top-0 bg-card z-10">
            <TableRow>
              <TableHead>Müşteri</TableHead>
              <TableHead>Mevcut Ürün</TableHead>
              {type === "crosssell" && <TableHead>Fırsat Tipi</TableHead>}
              {type === "crosssell" && <TableHead>Önerilen Ürün</TableHead>}
              <TableHead className="text-center">
                {type === "churn" ? "İptal Olasılığı" : "Skor"}
              </TableHead>
              {type === "crosssell" && <TableHead className="text-center">Öncelik</TableHead>}
              <TableHead>
                {type === "churn" ? "Potansiyel Sebep" : "Satış Argümanı"}
              </TableHead>
              <TableHead className="w-[100px]">İşlem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {predictions.map((prediction) => {
              const metadata = prediction.metadata as Record<string, unknown> | undefined;
              const opportunityType = metadata?.opportunityType as string | undefined;
              const priority = metadata?.priority as string | undefined;
              const nextBestAction = metadata?.nextBestAction as string | undefined;
              
              return (
                <TableRow key={prediction.id} data-testid={`row-prediction-${prediction.id}`}>
                  <TableCell className="font-medium">
                    <div>
                      <span>{prediction.customerName}</span>
                      {prediction.city && (
                        <span className="text-xs text-muted-foreground block">{prediction.city}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{prediction.currentProduct || "-"}</TableCell>
                  {type === "crosssell" && (
                    <TableCell>
                      <span className="text-xs">{opportunityType || "-"}</span>
                    </TableCell>
                  )}
                  {type === "crosssell" && (
                    <TableCell>
                      <Badge variant="outline">{prediction.suggestedProduct || "-"}</Badge>
                    </TableCell>
                  )}
                  <TableCell className="text-center">
                    {getProbabilityBadge(prediction.probability)}
                  </TableCell>
                  {type === "crosssell" && (
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        {getPriorityBadge(priority)}
                        {nextBestAction && (
                          <span className="text-xs text-muted-foreground">
                            {getActionIcon(nextBestAction)}
                            {nextBestAction === "Call" ? "Ara" : nextBestAction === "Email" ? "Mail" : "Ziyaret"}
                          </span>
                        )}
                      </div>
                    </TableCell>
                  )}
                  <TableCell className="max-w-[350px]">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-sm text-muted-foreground line-clamp-2 cursor-help block">
                          {prediction.reason || "-"}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[500px]">
                        <p className="text-sm whitespace-pre-wrap">{prediction.reason}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Link href={`/customer-profiles/${prediction.profileId || prediction.customerId}`}>
                      <Button variant="ghost" size="sm" data-testid={`button-view-${prediction.id}`}>
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Profil
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </ScrollArea>
    </Card>
  );
}
