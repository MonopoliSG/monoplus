import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Upload, Filter, Search, Eye, X, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import type { Customer } from "@shared/schema";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";

interface PaginatedResponse {
  customers: Customer[];
  total: number;
  page: number;
  totalPages: number;
}

// Helper function to build customer filter URL
export function buildCustomerFilterUrl(filters: {
  search?: string;
  city?: string;
  branch?: string;
  segment?: string;
  renewalDays?: number;
  aiPredictionType?: string;
  aiAnalysisId?: string;
  dateType?: string;
  dateFrom?: string;
  dateTo?: string;
  customerType?: string;
  page?: number;
}): string {
  const params = new URLSearchParams();
  
  if (filters.search) params.set("search", filters.search);
  if (filters.city) params.set("city", filters.city);
  if (filters.branch) params.set("branch", filters.branch);
  if (filters.segment) params.set("segment", filters.segment);
  if (filters.renewalDays) params.set("renewalDays", filters.renewalDays.toString());
  if (filters.aiPredictionType) params.set("aiPredictionType", filters.aiPredictionType);
  if (filters.aiAnalysisId) params.set("aiAnalysisId", filters.aiAnalysisId);
  if (filters.dateType) params.set("dateType", filters.dateType);
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (filters.customerType) params.set("customerType", filters.customerType);
  if (filters.page && filters.page > 1) params.set("page", filters.page.toString());
  
  const queryString = params.toString();
  return queryString ? `/customers?${queryString}` : "/customers";
}

// Parse filters from search string
function parseFiltersFromSearch(searchString: string): {
  search: string;
  city: string;
  branch: string;
  segment: string;
  renewalDays: string;
  aiPredictionType: string;
  aiAnalysisId: string;
  dateType: string;
  dateFrom: string;
  dateTo: string;
  customerType: string;
  page: number;
} {
  const searchParams = new URLSearchParams(searchString);
  return {
    search: searchParams.get("search") || "",
    city: searchParams.get("city") || "",
    branch: searchParams.get("branch") || "",
    segment: searchParams.get("segment") || "",
    renewalDays: searchParams.get("renewalDays") || "",
    aiPredictionType: searchParams.get("aiPredictionType") || "",
    aiAnalysisId: searchParams.get("aiAnalysisId") || "",
    dateType: searchParams.get("dateType") || "",
    dateFrom: searchParams.get("dateFrom") || "",
    dateTo: searchParams.get("dateTo") || "",
    customerType: searchParams.get("customerType") || "",
    page: parseInt(searchParams.get("page") || "1") || 1,
  };
}

