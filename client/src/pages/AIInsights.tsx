import { useState } from "react";
import { AIInsightCard } from "@/components/AIInsightCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, RefreshCw, TrendingUp, Users, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// todo: remove mock functionality
const mockInsights = {
  crossSell: [
    {
      id: "1",
      title: "Araç → Sağlık Çapraz Satış",
      insight: "Araç sigortası olan 523 müşteriden 182'si sağlık sigortasına sahip değil. Bu segmente özel kampanya ile yüksek dönüşüm potansiyeli mevcut. Ortalama sağlık poliçe değeri göz önüne alındığında aylık 45.000 TL ek prim geliri potansiyeli.",
      confidence: 89,
      category: "Çapraz Satış",
    },
    {
      id: "2",
      title: "Konut Sahipleri → Hayat Sigortası",
      insight: "Konut sigortası olan 267 müşteriden sadece 78'i hayat sigortasına sahip. Aile güvencesi temalı kampanya önerisi.",
      confidence: 82,
      category: "Çapraz Satış",
    },
  ],
  segments: [
    {
      id: "3",
      title: "Yeni Segment Önerisi",
      insight: "Veriler analiz edildiğinde 'İstanbul - 40+ Yaş - Birden Fazla Araç Sahibi' segmenti öne çıkıyor. Bu 47 müşteriye özel filo indirimi sunulabilir.",
      confidence: 91,
      category: "Segment",
    },
    {
      id: "4",
      title: "Kayıp Riski Segmenti",
      insight: "Son 6 ayda şikayet kaydı olan ve yenileme tarihi yaklaşan 23 müşteri tespit edildi. Proaktif iletişim önerilir.",
      confidence: 94,
      category: "Segment",
    },
  ],
  products: [
    {
      id: "5",
      title: "Yeni Ürün Önerisi: Siber Güvenlik",
      insight: "Dijital kanal kullanımı yüksek müşteriler arasında siber güvenlik sigortası talebi artıyor. E-ticaret yapan 34 müşteriye bu ürün sunulabilir.",
      confidence: 76,
      category: "Ürün",
    },
    {
      id: "6",
      title: "Paket Ürün Potansiyeli",
      insight: "'Aile Koruma Paketi' (Konut + Sağlık + Hayat) kombinasyonu, mevcut tekil ürün satışlarından %20 daha yüksek müşteri elde tutma oranı sağlayabilir.",
      confidence: 85,
      category: "Ürün",
    },
  ],
};

export default function AIInsights() {
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("crossSell");

  const handleRefresh = () => {
    setIsRefreshing(true);
    // todo: remove mock functionality
    setTimeout(() => {
      setIsRefreshing(false);
      toast({
        title: "Öngörüler Güncellendi",
        description: "Tüm AI analizleri yenilendi.",
      });
    }, 2000);
  };

  const handleAccept = (id: string) => {
    toast({
      title: "Tavsiye Uygulandı",
      description: "Aksiyon listesine eklendi.",
    });
  };

  const handleReject = (id: string) => {
    toast({
      title: "Tavsiye Reddedildi",
      description: "Bu öneri bir daha gösterilmeyecek.",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2" data-testid="text-page-title">
            <Sparkles className="h-6 w-6 text-primary" />
            AI Analizler
          </h1>
          <p className="text-muted-foreground">Yapay zeka destekli iş öngörüleri ve tavsiyeleri</p>
        </div>
        <Button onClick={handleRefresh} disabled={isRefreshing} data-testid="button-refresh-ai">
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          Analizleri Yenile
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Çapraz Satış Fırsatı
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">182</div>
            <p className="text-xs text-muted-foreground">potansiyel müşteri</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Risk Altındaki Müşteri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">kayıp riski yüksek</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package className="h-4 w-4" />
              Ürün Önerisi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">yeni ürün potansiyeli</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="crossSell" data-testid="tab-cross-sell">
            Çapraz Satış
          </TabsTrigger>
          <TabsTrigger value="segments" data-testid="tab-segments">
            Segment Önerileri
          </TabsTrigger>
          <TabsTrigger value="products" data-testid="tab-products">
            Ürün Önerileri
          </TabsTrigger>
        </TabsList>

        <TabsContent value="crossSell" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {mockInsights.crossSell.map((insight) => (
              <AIInsightCard
                key={insight.id}
                title={insight.title}
                insight={insight.insight}
                confidence={insight.confidence}
                category={insight.category}
                isLoading={isRefreshing}
                onAccept={() => handleAccept(insight.id)}
                onReject={() => handleReject(insight.id)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="segments" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {mockInsights.segments.map((insight) => (
              <AIInsightCard
                key={insight.id}
                title={insight.title}
                insight={insight.insight}
                confidence={insight.confidence}
                category={insight.category}
                isLoading={isRefreshing}
                onAccept={() => handleAccept(insight.id)}
                onReject={() => handleReject(insight.id)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="products" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {mockInsights.products.map((insight) => (
              <AIInsightCard
                key={insight.id}
                title={insight.title}
                insight={insight.insight}
                confidence={insight.confidence}
                category={insight.category}
                isLoading={isRefreshing}
                onAccept={() => handleAccept(insight.id)}
                onReject={() => handleReject(insight.id)}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
