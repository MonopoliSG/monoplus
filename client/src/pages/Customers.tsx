import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
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
import { Upload, Filter, Search, Eye, X, Calendar } from "lucide-react";
import { Link } from "wouter";
import type { Customer } from "@shared/schema";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";

export default function Customers() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1] || "");
  const segmentFilter = searchParams.get("segment");

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState<string>("");
  const [branchFilter, setBranchFilter] = useState<string>("");
  const [dateType, setDateType] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const cities = useMemo(() => {
    const uniqueCities = new Set(customers.map((c) => c.sehir).filter(Boolean));
    return Array.from(uniqueCities).sort();
  }, [customers]);

  const branches = useMemo(() => {
    const uniqueBranches = new Set(customers.map((c) => c.anaBrans).filter(Boolean));
    return Array.from(uniqueBranches).sort();
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        if (
          !customer.musteriIsmi?.toLowerCase().includes(search) &&
          !customer.tcKimlikNo?.toLowerCase().includes(search) &&
          !customer.gsmNo?.toLowerCase().includes(search)
        ) {
          return false;
        }
      }

      if (cityFilter && customer.sehir !== cityFilter) {
        return false;
      }

      if (branchFilter && customer.anaBrans !== branchFilter) {
        return false;
      }

      if (dateType && dateFrom) {
        const customerDate = dateType === "policeBitis"
          ? customer.bitisTarihi
          : dateType === "policeBaslangic"
          ? customer.baslangicTarihi
          : customer.tanzimTarihi;
        
        if (customerDate) {
          const cDate = new Date(customerDate);
          const fromDate = new Date(dateFrom);
          if (cDate < fromDate) return false;
        }
      }

      if (dateType && dateTo) {
        const customerDate = dateType === "policeBitis"
          ? customer.bitisTarihi
          : dateType === "policeBaslangic"
          ? customer.baslangicTarihi
          : customer.tanzimTarihi;
        
        if (customerDate) {
          const cDate = new Date(customerDate);
          const toDate = new Date(dateTo);
          if (cDate > toDate) return false;
        }
      }

      return true;
    });
  }, [customers, searchTerm, cityFilter, branchFilter, dateType, dateFrom, dateTo]);

  const clearFilters = () => {
    setSearchTerm("");
    setCityFilter("");
    setBranchFilter("");
    setDateType("");
    setDateFrom("");
    setDateTo("");
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    try {
      return format(parseISO(dateStr), "d MMM yyyy", { locale: tr });
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="h-96 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {showFilters && (
        <div className="w-72 border-r bg-muted/30 hidden lg:block">
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Filtreler</h3>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Temizle
              </Button>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Şehir</Label>
                <Select value={cityFilter} onValueChange={setCityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Şehir seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tümü</SelectItem>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city!}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Ana Branş</Label>
                <Select value={branchFilter} onValueChange={setBranchFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Branş seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tümü</SelectItem>
                    {branches.map((branch) => (
                      <SelectItem key={branch} value={branch!}>{branch}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tarih Türü</Label>
                <Select value={dateType} onValueChange={setDateType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tarih türü seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tümü</SelectItem>
                    <SelectItem value="policeBitis">Poliçe Bitiş</SelectItem>
                    <SelectItem value="policeBaslangic">Poliçe Başlangıç</SelectItem>
                    <SelectItem value="tanzim">Tanzim Tarihi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {dateType && (
                <>
                  <div className="space-y-2">
                    <Label>Başlangıç Tarihi</Label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bitiş Tarihi</Label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
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
              {filteredCustomers.length} müşteri{segmentFilter ? " (segment filtreli)" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant={showFilters ? "default" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
              className="hidden lg:flex"
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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
                {filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Müşteri bulunamadı
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
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
      </div>

      <Sheet open={profileOpen} onOpenChange={setProfileOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-auto">
          <SheetHeader>
            <SheetTitle>Müşteri Profili</SheetTitle>
          </SheetHeader>
          {selectedCustomer && (
            <div className="mt-6 space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Ünvan</Label>
                    <p className="font-medium">{selectedCustomer.musteriIsmi}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">TC Kimlik No</Label>
                    <p className="font-mono">{selectedCustomer.tcKimlikNo}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Telefon</Label>
                    <p>{selectedCustomer.gsmNo || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Meslek</Label>
                    <p>{selectedCustomer.meslekGrubu || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Şehir</Label>
                    <p>{selectedCustomer.sehir || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">İlçe</Label>
                    <p>{selectedCustomer.ilce || "-"}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Poliçe Bilgileri</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Poliçe No</Label>
                    <p className="font-mono">{selectedCustomer.policeNumarasi || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Ana Branş</Label>
                    <p>{selectedCustomer.anaBrans || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Ara Branş</Label>
                    <p>{selectedCustomer.araBrans || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Başlangıç Tarihi</Label>
                    <p>{formatDate(selectedCustomer.baslangicTarihi)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Bitiş Tarihi</Label>
                    <p>{formatDate(selectedCustomer.bitisTarihi)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Tanzim Tarihi</Label>
                    <p>{formatDate(selectedCustomer.tanzimTarihi)}</p>
                  </div>
                </div>
              </div>

              {selectedCustomer.aracMarkasi && (
                <div className="space-y-4">
                  <h4 className="font-medium">Araç Bilgileri</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Marka</Label>
                      <p>{selectedCustomer.aracMarkasi}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Model</Label>
                      <p>{selectedCustomer.aracModeli || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Model Yılı</Label>
                      <p>{selectedCustomer.modelYili || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Plaka</Label>
                      <p>{selectedCustomer.aracPlakasi || "-"}</p>
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
