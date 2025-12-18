import { useState } from "react";
import { SegmentCard, type Segment } from "@/components/SegmentCard";
import { AIInsightCard } from "@/components/AIInsightCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Plus, Users, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// todo: remove mock functionality
const mockSegments: Segment[] = [
  {
    id: "1",
    name: "Genç Profesyoneller (25-35)",
    description: "25-35 yaş arası çalışan profesyoneller",
    customerCount: 312,
    totalCustomers: 1247,
    behaviors: [
      { label: "Araç Sigortası Var", percentage: 78 },
      { label: "Sağlık Sigortası Var", percentage: 45 },
      { label: "Dijital Kanal Tercihi", percentage: 92 },
    ],
    aiInsight: "Bu segment dijital kanallara yatkın. Mobil uygulama üzerinden self-servis işlemler sunulabilir.",
  },
  {
    id: "2",
    name: "Aile Sahipleri (35-50)",
    description: "Evli, çocuklu müşteriler",
    customerCount: 428,
    totalCustomers: 1247,
    behaviors: [
      { label: "Konut Sigortası Var", percentage: 65 },
      { label: "Hayat Sigortası Var", percentage: 52 },
      { label: "Birden Fazla Poliçe", percentage: 73 },
    ],
    aiInsight: "Aile paket sigortası sunumu yüksek dönüşüm potansiyeli taşıyor. Çocuk eğitim sigortası önerilebilir.",
  },
  {
    id: "3",
    name: "Premium Müşteriler",
    description: "Yüksek değerli, sadık müşteriler",
    customerCount: 156,
    totalCustomers: 1247,
    behaviors: [
      { label: "3+ Poliçe Sahibi", percentage: 88 },
      { label: "Yıllık Yenileme", percentage: 95 },
      { label: "VIP Hizmet Talebi", percentage: 67 },
    ],
    aiInsight: "Sadakat programı ile bu segmentin elde tutulması kritik. Özel temsilci ataması düşünülebilir.",
  },
  {
    id: "4",
    name: "İstanbul Bölgesi",
    description: "İstanbul'da ikamet eden müşteriler",
    customerCount: 523,
    totalCustomers: 1247,
    behaviors: [
      { label: "Trafik Yoğunluğu Bölgesi", percentage: 100 },
      { label: "Kasko Sahipliği", percentage: 72 },
    ],
  },
  {
    id: "5",
    name: "Yenileme Riski",
    description: "30 gün içinde poliçesi dolacak müşteriler",
    customerCount: 47,
    totalCustomers: 1247,
    behaviors: [
      { label: "İlk Yenileme", percentage: 38 },
      { label: "Fiyat Hassasiyeti", percentage: 65 },
    ],
    aiInsight: "Erken yenileme indirimi sunularak bu segmentin kayıp riski azaltılabilir.",
  },
  {
    id: "6",
    name: "Araç Markası: Toyota",
    description: "Toyota marka araç sahibi müşteriler",
    customerCount: 89,
    totalCustomers: 1247,
    behaviors: [
      { label: "Kasko Aktif", percentage: 85 },
      { label: "Yetkili Servis Tercihi", percentage: 72 },
    ],
  },
];

export default function Segments() {
  const { toast } = useToast();
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const handleAnalyze = (segment: Segment) => {
    setSelectedSegment(segment);
    setAnalyzing(true);
    // todo: remove mock functionality
    setTimeout(() => {
      setAnalyzing(false);
      toast({
        title: "Analiz Tamamlandı",
        description: `${segment.name} segmenti için AI analizi hazır.`,
      });
    }, 2000);
  };

  const handleViewCustomers = (segment: Segment) => {
    toast({
      title: "Müşteri Listesi",
      description: `${segment.customerCount} müşteri görüntüleniyor...`,
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Segmentler</h1>
          <p className="text-muted-foreground">Müşteri segmentlerini analiz edin ve yönetin</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" data-testid="button-ai-all-segments">
            <Sparkles className="h-4 w-4 mr-2" />
            Tüm Segmentleri Analiz Et
          </Button>
          <Button data-testid="button-create-segment">
            <Plus className="h-4 w-4 mr-2" />
            Yeni Segment
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Toplam Segment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockSegments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Ortalama Segment Boyutu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(mockSegments.reduce((acc, s) => acc + s.customerCount, 0) / mockSegments.length)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              AI Insight Sayısı
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockSegments.filter((s) => s.aiInsight).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-medium">Tüm Segmentler</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {mockSegments.map((segment) => (
              <SegmentCard
                key={segment.id}
                segment={segment}
                onAnalyze={handleAnalyze}
                onViewCustomers={handleViewCustomers}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-medium">Segment Analizi</h2>
          {selectedSegment ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{selectedSegment.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Müşteri Sayısı</span>
                      <span className="font-medium">{selectedSegment.customerCount}</span>
                    </div>
                    <Progress
                      value={(selectedSegment.customerCount / selectedSegment.totalCustomers) * 100}
                      className="h-2"
                    />
                  </div>
                  {selectedSegment.behaviors?.map((behavior, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{behavior.label}</span>
                        <span className="font-medium">{behavior.percentage}%</span>
                      </div>
                      <Progress value={behavior.percentage} className="h-1.5" />
                    </div>
                  ))}
                </CardContent>
              </Card>
              <AIInsightCard
                title="Segment Öngörüsü"
                insight={selectedSegment.aiInsight || "Bu segment için henüz AI analizi yapılmamış. Analiz başlatmak için butona tıklayın."}
                confidence={selectedSegment.aiInsight ? 85 : undefined}
                category="Segment"
                isLoading={analyzing}
              />
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">
                Detaylı analiz için bir segment seçin
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
