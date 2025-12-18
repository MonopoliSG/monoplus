import { useState } from "react";
import { CustomerTable, type Customer } from "@/components/CustomerTable";
import { CustomerProfile } from "@/components/CustomerProfile";
import { FilterPanel } from "@/components/FilterPanel";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Upload, Filter } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

// todo: remove mock functionality
const mockCustomers: Customer[] = [
  {
    id: "1",
    unvan: "Ahmet Yılmaz",
    meslekGrubu: "Mühendis",
    tcKimlik: "12345678901",
    sehir: "İstanbul",
    ilce: "Kadıköy",
    gsmNo: "0532 123 4567",
    anaBrans: "Kasko",
    araBrans: "Trafik",
    kvkk: "Evet",
    policeNo: "POL-2024-001",
  },
  {
    id: "2",
    unvan: "Fatma Demir",
    meslekGrubu: "Doktor",
    tcKimlik: "98765432109",
    sehir: "Ankara",
    ilce: "Çankaya",
    gsmNo: "0533 987 6543",
    anaBrans: "Sağlık",
    araBrans: "Tamamlayıcı",
    kvkk: "Evet",
    policeNo: "POL-2024-002",
  },
  {
    id: "3",
    unvan: "Mehmet Kaya",
    meslekGrubu: "Avukat",
    tcKimlik: "45678912345",
    sehir: "İzmir",
    ilce: "Konak",
    gsmNo: "0535 456 7890",
    anaBrans: "Konut",
    araBrans: "",
    kvkk: "Hayır",
    policeNo: "POL-2024-003",
  },
  {
    id: "4",
    unvan: "Ayşe Şahin",
    meslekGrubu: "Öğretmen",
    tcKimlik: "78901234567",
    sehir: "İstanbul",
    ilce: "Beşiktaş",
    gsmNo: "0542 789 0123",
    anaBrans: "Hayat",
    araBrans: "Bireysel Emeklilik",
    kvkk: "Evet",
  },
  {
    id: "5",
    unvan: "Ali Öztürk",
    meslekGrubu: "Esnaf",
    tcKimlik: "23456789012",
    sehir: "Bursa",
    ilce: "Nilüfer",
    gsmNo: "0544 234 5678",
    anaBrans: "İşyeri",
    araBrans: "",
    kvkk: "Evet",
    policeNo: "POL-2024-005",
  },
];

const mockCities = ["İstanbul", "Ankara", "İzmir", "Bursa", "Antalya", "Adana", "Konya", "Gaziantep"];
const mockBranches = ["Kasko", "Trafik", "Sağlık", "Konut", "Hayat", "İşyeri"];

export default function Customers() {
  const { toast } = useToast();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setProfileOpen(true);
  };

  const handleAnalyzeCustomer = (customer: Customer) => {
    toast({
      title: "AI Analiz Başlatıldı",
      description: `${customer.unvan} için çapraz satış analizi yapılıyor...`,
    });
    // todo: remove mock functionality
    setTimeout(() => {
      setSelectedCustomer(customer);
      setProfileOpen(true);
    }, 500);
  };

  // todo: remove mock functionality
  const aiRecommendations = [
    "Müşterinin araç sigortası mevcut. Sağlık sigortası teklif edilebilir.",
    "Aile yapısı göz önüne alındığında hayat sigortası önerilir.",
    "Konut sahibi olma ihtimali yüksek, konut sigortası sorgulanmalı.",
  ];

  return (
    <div className="flex h-full">
      {showFilters && (
        <div className="w-64 border-r p-4 hidden lg:block">
          <FilterPanel
            cities={mockCities}
            branches={mockBranches}
            onFilterChange={(filters) => console.log("Filters:", filters)}
          />
        </div>
      )}

      <div className="flex-1 p-6 space-y-4 overflow-auto">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold" data-testid="text-page-title">Müşteriler</h1>
            <p className="text-muted-foreground">Tüm müşteri kayıtlarını görüntüleyin ve yönetin</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
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

        <CustomerTable
          customers={mockCustomers}
          onViewCustomer={handleViewCustomer}
          onAnalyzeCustomer={handleAnalyzeCustomer}
        />
      </div>

      <Sheet open={profileOpen} onOpenChange={setProfileOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-auto">
          <SheetHeader>
            <SheetTitle>Müşteri Profili</SheetTitle>
          </SheetHeader>
          {selectedCustomer && (
            <div className="mt-6">
              <CustomerProfile
                customer={selectedCustomer}
                aiRecommendations={aiRecommendations}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
