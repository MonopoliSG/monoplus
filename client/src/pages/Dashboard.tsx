import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, PieChart, Target, Calendar, AlertTriangle, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { format, differenceInDays, parseISO } from "date-fns";
import { tr } from "date-fns/locale";

interface DashboardStats {
  customerCount: number;
  renewalCount: number;
  segmentCount: number;
  campaignCount: number;
  renewals: any[];
}

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const getDaysUntilRenewal = (dateStr: string) => {
    if (!dateStr) return null;
    try {
      const date = parseISO(dateStr);
      return differenceInDays(date, new Date());
    } catch {
      return null;
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      return format(parseISO(dateStr), "d MMM yyyy", { locale: tr });
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const renewals = stats?.renewals || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Dashboard</h1>
          <p className="text-muted-foreground">Genel bakış ve önemli metrikler</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Toplam Müşteri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-customer-count">
              {stats?.customerCount || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              30 Gün İçinde Yenileme
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600" data-testid="text-renewal-count">
              {stats?.renewalCount || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Segment Sayısı
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.segmentCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Aktif Kampanya
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.campaignCount || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                30 Gün İçinde Yenilenecek Poliçeler
              </CardTitle>
              <CardDescription>Yenileme takibi yapılması gereken müşteriler</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/customers">
                Tümünü Gör
                <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {renewals.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                30 gün içinde yenilenecek poliçe bulunmuyor.
              </p>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {renewals.map((customer: any) => {
                    const daysLeft = getDaysUntilRenewal(customer.policeBitisTarihi);
                    return (
                      <div
                        key={customer.id}
                        className="flex items-center justify-between gap-2 p-3 rounded-md bg-muted/50"
                        data-testid={`card-renewal-${customer.id}`}
                      >
                        <div className="min-w-0">
                          <p className="font-medium truncate">{customer.unvan}</p>
                          <p className="text-sm text-muted-foreground">
                            {customer.anaBrans} - {customer.sehir || "Şehir yok"}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <Badge
                            variant={daysLeft !== null && daysLeft <= 7 ? "destructive" : "secondary"}
                          >
                            {daysLeft !== null ? `${daysLeft} gün` : "-"}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(customer.policeBitisTarihi)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hızlı Erişim</CardTitle>
            <CardDescription>Sık kullanılan işlemler</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/import">
                <Users className="h-4 w-4 mr-2" />
                CSV İçe Aktar
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/segments">
                <PieChart className="h-4 w-4 mr-2" />
                Segmentleri Görüntüle
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/ai-insights">
                <Target className="h-4 w-4 mr-2" />
                AI Analizleri
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/campaigns">
                <Calendar className="h-4 w-4 mr-2" />
                Kampanyalar
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
