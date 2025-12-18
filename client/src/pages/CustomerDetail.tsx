import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, MapPin, Phone, Mail, Car, FileText, Calendar } from "lucide-react";
import type { Customer, AiCustomerPrediction } from "@shared/schema";

export default function CustomerDetail() {
  const [, params] = useRoute("/customers/:id");
  const customerId = params?.id || null;

  const { data: customer, isLoading } = useQuery<Customer>({
    queryKey: ["/api/customers", customerId],
    queryFn: async () => {
      const res = await fetch(`/api/customers/${customerId}`);
      if (!res.ok) throw new Error("Müşteri bulunamadı");
      return res.json();
    },
    enabled: !!customerId,
  });

  const { data: predictions = [] } = useQuery<AiCustomerPrediction[]>({
    queryKey: ["/api/ai/predictions/customer", customerId],
    queryFn: async () => {
      const res = await fetch(`/api/ai/predictions/customer/${customerId}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!customerId,
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-48 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-6">
        <Card className="p-12 text-center">
          <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Müşteri bulunamadı</h3>
          <Link href="/customers">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Müşterilere Dön
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const churnPredictions = predictions.filter(p => p.analysisType === "churn_prediction");
  const crossSellPredictions = predictions.filter(p => p.analysisType === "cross_sell");

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/customers">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-customer-name">
            {customer.musteriIsmi || "İsimsiz Müşteri"}
          </h1>
          <p className="text-muted-foreground">{customer.ePosta || customer.telefon1}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Kişisel Bilgiler
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {customer.tcKimlikNo && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">TC No</span>
                <span>{customer.tcKimlikNo}</span>
              </div>
            )}
            {customer.dogumTarihi && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Doğum Tarihi</span>
                <span>{new Date(customer.dogumTarihi).toLocaleDateString("tr-TR")}</span>
              </div>
            )}
            {customer.meslekGrubu && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Meslek</span>
                <span>{customer.meslekGrubu}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              İletişim Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {customer.telefon1 && (
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  Telefon
                </span>
                <span>{customer.telefon1}</span>
              </div>
            )}
            {customer.ePosta && (
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  E-posta
                </span>
                <span className="truncate max-w-[200px]">{customer.ePosta}</span>
              </div>
            )}
            {customer.sehir && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Şehir</span>
                <span>{customer.sehir}</span>
              </div>
            )}
            {customer.ilce && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">İlçe</span>
                <span>{customer.ilce}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Poliçe Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {customer.anaBrans && (
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground">Ürün</span>
                <Badge variant="outline">{customer.anaBrans}</Badge>
              </div>
            )}
            {customer.policeNumarasi && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Poliçe No</span>
                <span>{customer.policeNumarasi}</span>
              </div>
            )}
            {customer.eskiPoliceBitisTarihi && (
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Bitiş
                </span>
                <span>{new Date(customer.eskiPoliceBitisTarihi).toLocaleDateString("tr-TR")}</span>
              </div>
            )}
            {customer.yeniPoliceBrutPrim && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Prim</span>
                <span>{Number(customer.yeniPoliceBrutPrim).toLocaleString("tr-TR")} TL</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Car className="h-4 w-4" />
              Araç Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {customer.aracMarkasi && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Marka</span>
                <span>{customer.aracMarkasi}</span>
              </div>
            )}
            {customer.aracModeli && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Model</span>
                <span>{customer.aracModeli}</span>
              </div>
            )}
            {customer.modelYili && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Yıl</span>
                <span>{customer.modelYili}</span>
              </div>
            )}
            {customer.aracPlakasi && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plaka</span>
                <span>{customer.aracPlakasi}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {(churnPredictions.length > 0 || crossSellPredictions.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI Tahminleri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {churnPredictions.map((p) => (
              <div key={p.id} className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-medium text-destructive">İptal Riski</span>
                  <Badge variant="destructive">{p.probability}%</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{p.reason}</p>
              </div>
            ))}
            {crossSellPredictions.map((p) => (
              <div key={p.id} className="p-3 rounded-md bg-primary/10 border border-primary/20">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-medium">Çapraz Satış Fırsatı</span>
                  <div className="flex items-center gap-2">
                    {p.suggestedProduct && <Badge variant="outline">{p.suggestedProduct}</Badge>}
                    <Badge>{p.probability}%</Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{p.reason}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
