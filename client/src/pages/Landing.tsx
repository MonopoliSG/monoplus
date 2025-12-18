import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, PieChart, Sparkles, Upload, BarChart3 } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Müşteri Yönetimi",
    description: "Tüm müşteri verilerinizi tek platformda yönetin",
  },
  {
    icon: PieChart,
    title: "Akıllı Segmentasyon",
    description: "AI destekli müşteri segmentasyonu ve analiz",
  },
  {
    icon: Sparkles,
    title: "Çapraz Satış Tavsiyeleri",
    description: "Yapay zeka ile kişiselleştirilmiş ürün önerileri",
  },
  {
    icon: Upload,
    title: "Kolay Veri İçe Aktarma",
    description: "CSV dosyalarınızı hızlıca sisteme yükleyin",
  },
  {
    icon: BarChart3,
    title: "Kampanya Takibi",
    description: "Satış kampanyalarınızı oluşturun ve takip edin",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-xl">Sigorta CRM</span>
          </div>
          <Button asChild data-testid="button-login">
            <a href="/api/login">Giriş Yap</a>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-bold mb-4" data-testid="text-hero-title">
            Sigorta Müşteri Yönetim Platformu
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Yapay zeka destekli müşteri segmentasyonu, çapraz satış tavsiyeleri ve
            kampanya yönetimi ile sigorta operasyonlarınızı güçlendirin.
          </p>
          <Button size="lg" asChild data-testid="button-cta">
            <a href="/api/login">Hemen Başlayın</a>
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          {features.map((feature) => (
            <Card key={feature.title} className="text-center">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mx-auto mb-2">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <footer className="border-t py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Sigorta CRM - Müşteri Veritabanı Platformu
        </div>
      </footer>
    </div>
  );
}
