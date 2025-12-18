import { useState } from "react";
import { ProductCard, type InsuranceProduct } from "@/components/ProductCard";
import { ProductFormDialog } from "@/components/ProductFormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// todo: remove mock functionality
const mockProducts: InsuranceProduct[] = [
  {
    id: "1",
    name: "Kasko Plus",
    category: "Araç Sigortası",
    description: "Tam kapsamlı araç sigortası. Kaza, hırsızlık, doğal afet ve cam kırılması dahil tüm riskleri kapsar.",
    targetAudience: "Tüm araç sahipleri",
    customerCount: 523,
  },
  {
    id: "2",
    name: "Trafik Sigortası",
    category: "Araç Sigortası",
    description: "Zorunlu trafik sigortası. Yasal gereklilik olarak tüm motorlu araç sahipleri için.",
    targetAudience: "Zorunlu - tüm araç sahipleri",
    customerCount: 892,
  },
  {
    id: "3",
    name: "Özel Sağlık Premium",
    category: "Sağlık Sigortası",
    description: "Yatarak ve ayakta tedavi, check-up, diş ve göz kapsam seçenekleri ile kapsamlı sağlık güvencesi.",
    targetAudience: "35-55 yaş arası profesyoneller",
    customerCount: 312,
  },
  {
    id: "4",
    name: "Tamamlayıcı Sağlık",
    category: "Sağlık Sigortası",
    description: "SGK'yı tamamlayan özel sağlık sigortası. Devlet hastanelerinde fark ücretini karşılar.",
    targetAudience: "SGK'lı çalışanlar",
    customerCount: 445,
  },
  {
    id: "5",
    name: "Konut Güvence",
    category: "Konut Sigortası",
    description: "Yangın, hırsızlık, deprem ve doğal afetlere karşı kapsamlı ev sigortası.",
    targetAudience: "Ev sahipleri ve kiracılar",
    customerCount: 267,
  },
  {
    id: "6",
    name: "Bireysel Emeklilik",
    category: "Hayat Sigortası",
    description: "Devlet katkısı ile geleceğinizi güvence altına alın. Esnek ödeme seçenekleri.",
    targetAudience: "25-45 yaş çalışanlar",
    customerCount: 189,
  },
];

const categories = ["Tümü", "Araç Sigortası", "Sağlık Sigortası", "Konut Sigortası", "Hayat Sigortası"];

export default function Products() {
  const { toast } = useToast();
  const [products, setProducts] = useState(mockProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tümü");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<InsuranceProduct | null>(null);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "Tümü" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleEdit = (product: InsuranceProduct) => {
    setEditingProduct(product);
    setDialogOpen(true);
  };

  const handleDelete = (product: InsuranceProduct) => {
    setProducts(products.filter((p) => p.id !== product.id));
    toast({
      title: "Ürün silindi",
      description: `${product.name} başarıyla silindi.`,
    });
  };

  const handleSave = (data: Partial<InsuranceProduct>) => {
    if (editingProduct) {
      setProducts(products.map((p) =>
        p.id === editingProduct.id ? { ...p, ...data } : p
      ));
      toast({ title: "Ürün güncellendi" });
    } else {
      const newProduct: InsuranceProduct = {
        id: Date.now().toString(),
        name: data.name || "",
        category: data.category || "",
        description: data.description || "",
        targetAudience: data.targetAudience,
        customerCount: 0,
      };
      setProducts([...products, newProduct]);
      toast({ title: "Yeni ürün eklendi" });
    }
    setEditingProduct(null);
  };

  const openNewProductDialog = () => {
    setEditingProduct(null);
    setDialogOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Sigorta Ürünleri</h1>
          <p className="text-muted-foreground">Ürün kataloğunu yönetin ve düzenleyin</p>
        </div>
        <Button onClick={openNewProductDialog} data-testid="button-add-product">
          <Plus className="h-4 w-4 mr-2" />
          Yeni Ürün
        </Button>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Ürün ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="input-search-products"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48" data-testid="select-category-filter">
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>Arama kriterlerine uygun ürün bulunamadı.</p>
        </div>
      )}

      <ProductFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editingProduct}
        onSave={handleSave}
      />
    </div>
  );
}
