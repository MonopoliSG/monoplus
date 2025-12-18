import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, RefreshCw, TrendingUp, AlertTriangle, ShoppingCart, FileJson, Users, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { AiAnalysis } from "@shared/schema";

export default function AIInsights() {
  const { toast } = useToast();
  const [selectedAnalysis, setSelectedAnalysis] = useState<AiAnalysis | null>(null);

  const { data: analyses = [], isLoading } = useQuery<AiAnalysis[]>({
    queryKey: ["/api/ai/analyses"],
  });

  const runAnalysisMutation = useMutation({
    mutationFn: async (type: string) => {
      const res = await apiRequest("POST", "/api/ai/analyze", { type });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/analyses"] });
      toast({ title: "Analiz tamamlandı" });
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

  const exportToJSON = (analysis: AiAnalysis) => {
    const result = analysis.metadata as Record<string, unknown>;
    const jsonStr = JSON.stringify(result, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${analysis.analysisType}_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Dosya indirildi" });
  };

  const churnAnalyses = analyses.filter((a) => a.analysisType === "churn_prediction");
  const crossSellAnalyses = analyses.filter((a) => a.analysisType === "cross_sell");
  const segmentAnalyses = analyses.filter((a) => a.analysisType === "segmentation");

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2" data-testid="text-page-title">
            <Sparkles className="h-6 w-6 text-primary" />
            AI Analizler
          </h1>
          <p className="text-muted-foreground">Yapay zeka destekli müşteri analizleri ve öneriler</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => runAnalysisMutation.mutate("churn_prediction")}
            disabled={runAnalysisMutation.isPending}
            data-testid="button-run-churn"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            İptal Tahmini
          </Button>
          <Button
            variant="outline"
            onClick={() => runAnalysisMutation.mutate("cross_sell")}
            disabled={runAnalysisMutation.isPending}
            data-testid="button-run-crosssell"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Çapraz Satış
          </Button>
          <Button
            onClick={() => runAnalysisMutation.mutate("segmentation")}
            disabled={runAnalysisMutation.isPending}
            data-testid="button-run-segmentation"
          >
            {runAnalysisMutation.isPending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Segment Analizi
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              İptal Risk Analizleri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{churnAnalyses.length}</div>
            <p className="text-xs text-muted-foreground">analiz yapıldı</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Çapraz Satış Analizleri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{crossSellAnalyses.length}</div>
            <p className="text-xs text-muted-foreground">öneri oluşturuldu</p>
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
            <p className="text-xs text-muted-foreground">segment belirlendi</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="churn" className="space-y-4">
        <TabsList>
          <TabsTrigger value="churn" data-testid="tab-churn">İptal Tahminleri</TabsTrigger>
          <TabsTrigger value="crosssell" data-testid="tab-crosssell">Çapraz Satış</TabsTrigger>
          <TabsTrigger value="segments" data-testid="tab-segments">Segmentasyon</TabsTrigger>
        </TabsList>

        <TabsContent value="churn" className="space-y-4">
          {churnAnalyses.length === 0 ? (
            <Card className="p-12 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Henüz iptal tahmini yok</h3>
              <p className="text-muted-foreground mb-4">
                AI ile müşterilerin iptal risklerini analiz edin.
              </p>
              <Button onClick={() => runAnalysisMutation.mutate("churn_prediction")}>
                <AlertTriangle className="h-4 w-4 mr-2" />
                İptal Tahmini Yap
              </Button>
            </Card>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-3">
                {churnAnalyses.map((analysis) => (
                  <Card
                    key={analysis.id}
                    className={`cursor-pointer transition-colors ${
                      selectedAnalysis?.id === analysis.id ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => setSelectedAnalysis(analysis)}
                    data-testid={`card-analysis-${analysis.id}`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-sm">İptal Risk Analizi</CardTitle>
                        <Badge variant="destructive">Risk</Badge>
                      </div>
                      <CardDescription>
                        {new Date(analysis.createdAt!).toLocaleDateString("tr-TR")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {analysis.insight && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{analysis.insight}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
              {selectedAnalysis && selectedAnalysis.analysisType === "churn_prediction" && (
                <AnalysisDetail analysis={selectedAnalysis} onExport={exportToJSON} />
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="crosssell" className="space-y-4">
          {crossSellAnalyses.length === 0 ? (
            <Card className="p-12 text-center">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Henüz çapraz satış analizi yok</h3>
              <p className="text-muted-foreground mb-4">
                AI ile müşterilere uygun ek ürün önerileri alın.
              </p>
              <Button onClick={() => runAnalysisMutation.mutate("cross_sell")}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Çapraz Satış Analizi
              </Button>
            </Card>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-3">
                {crossSellAnalyses.map((analysis) => (
                  <Card
                    key={analysis.id}
                    className={`cursor-pointer transition-colors ${
                      selectedAnalysis?.id === analysis.id ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => setSelectedAnalysis(analysis)}
                    data-testid={`card-analysis-${analysis.id}`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-sm">Çapraz Satış Önerileri</CardTitle>
                        <Badge variant="secondary">Fırsat</Badge>
                      </div>
                      <CardDescription>
                        {new Date(analysis.createdAt!).toLocaleDateString("tr-TR")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {analysis.insight && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{analysis.insight}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
              {selectedAnalysis && selectedAnalysis.analysisType === "cross_sell" && (
                <AnalysisDetail analysis={selectedAnalysis} onExport={exportToJSON} />
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="segments" className="space-y-4">
          {segmentAnalyses.length === 0 ? (
            <Card className="p-12 text-center">
              <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Henüz segment analizi yok</h3>
              <p className="text-muted-foreground mb-4">
                AI ile müşteri davranış ve özelliklerini analiz edin.
              </p>
              <Button onClick={() => runAnalysisMutation.mutate("segmentation")}>
                <Sparkles className="h-4 w-4 mr-2" />
                Segment Analizi
              </Button>
            </Card>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-3">
                {segmentAnalyses.map((analysis) => (
                  <Card
                    key={analysis.id}
                    className={`cursor-pointer transition-colors ${
                      selectedAnalysis?.id === analysis.id ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => setSelectedAnalysis(analysis)}
                    data-testid={`card-analysis-${analysis.id}`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-sm">Segment Analizi</CardTitle>
                        <Badge>AI</Badge>
                      </div>
                      <CardDescription>
                        {new Date(analysis.createdAt!).toLocaleDateString("tr-TR")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {analysis.insight && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{analysis.insight}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
              {selectedAnalysis && selectedAnalysis.analysisType === "segmentation" && (
                <AnalysisDetail analysis={selectedAnalysis} onExport={exportToJSON} />
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface AnalysisResult {
  recommendations?: string[];
  customers?: Array<{
    musteriIsmi?: string;
    name?: string;
    reason?: string;
    score?: number;
  }>;
  segments?: Array<{
    name: string;
    count?: number;
    customerCount?: number;
    description?: string;
  }>;
}

function AnalysisDetail({ analysis, onExport }: { analysis: AiAnalysis; onExport: (a: AiAnalysis) => void }) {
  const result = analysis.metadata as AnalysisResult;
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Analiz Detayı</CardTitle>
          <Button variant="outline" size="sm" onClick={() => onExport(analysis)}>
            <FileJson className="h-3 w-3 mr-1" />
            JSON İndir
          </Button>
        </div>
        <CardDescription>
          Oluşturulma: {new Date(analysis.createdAt!).toLocaleString("tr-TR")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {analysis.insight && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Özet</p>
            <p className="text-sm text-muted-foreground">{analysis.insight}</p>
          </div>
        )}
        
        {result && (
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {result.recommendations && Array.isArray(result.recommendations) && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Öneriler</p>
                  {result.recommendations.map((rec: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <Sparkles className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {result.customers && Array.isArray(result.customers) && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">İlgili Müşteriler ({result.customers.length})</p>
                  <div className="space-y-2">
                    {result.customers.slice(0, 10).map((customer, i: number) => (
                      <div key={i} className="p-2 rounded bg-muted/50 text-sm">
                        <p className="font-medium">{customer.musteriIsmi || customer.name}</p>
                        {customer.reason && (
                          <p className="text-muted-foreground text-xs">{customer.reason}</p>
                        )}
                        {customer.score !== undefined && (
                          <div className="mt-1 space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>Risk Skoru</span>
                              <span>{customer.score}%</span>
                            </div>
                            <Progress value={customer.score} className="h-1" />
                          </div>
                        )}
                      </div>
                    ))}
                    {result.customers.length > 10 && (
                      <p className="text-xs text-muted-foreground text-center">
                        +{result.customers.length - 10} müşteri daha (JSON'da tümü mevcut)
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {result.segments && Array.isArray(result.segments) && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Segmentler</p>
                  {result.segments.map((seg, i: number) => (
                    <div key={i} className="p-2 rounded bg-muted/50">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{seg.name}</span>
                        <Badge variant="secondary">{seg.count || seg.customerCount}</Badge>
                      </div>
                      {seg.description && (
                        <p className="text-xs text-muted-foreground mt-1">{seg.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
