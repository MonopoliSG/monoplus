import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useSearch, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Users, 
  Search, 
  Eye, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Building2,
  User,
  Sparkles,
  Car
} from "lucide-react";
import type { CustomerProfile } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PaginatedProfilesResponse {
  profiles: CustomerProfile[];
  total: number;
  page: number;
  totalPages: number;
}

export default function CustomerProfiles() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const { toast } = useToast();
  
  const searchParams = new URLSearchParams(searchString);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [customerType, setCustomerType] = useState(searchParams.get("customerType") || "");
  const [policyType, setPolicyType] = useState(searchParams.get("policyType") || "");
  const [product, setProduct] = useState(searchParams.get("product") || "");
  const [hashtag, setHashtag] = useState(searchParams.get("hashtag") || "");
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"));

  const { data: policyTypes } = useQuery<string[]>({
    queryKey: ["/api/customer-profiles/policy-types"],
  });

  const { data, isLoading, refetch } = useQuery<PaginatedProfilesResponse>({
    queryKey: ["/api/customer-profiles", { page, search, city, customerType, policyType, product, hashtag }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "25");
      if (search) params.set("search", search);
      if (city && city !== "all") params.set("city", city);
      if (customerType && customerType !== "all") params.set("customerType", customerType);
      if (policyType && policyType !== "all") params.set("policyType", policyType);
      if (product && product !== "all") params.set("product", product);
      if (hashtag) params.set("hashtag", hashtag);
      
      const response = await fetch(`/api/customer-profiles?${params.toString()}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch profiles");
      return response.json();
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/customer-profiles/sync");
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Senkronizasyon Tamamlandi",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customer-profiles"] });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Profiller senkronize edilemedi",
        variant: "destructive",
      });
    },
  });

  const aiAnalyzeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/customer-profiles/ai-analyze");
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "AI Analiz Tamamlandi",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customer-profiles"] });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "AI analizi tamamlanamadi",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (city && city !== "all") params.set("city", city);
    if (customerType && customerType !== "all") params.set("customerType", customerType);
    if (policyType && policyType !== "all") params.set("policyType", policyType);
    if (product && product !== "all") params.set("product", product);
    if (hashtag) params.set("hashtag", hashtag);
    if (page > 1) params.set("page", page.toString());
    
    const newUrl = params.toString() ? `/customer-profiles?${params.toString()}` : "/customer-profiles";
    setLocation(newUrl, { replace: true });
  }, [search, city, customerType, policyType, product, hashtag, page, setLocation]);

  const handleSearch = () => {
    setPage(1);
    refetch();
  };

  const clearFilters = () => {
    setSearch("");
    setCity("");
    setCustomerType("");
    setPolicyType("");
    setProduct("");
    setHashtag("");
    setPage(1);
    setLocation("/customer-profiles");
  };

  const hasActiveFilters = search || city || customerType || policyType || product || hashtag;

  const formatCurrency = (value: string | null) => {
    if (!value) return "-";
    const num = parseFloat(value);
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="p-4 md:p-6 space-y-4" data-testid="page-customer-profiles">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Müsteri Profilleri</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            data-testid="button-sync-profiles"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? "animate-spin" : ""}`} />
            Profilleri Senkronize Et
          </Button>
          <Button
            onClick={() => aiAnalyzeMutation.mutate()}
            disabled={aiAnalyzeMutation.isPending}
            data-testid="button-ai-analyze"
          >
            <Sparkles className={`h-4 w-4 mr-2 ${aiAnalyzeMutation.isPending ? "animate-pulse" : ""}`} />
            {aiAnalyzeMutation.isPending ? "Analiz Ediliyor..." : "AI ile Analiz Et"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Filtreler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Müsteri ara (isim, hesap kodu, TC, e-posta...)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                data-testid="input-search-profiles"
              />
            </div>
            <div className="w-[180px]">
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger data-testid="select-city">
                  <SelectValue placeholder="Sehir" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Sehirler</SelectItem>
                  <SelectItem value="İSTANBUL">Istanbul</SelectItem>
                  <SelectItem value="ANKARA">Ankara</SelectItem>
                  <SelectItem value="İZMİR">Izmir</SelectItem>
                  <SelectItem value="BURSA">Bursa</SelectItem>
                  <SelectItem value="ANTALYA">Antalya</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-[180px]">
              <Select value={customerType} onValueChange={setCustomerType}>
                <SelectTrigger data-testid="select-customer-type">
                  <SelectValue placeholder="Müsteri Tipi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="Bireysel">Bireysel</SelectItem>
                  <SelectItem value="Kurumsal">Kurumsal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-[220px]">
              <Select value={policyType} onValueChange={setPolicyType}>
                <SelectTrigger data-testid="select-policy-type">
                  <SelectValue placeholder="Poliçe Türü" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Poliçe Türleri</SelectItem>
                  {policyTypes?.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-[180px]">
              <Select value={product} onValueChange={setProduct}>
                <SelectTrigger data-testid="select-product">
                  <SelectValue placeholder="Ürün" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Ürünler</SelectItem>
                  <SelectItem value="Kasko">Kasko</SelectItem>
                  <SelectItem value="Trafik">Trafik</SelectItem>
                  <SelectItem value="Konut">Konut</SelectItem>
                  <SelectItem value="DASK">DASK</SelectItem>
                  <SelectItem value="Sağlık">Sağlık</SelectItem>
                  <SelectItem value="Hayat">Hayat</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[180px]">
              <Input
                placeholder="Hashtag ara (#premium, #kurumsal...)"
                value={hashtag}
                onChange={(e) => setHashtag(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                data-testid="input-hashtag"
              />
            </div>
            <Button onClick={handleSearch} data-testid="button-apply-filters">
              <Search className="h-4 w-4 mr-2" />
              Ara
            </Button>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters} data-testid="button-clear-filters">
                Temizle
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : data?.profiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Users className="h-12 w-12 mb-4" />
              <p>Müsteri profili bulunamadi</p>
              <p className="text-sm">Profilleri senkronize etmeyi deneyin</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Müsteri</TableHead>
                      <TableHead>Iletisim</TableHead>
                      <TableHead>Sehir</TableHead>
                      <TableHead className="text-center">Poliçeler</TableHead>
                      <TableHead>Ürünler</TableHead>
                      <TableHead>Araçlar</TableHead>
                      <TableHead className="text-right">Toplam Prim</TableHead>
                      <TableHead className="text-center">Islemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.profiles.map((profile) => (
                      <TableRow key={profile.id} data-testid={`row-profile-${profile.id}`}>
                        <TableCell>
                          <div className="flex items-start gap-2">
                            <div className="p-2 rounded-full bg-muted">
                              {profile.musteriTipi === "Kurumsal" ? (
                                <Building2 className="h-4 w-4" />
                              ) : (
                                <User className="h-4 w-4" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium">{profile.musteriIsmi || "-"}</div>
                              <div className="text-xs text-muted-foreground">
                                {profile.hesapKodu}
                              </div>
                              <Badge variant="outline" className="mt-1 text-xs">
                                {profile.musteriTipi || "Bireysel"}
                              </Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            {profile.gsmNo && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {profile.gsmNo}
                              </div>
                            )}
                            {profile.ePosta && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                {profile.ePosta}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {profile.sehir && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              {profile.sehir}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-medium">{profile.aktifPolice || 0}</span>
                            <span className="text-xs text-muted-foreground">
                              / {profile.toplamPolice || 0} toplam
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {profile.sahipOlunanUrunler?.split(", ").slice(0, 3).map((urun, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {urun}
                              </Badge>
                            ))}
                            {(profile.sahipOlunanUrunler?.split(", ").length || 0) > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{(profile.sahipOlunanUrunler?.split(", ").length || 0) - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {profile.aracBilgileri && (() => {
                            try {
                              const araclar = JSON.parse(profile.aracBilgileri);
                              if (araclar && araclar.length > 0) {
                                return (
                                  <div className="flex flex-wrap gap-1 max-w-[180px]">
                                    {araclar.slice(0, 2).map((arac: any, idx: number) => (
                                      <Badge key={idx} variant="outline" className="text-xs">
                                        <Car className="h-3 w-3 mr-1" />
                                        {arac.marka}
                                      </Badge>
                                    ))}
                                    {araclar.length > 2 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{araclar.length - 2}
                                      </Badge>
                                    )}
                                  </div>
                                );
                              }
                              return <span className="text-muted-foreground text-xs">-</span>;
                            } catch {
                              return <span className="text-muted-foreground text-xs">-</span>;
                            }
                          })()}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(profile.toplamBrutPrim)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Link href={`/customer-profiles/${profile.id}`}>
                            <Button size="sm" variant="ghost" data-testid={`button-view-profile-${profile.id}`}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between p-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Toplam {data?.total || 0} müsteri profili
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    data-testid="button-prev-page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Sayfa {page} / {data?.totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.min(data?.totalPages || 1, page + 1))}
                    disabled={page >= (data?.totalPages || 1)}
                    data-testid="button-next-page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
