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
import { Sparkles, RefreshCw, TrendingUp, AlertTriangle, ShoppingCart, FileSpreadsheet, Users, ExternalLink, Search, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { AiCustomerPrediction, AiAnalysis } from "@shared/schema";

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

  const isAnalyzing = runChurnMutation.isPending || runCrossSellMutation.isPending || runSegmentMutation.isPending;

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
        </TabsList>

        <TabsContent value="churn" className="space-y-4">
          <PredictionFilters
            filters={churnFilters}
            setFilters={setChurnFilters}
            onExport={() => exportToExcel("churn_prediction", churnFilters)}
            onRunAnalysis={() => runChurnMutation.mutate()}
            predictions={churnPredictions}
            isAnalyzing={isAnalyzing}
            analysisIcon={<AlertTriangle className="h-4 w-4 mr-2" />}
            analysisLabel="İptal Tahmini Çalıştır"
            analysisTestId="button-run-churn"
          />
          
          {churnLoading ? (
            <div className="animate-pulse space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted rounded" />
              ))}
            </div>
          ) : churnPredictions.length === 0 ? (
            <Card className="p-12 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Henüz iptal tahmini yok</h3>
              <p className="text-muted-foreground mb-4">
                Yukarıdaki "İptal Tahmini Çalıştır" butonuna tıklayarak müşteri bazında analiz yapabilirsiniz.
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
            </CardHeader>
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
              {segmentAnalyses.map((analysis) => (
                <Card key={analysis.id} data-testid={`card-segment-${analysis.id}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-base">{analysis.title}</CardTitle>
                      <Badge>AI</Badge>
                    </div>
                    <CardDescription>
                      {new Date(analysis.createdAt!).toLocaleDateString("tr-TR")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{analysis.insight}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
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
}) {
  const products = Array.from(new Set(predictions.map((p) => p.currentProduct).filter(Boolean)));
  const cities = Array.from(new Set(predictions.map((p) => p.city).filter(Boolean)));

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
              onClick={onExport}
              disabled={predictions.length === 0}
              data-testid="button-export-excel"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Excel ({predictions.length})
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
        <div className="grid gap-4 md:grid-cols-5">
          <div className="space-y-2">
            <Label htmlFor="search" className="text-xs">Müşteri Ara</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Müşteri adı..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-8"
                data-testid="input-search"
              />
            </div>
          </div>
          
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

  return (
    <Card>
      <ScrollArea className="h-[500px]">
        <Table>
          <TableHeader className="sticky top-0 bg-card z-10">
            <TableRow>
              <TableHead>Müşteri</TableHead>
              <TableHead>Mevcut Ürün</TableHead>
              {type === "crosssell" && <TableHead>Önerilen Ürün</TableHead>}
              <TableHead className="text-center">
                {type === "churn" ? "İptal Olasılığı" : "Satış Olasılığı"}
              </TableHead>
              <TableHead>
                {type === "churn" ? "Potansiyel Sebep" : "Satış Argümanı"}
              </TableHead>
              <TableHead className="w-[100px]">İşlem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {predictions.map((prediction) => (
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
                    <Badge variant="outline">{prediction.suggestedProduct || "-"}</Badge>
                  </TableCell>
                )}
                <TableCell className="text-center">
                  {getProbabilityBadge(prediction.probability)}
                </TableCell>
                <TableCell className="max-w-[400px]">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-sm text-muted-foreground line-clamp-3 cursor-help block">
                        {prediction.reason || "-"}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[500px]">
                      <p className="text-sm whitespace-pre-wrap">{prediction.reason}</p>
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Link href={`/customers/${prediction.customerId}`}>
                    <Button variant="ghost" size="sm" data-testid={`button-view-${prediction.id}`}>
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Detay
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </Card>
  );
}
