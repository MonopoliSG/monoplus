import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  ArrowLeft, 
  User, 
  Building2, 
  Phone, 
  Mail, 
  MapPin,
  Calendar,
  FileText,
  Car,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  Hash
} from "lucide-react";
import type { CustomerProfile, Customer } from "@shared/schema";
import { format, parseISO, differenceInDays } from "date-fns";
import { tr } from "date-fns/locale";

export default function CustomerProfileDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: profile, isLoading: profileLoading } = useQuery<CustomerProfile>({
    queryKey: ["/api/customer-profiles", id],
    queryFn: async () => {
      const response = await fetch(`/api/customer-profiles/${id}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch profile");
      return response.json();
    },
  });

  const { data: policies, isLoading: policiesLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customer-profiles", id, "policies"],
    queryFn: async () => {
      const response = await fetch(`/api/customer-profiles/${id}/policies`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch policies");
      return response.json();
    },
    enabled: !!id,
  });

  const formatCurrency = (value: string | number | null) => {
    if (!value) return "-";
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    try {
      return format(parseISO(dateStr), "dd MMM yyyy", { locale: tr });
    } catch {
      return dateStr;
    }
  };

  const getDaysUntilExpiry = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      const days = differenceInDays(parseISO(dateStr), new Date());
      return days;
    } catch {
      return null;
    }
  };

  const getExpiryBadge = (dateStr: string | null) => {
    const days = getDaysUntilExpiry(dateStr);
    if (days === null) return null;
    
    if (days < 0) {
      return <Badge variant="destructive">Süresi Doldu</Badge>;
    } else if (days <= 30) {
      return <Badge className="bg-orange-500">Yaklasan ({days} gün)</Badge>;
    } else if (days <= 90) {
      return <Badge variant="secondary">{days} gün</Badge>;
    }
    return <Badge variant="outline">{days} gün</Badge>;
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Müsteri profili bulunamadi</p>
            <Link href="/customer-profiles">
              <Button variant="ghost">Müsteri listesine dön</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const cancelledPolicies = policies?.filter(p => 
    p.policeKayitTipi === 'İptal'
  ) || [];

  const activePolicies = policies?.filter(p => {
    if (p.policeKayitTipi === 'İptal') return false;
    const days = getDaysUntilExpiry(p.bitisTarihi);
    return days !== null && days >= 0;
  }) || [];

  const expiredPolicies = policies?.filter(p => {
    if (p.policeKayitTipi === 'İptal') return false;
    const days = getDaysUntilExpiry(p.bitisTarihi);
    return days !== null && days < 0;
  }) || [];

  const renewingSoon = policies?.filter(p => {
    if (p.policeKayitTipi === 'İptal') return false;
    const days = getDaysUntilExpiry(p.bitisTarihi);
    return days !== null && days >= 0 && days <= 30;
  }) || [];

  return (
    <div className="p-4 md:p-6 space-y-6" data-testid="page-customer-profile-detail">
      <div className="flex flex-wrap items-center gap-4">
        <Link href="/customer-profiles">
          <Button variant="ghost" size="sm" data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">{profile.musteriIsmi || "Müsteri Profili"}</h1>
        <Badge variant={profile.musteriTipi === "Kurumsal" ? "default" : "secondary"}>
          {profile.musteriTipi || "Bireysel"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {profile.musteriTipi === "Kurumsal" ? (
                <Building2 className="h-5 w-5" />
              ) : (
                <User className="h-5 w-5" />
              )}
              Müsteri Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Hesap Kodu</p>
              <p className="font-medium">{profile.hesapKodu || "-"}</p>
            </div>
            
            {profile.tcKimlikNo && (
              <div>
                <p className="text-sm text-muted-foreground">TC Kimlik No</p>
                <p className="font-medium">{profile.tcKimlikNo}</p>
              </div>
            )}
            
            {profile.vergiKimlikNo && (
              <div>
                <p className="text-sm text-muted-foreground">Vergi Kimlik No</p>
                <p className="font-medium">{profile.vergiKimlikNo}</p>
              </div>
            )}

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">Iletisim</p>
              {profile.gsmNo && (
                <div className="flex items-center gap-2 text-sm mb-1">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {profile.gsmNo}
                </div>
              )}
              {profile.telefon1 && (
                <div className="flex items-center gap-2 text-sm mb-1">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {profile.telefon1}
                </div>
              )}
              {profile.ePosta && (
                <div className="flex items-center gap-2 text-sm mb-1">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {profile.ePosta}
                </div>
              )}
            </div>

            {(profile.sehir || profile.ilce || profile.adres1) && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Adres</p>
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    {profile.adres1 && <p>{profile.adres1}</p>}
                    {profile.adres2 && <p>{profile.adres2}</p>}
                    <p>{[profile.ilce, profile.semt, profile.sehir].filter(Boolean).join(", ")}</p>
                  </div>
                </div>
              </div>
            )}

            {profile.dogumTarihi && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Dogum Tarihi</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(profile.dogumTarihi)}</span>
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">Temsilci</p>
              <p className="font-medium">{profile.hesapTemsilciAdi || "-"}</p>
              <p className="text-sm text-muted-foreground">{profile.subeAdi}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Portföy Özeti</CardTitle>
            <CardDescription>Müsterinin sigorta portföyü</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-3xl font-bold text-primary">{profile.aktifPolice || 0}</p>
                <p className="text-sm text-muted-foreground">Aktif Poliçe</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-3xl font-bold">{profile.toplamPolice || 0}</p>
                <p className="text-sm text-muted-foreground">Toplam Poliçe</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-3xl font-bold text-green-600">{formatCurrency(profile.toplamBrutPrim)}</p>
                <p className="text-sm text-muted-foreground">Toplam Brüt Prim</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-3xl font-bold">{profile.aracSayisi || 0}</p>
                <p className="text-sm text-muted-foreground">Araç Sayisi</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Sahip Oldugu Ürünler</p>
              <div className="flex flex-wrap gap-2">
                {profile.sahipOlunanUrunler?.split(", ").map((urun, idx) => (
                  <Badge key={idx} variant="secondary">
                    {urun}
                  </Badge>
                )) || <span className="text-muted-foreground">-</span>}
              </div>
            </div>

            {renewingSoon.length > 0 && (
              <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <p className="font-medium text-orange-800 dark:text-orange-200">
                    {renewingSoon.length} Poliçe 30 Gün Içinde Yenileniyor
                  </p>
                </div>
                <div className="space-y-1">
                  {renewingSoon.slice(0, 3).map((p, idx) => (
                    <div key={idx} className="text-sm text-orange-700 dark:text-orange-300">
                      {p.anaBrans} - {formatDate(p.bitisTarihi)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {profile.aracBilgileri && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Araç Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(() => {
                  try {
                    const araclar = JSON.parse(profile.aracBilgileri || "[]");
                    return araclar.map((arac: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <Car className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{arac.marka || "Bilinmiyor"}</p>
                          <p className="text-sm text-muted-foreground">
                            {arac.model || "-"} {arac.yil ? `(${arac.yil})` : ""}
                          </p>
                        </div>
                      </div>
                    ));
                  } catch {
                    return <p className="text-muted-foreground">Araç bilgisi yüklenemedi</p>;
                  }
                })()}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI Analiz
            </CardTitle>
            {profile.aiAnalizTarihi && (
              <CardDescription>
                Son analiz: {formatDate(profile.aiAnalizTarihi.toString())}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {profile.aiAnaliz ? (
              <div className="flex flex-wrap gap-2">
                {profile.aiAnaliz.split(/\s+/).filter(tag => tag.startsWith('#')).map((tag, idx) => (
                  <Badge key={idx} variant="outline" className="text-sm">
                    <Hash className="h-3 w-3 mr-1" />
                    {tag.replace('#', '')}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>AI analizi henüz yapılmadı</p>
                <p className="text-sm">Müşteri Profilleri sayfasından AI analizi başlatabilirsiniz</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Poliçeler
          </CardTitle>
        </CardHeader>
        <CardContent>
          {policiesLoading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Tabs defaultValue="active">
              <TabsList className="mb-4 flex-wrap">
                <TabsTrigger value="active" data-testid="tab-active-policies">
                  Aktif ({activePolicies.length})
                </TabsTrigger>
                <TabsTrigger value="expired" data-testid="tab-expired-policies">
                  Süresi Dolan ({expiredPolicies.length})
                </TabsTrigger>
                <TabsTrigger value="cancelled" data-testid="tab-cancelled-policies">
                  İptal ({cancelledPolicies.length})
                </TabsTrigger>
                <TabsTrigger value="all" data-testid="tab-all-policies">
                  Tümü ({policies?.length || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="active">
                <PolicyTable policies={activePolicies} formatCurrency={formatCurrency} formatDate={formatDate} getExpiryBadge={getExpiryBadge} />
              </TabsContent>

              <TabsContent value="expired">
                <PolicyTable policies={expiredPolicies} formatCurrency={formatCurrency} formatDate={formatDate} getExpiryBadge={getExpiryBadge} />
              </TabsContent>

              <TabsContent value="cancelled">
                <PolicyTable policies={cancelledPolicies} formatCurrency={formatCurrency} formatDate={formatDate} getExpiryBadge={getExpiryBadge} />
              </TabsContent>

              <TabsContent value="all">
                <PolicyTable policies={policies || []} formatCurrency={formatCurrency} formatDate={formatDate} getExpiryBadge={getExpiryBadge} />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PolicyTable({ 
  policies, 
  formatCurrency, 
  formatDate, 
  getExpiryBadge 
}: { 
  policies: Customer[]; 
  formatCurrency: (v: string | number | null) => string;
  formatDate: (v: string | null) => string;
  getExpiryBadge: (v: string | null) => JSX.Element | null;
}) {
  if (policies.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Bu kategoride poliçe bulunamadi
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Poliçe No</TableHead>
            <TableHead>Branş</TableHead>
            <TableHead>Sigorta Şirketi</TableHead>
            <TableHead>Baslangıç</TableHead>
            <TableHead>Bitiş</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead className="text-right">Brüt Prim</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {policies.map((policy) => (
            <TableRow key={policy.id} data-testid={`row-policy-${policy.id}`}>
              <TableCell className="font-medium">{policy.policeNumarasi || "-"}</TableCell>
              <TableCell>
                <Badge variant="outline">{policy.anaBrans || "-"}</Badge>
              </TableCell>
              <TableCell>{policy.sigortaSirketiAdi || "-"}</TableCell>
              <TableCell>{formatDate(policy.baslangicTarihi)}</TableCell>
              <TableCell>{formatDate(policy.bitisTarihi)}</TableCell>
              <TableCell>{getExpiryBadge(policy.bitisTarihi)}</TableCell>
              <TableCell className="text-right">{formatCurrency(policy.brut)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
