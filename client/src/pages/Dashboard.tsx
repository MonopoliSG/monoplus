import { useState } from "react";
import { StatsCard } from "@/components/StatsCard";
import { AIInsightCard } from "@/components/AIInsightCard";
import { SegmentCard, type Segment } from "@/components/SegmentCard";
import { Users, Package, PieChart, TrendingUp, FileCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

// todo: remove mock functionality
const mockSegments: Segment[] = [
  {
    id: "1",
    name: "Araç Sahipleri 30-40 Yaş",
    description: "30-40 yaş arası araç sigortası olan müşteriler",
    customerCount: 245,
    totalCustomers: 1000,
    behaviors: [
      { label: "Sağlık Sigortası Var", percentage: 70 },
      { label: "Konut Sigortası Var", percentage: 45 },
    ],
    aiInsight: "Bu segmentteki müşterilerin %30'u sağlık sigortasına sahip değil. Çapraz satış potansiyeli yüksek.",
  },
  {
    id: "2",
    name: "İstanbul Premium",
    description: "İstanbul'da yaşayan yüksek değerli müşteriler",
    customerCount: 180,
    totalCustomers: 1000,
    behaviors: [
      { label: "Birden Fazla Poliçe", percentage: 85 },
      { label: "Yenileme Oranı", percentage: 92 },
    ],
  },
];

export default function Dashboard() {
  const { toast } = useToast();
  const [aiLoading, setAiLoading] = useState(false);

  const handleAnalyzeSegment = (segment: Segment) => {
    setAiLoading(true);
    // todo: remove mock functionality
    setTimeout(() => {
      setAiLoading(false);
      toast({
        title: "AI Analiz Tamamlandı",
        description: `${segment.name} segmenti analiz edildi.`,
      });
    }, 1500);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Dashboard</h1>
          <p className="text-muted-foreground">Genel bakış ve önemli metrikler</p>
        </div>
        <Button data-testid="button-refresh-insights">
          <Sparkles className="h-4 w-4 mr-2" />
          AI Öngörüleri Yenile
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Toplam Müşteri"
          value="1,247"
          change={12}
          changeLabel="bu ay"
          icon={<Users className="h-4 w-4" />}
        />
        <StatsCard
          title="Aktif Poliçe"
          value="2,834"
          change={8}
          changeLabel="bu ay"
          icon={<FileCheck className="h-4 w-4" />}
        />
        <StatsCard
          title="Ürün Çeşidi"
          value="24"
          icon={<Package className="h-4 w-4" />}
        />
        <StatsCard
          title="Segment Sayısı"
          value="12"
          change={2}
          changeLabel="yeni"
          icon={<PieChart className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-medium">Öne Çıkan Segmentler</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {mockSegments.map((segment) => (
              <SegmentCard
                key={segment.id}
                segment={segment}
                onAnalyze={handleAnalyzeSegment}
                onViewCustomers={(s) => console.log("View customers:", s.name)}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-medium">AI Öngörüleri</h2>
          <AIInsightCard
            title="Çapraz Satış Fırsatı"
            insight="Araç sigortası olan müşterilerin %35'i henüz sağlık sigortasına sahip değil. Bu segmente özel kampanya ile aylık 50+ yeni poliçe potansiyeli mevcut."
            confidence={87}
            category="Satış"
            isLoading={aiLoading}
            onAccept={() => toast({ title: "Tavsiye kabul edildi" })}
            onReject={() => toast({ title: "Tavsiye reddedildi" })}
          />
          <AIInsightCard
            title="Yenileme Riski"
            insight="Önümüzdeki 30 gün içinde süresi dolacak 47 poliçe bulunuyor. Müşteri temsilcilerine hatırlatma gönderilmesi önerilir."
            confidence={92}
            category="Yenileme"
            onAccept={() => toast({ title: "Hatırlatmalar gönderildi" })}
          />
        </div>
      </div>
    </div>
  );
}