export default function Customers() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const filters = useMemo(() => parseFiltersFromSearch(searchString), [searchString]);
  
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Local search state for debouncing
  const [localSearch, setLocalSearch] = useState(filters.search);
  const pageSize = 50;

  // Sync local search with URL when URL changes
  useEffect(() => {
    setLocalSearch(filters.search);
  }, [filters.search]);

  // Update URL with new filters - use searchString directly to avoid stale closure
  const updateFilters = useCallback((newFilters: Record<string, string | number | undefined>) => {
    const currentFilters = parseFiltersFromSearch(searchString);
    const merged = { ...currentFilters, ...newFilters };
    // Reset page to 1 when filters change (except when explicitly setting page)
    if (!('page' in newFilters)) {
      merged.page = 1;
    }
    const url = buildCustomerFilterUrl({
      search: merged.search || undefined,
      city: merged.city || undefined,
      branch: merged.branch || undefined,
      segment: merged.segment || undefined,
      renewalDays: merged.renewalDays ? parseInt(String(merged.renewalDays)) : undefined,
      aiPredictionType: merged.aiPredictionType || undefined,
      aiAnalysisId: merged.aiAnalysisId || undefined,
      dateType: merged.dateType || undefined,
      dateFrom: merged.dateFrom || undefined,
      dateTo: merged.dateTo || undefined,
      customerType: merged.customerType || undefined,
      page: merged.page as number,
    });
    navigate(url, { replace: true });
  }, [searchString, navigate]);

  // Debounced search update
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== filters.search) {
        updateFilters({ search: localSearch || undefined, page: undefined });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, filters.search, updateFilters]);

  // Check if any filters are active
  const hasActiveFilters = !!(
    filters.search || filters.city || filters.branch || filters.segment ||
    filters.renewalDays || filters.aiPredictionType || filters.aiAnalysisId ||
    filters.dateType || filters.dateFrom || filters.dateTo || filters.customerType
  );

  const { data: paginatedData, isLoading } = useQuery<PaginatedResponse>({
    queryKey: [
      "/api/customers/paginated",
      filters.page,
      filters.search,
      filters.city,
      filters.branch,
      filters.segment,
      filters.renewalDays,
      filters.aiPredictionType,
      filters.aiAnalysisId,
      filters.dateType,
      filters.dateFrom,
      filters.dateTo,
      filters.customerType,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", filters.page.toString());
      params.set("limit", pageSize.toString());
      if (filters.search) params.set("search", filters.search);
      if (filters.city) params.set("city", filters.city);
      if (filters.branch) params.set("branch", filters.branch);
      if (filters.segment) params.set("segment", filters.segment);
      if (filters.renewalDays) params.set("renewalDays", filters.renewalDays);
      if (filters.aiPredictionType) params.set("aiPredictionType", filters.aiPredictionType);
      if (filters.aiAnalysisId) params.set("aiAnalysisId", filters.aiAnalysisId);
      if (filters.dateType) params.set("dateType", filters.dateType);
      if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.set("dateTo", filters.dateTo);
      if (filters.customerType) params.set("customerType", filters.customerType);
      
      const res = await fetch(`/api/customers/paginated?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch customers");
      return res.json();
    },
  });

  const customers = paginatedData?.customers || [];
  const totalPages = paginatedData?.totalPages || 1;
  const totalCustomers = paginatedData?.total || 0;

  const { data: allCustomersForFilters = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
    staleTime: 60000,
  });

  const cities = useMemo(() => {
    const uniqueCities = new Set(allCustomersForFilters.map((c) => c.sehir).filter(Boolean));
    return Array.from(uniqueCities).sort();
  }, [allCustomersForFilters]);

  const branches = useMemo(() => {
    const uniqueBranches = new Set(allCustomersForFilters.map((c) => c.anaBrans).filter(Boolean));
    return Array.from(uniqueBranches).sort();
  }, [allCustomersForFilters]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    try {
      return format(parseISO(dateStr), "d MMM yyyy", { locale: tr });
    } catch {
      return dateStr;
    }
  };

  // Get filter label for display
  const getFilterLabel = (key: string, value: string): string => {
    switch (key) {
      case "city": return `Şehir: ${value}`;
      case "branch": return `Branş: ${value}`;
      case "segment": return `Segment: ${value}`;
      case "renewalDays": return `${value} gün içinde yenileme`;
      case "aiPredictionType": 
        return value === "cross_sell" ? "Çapraz Satış Fırsatı" : 
               value === "churn_prediction" ? "İptal Riski" : value;
      case "aiAnalysisId": return "AI Segment Analizi";
      case "customerType": return value === "kurumsal" ? "Kurumsal" : "Bireysel";
      case "dateType": 
        return value === "policeBitis" ? "Bitiş Tarihi" : 
               value === "policeBaslangic" ? "Başlangıç Tarihi" : "Tanzim Tarihi";
      case "dateFrom": return `Tarih: ${value}`;
      case "dateTo": return `- ${value}`;
      default: return value;
    }
  };

  // Get active filter badges
  const getActiveFilterBadges = () => {
    const badges: { key: string; label: string }[] = [];
    if (filters.city) badges.push({ key: "city", label: getFilterLabel("city", filters.city) });
    if (filters.branch) badges.push({ key: "branch", label: getFilterLabel("branch", filters.branch) });
    if (filters.segment) badges.push({ key: "segment", label: getFilterLabel("segment", filters.segment) });
    if (filters.renewalDays) badges.push({ key: "renewalDays", label: getFilterLabel("renewalDays", filters.renewalDays) });
    if (filters.aiPredictionType) badges.push({ key: "aiPredictionType", label: getFilterLabel("aiPredictionType", filters.aiPredictionType) });
    if (filters.aiAnalysisId) badges.push({ key: "aiAnalysisId", label: getFilterLabel("aiAnalysisId", filters.aiAnalysisId) });
    if (filters.customerType) badges.push({ key: "customerType", label: getFilterLabel("customerType", filters.customerType) });
    if (filters.dateType && (filters.dateFrom || filters.dateTo)) {
      let dateLabel = getFilterLabel("dateType", filters.dateType);
      if (filters.dateFrom) dateLabel += `: ${filters.dateFrom}`;
      if (filters.dateTo) dateLabel += ` - ${filters.dateTo}`;
      badges.push({ key: "date", label: dateLabel });
    }
    return badges;
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {showFilters && (
        <div className="border-b bg-muted/30 p-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-4 gap-2">
              <h3 className="font-medium">Filtreler</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/customers")}
                disabled={!hasActiveFilters}
                data-testid="button-clear-all-filters"
              >
                <X className="h-4 w-4 mr-1" />
                Tümünü Temizle
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-5">
              <div className="space-y-2">
                <Label>Şehir</Label>
                <Select
                  value={filters.city || "__all__"}
                  onValueChange={(v) => updateFilters({ city: v === "__all__" ? "" : v })}
                >
                  <SelectTrigger data-testid="select-city">
                    <SelectValue placeholder="Tüm şehirler" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Tüm şehirler</SelectItem>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city!}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Ana Branş</Label>
                <Select
                  value={filters.branch || "__all__"}
                  onValueChange={(v) => updateFilters({ branch: v === "__all__" ? "" : v })}
                >
                  <SelectTrigger data-testid="select-branch">
                    <SelectValue placeholder="Tüm branşlar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Tüm branşlar</SelectItem>
                    {branches.map((branch) => (
                      <SelectItem key={branch} value={branch!}>{branch}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Müşteri Tipi</Label>
                <Select
                  value={filters.customerType || "__all__"}
                  onValueChange={(v) => updateFilters({ customerType: v === "__all__" ? "" : v })}
                >
                  <SelectTrigger data-testid="select-customer-type">
                    <SelectValue placeholder="Tüm tipler" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Tüm tipler</SelectItem>
                    <SelectItem value="kurumsal">Kurumsal</SelectItem>
                    <SelectItem value="bireysel">Bireysel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tarih Türü</Label>
                <Select
                  value={filters.dateType || "__all__"}
                  onValueChange={(v) => updateFilters({ dateType: v === "__all__" ? "" : v })}
                >
                  <SelectTrigger data-testid="select-date-type">
                    <SelectValue placeholder="Tarih seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Tarih filtresi yok</SelectItem>
                    <SelectItem value="policeBitis">Poliçe Bitiş</SelectItem>
                    <SelectItem value="policeBaslangic">Poliçe Başlangıç</SelectItem>
                    <SelectItem value="tanzim">Tanzim Tarihi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filters.dateType && (
                <>
                  <div className="space-y-2">
                    <Label>Başlangıç Tarihi</Label>
                    <Input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => updateFilters({ dateFrom: e.target.value })}
                      data-testid="input-date-from"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bitiş Tarihi</Label>
                    <Input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => updateFilters({ dateTo: e.target.value })}
                      data-testid="input-date-to"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 p-6 space-y-4 overflow-auto">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold" data-testid="text-page-title">Müşteriler</h1>
            <p className="text-muted-foreground">
              {totalCustomers} müşteri {totalPages > 1 && `(Sayfa ${filters.page}/${totalPages})`}
            </p>
            {hasActiveFilters && (
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {getActiveFilterBadges().map((badge) => (
                  <Badge key={badge.key} variant="secondary" className="text-xs">
                    {badge.label}
                  </Badge>
                ))}
                <Link href="/customers">
                  <Button variant="ghost" size="sm" className="h-6 px-2" data-testid="button-clear-filters">
                    <X className="h-3 w-3 mr-1" />
                    Temizle
                  </Button>
                </Link>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant={showFilters ? "default" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
              data-testid="button-toggle-filters"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtreler
            </Button>
            <Button asChild data-testid="button-import-csv">
              <Link href="/import">
                <Upload className="h-4 w-4 mr-2" />
                CSV İçe Aktar
              </Link>
            </Button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="İsim, TC Kimlik veya telefon ile ara..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
        </div>

        <Card>
          <ScrollArea className="h-[calc(100vh-300px)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Müşteri</TableHead>
                  <TableHead>TC Kimlik</TableHead>
                  <TableHead>Şehir</TableHead>
                  <TableHead>Ana Branş</TableHead>
                  <TableHead>Poliçe No</TableHead>
                  <TableHead>Bitiş Tarihi</TableHead>
                  <TableHead className="w-[100px]">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        Yükleniyor...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Müşteri bulunamadı
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((customer) => (
                    <TableRow key={customer.id} data-testid={`row-customer-${customer.id}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{customer.musteriIsmi}</p>
                          <p className="text-sm text-muted-foreground">{customer.gsmNo || "-"}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{customer.tcKimlikNo}</TableCell>
                      <TableCell>{customer.sehir || "-"}</TableCell>
                      <TableCell>
                        {customer.anaBrans && <Badge variant="secondary">{customer.anaBrans}</Badge>}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{customer.policeNumarasi || "-"}</TableCell>
                      <TableCell>
                        {customer.bitisTarihi ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3" />
                            {formatDate(customer.bitisTarihi)}
                          </div>
                        ) : "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setProfileOpen(true);
                          }}
                          data-testid={`button-view-${customer.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </Card>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateFilters({ page: 1 })}
              disabled={filters.page === 1}
              data-testid="button-first-page"
            >
              İlk
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => updateFilters({ page: Math.max(1, filters.page - 1) })}
              disabled={filters.page === 1}
              data-testid="button-prev-page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              {filters.page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => updateFilters({ page: Math.min(totalPages, filters.page + 1) })}
              disabled={filters.page === totalPages}
              data-testid="button-next-page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateFilters({ page: totalPages })}
              disabled={filters.page === totalPages}
              data-testid="button-last-page"
            >
              Son
            </Button>
          </div>
        )}
      </div>

      <Sheet open={profileOpen} onOpenChange={setProfileOpen}>
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Müşteri Profili</SheetTitle>
          </SheetHeader>
          {selectedCustomer && (
            <div className="space-y-6 mt-6">
              <div>
                <h3 className="font-semibold mb-2">Kişisel Bilgiler</h3>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ad Soyad</span>
                    <span className="font-medium">{selectedCustomer.musteriIsmi}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">TC Kimlik No</span>
                    <span className="font-mono">{selectedCustomer.tcKimlikNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Telefon</span>
                    <span>{selectedCustomer.gsmNo || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hesap Kodu</span>
                    <span>{selectedCustomer.hesapKodu || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Şehir</span>
                    <span>{selectedCustomer.sehir || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Müşteri Tipi</span>
                    <span>{selectedCustomer.musteriTipi || "-"}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Poliçe Bilgileri</h3>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Poliçe No</span>
                    <span className="font-mono">{selectedCustomer.policeNumarasi || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ana Branş</span>
                    <span>{selectedCustomer.anaBrans || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sigorta Şirketi</span>
                    <span>{selectedCustomer.sigortaSirketiAdi || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Başlangıç Tarihi</span>
                    <span>{formatDate(selectedCustomer.baslangicTarihi)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bitiş Tarihi</span>
                    <span>{formatDate(selectedCustomer.bitisTarihi)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Brüt Prim</span>
                    <span>{selectedCustomer.brut || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Net Prim</span>
                    <span>{selectedCustomer.net || "-"}</span>
                  </div>
                </div>
              </div>

              {selectedCustomer.aracPlakasi && (
                <div>
                  <h3 className="font-semibold mb-2">Araç Bilgileri</h3>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Plaka</span>
                      <span className="font-mono">{selectedCustomer.aracPlakasi}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Marka</span>
                      <span>{selectedCustomer.aracMarkasi || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Model</span>
                      <span>{selectedCustomer.aracModeli || "-"}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
