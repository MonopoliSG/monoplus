import { ProductCard, type InsuranceProduct } from "../ProductCard";

const product: InsuranceProduct = {
  id: "1",
  name: "Kasko Plus",
  category: "Araç Sigortası",
  description: "Tam kapsamlı araç sigortası. Kaza, hırsızlık, doğal afet ve cam kırılması dahil tüm riskleri kapsar.",
  targetAudience: "Tüm araç sahipleri",
  customerCount: 523,
};

export default function ProductCardExample() {
  return (
    <div className="p-4 max-w-sm">
      <ProductCard
        product={product}
        onEdit={(p) => console.log("Edit:", p.name)}
        onDelete={(p) => console.log("Delete:", p.name)}
      />
    </div>
  );
}
