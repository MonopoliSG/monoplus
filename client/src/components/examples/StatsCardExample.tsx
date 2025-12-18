import { StatsCard } from "../StatsCard";
import { Users, Package, TrendingUp } from "lucide-react";

export default function StatsCardExample() {
  return (
    <div className="grid gap-4 md:grid-cols-3 p-4">
      <StatsCard
        title="Toplam Müşteri"
        value="1,247"
        change={12}
        changeLabel="bu ay"
        icon={<Users className="h-4 w-4" />}
      />
      <StatsCard
        title="Aktif Poliçe"
        value="2,834"
        change={-3}
        changeLabel="bu hafta"
        icon={<Package className="h-4 w-4" />}
      />
      <StatsCard
        title="Dönüşüm Oranı"
        value="%24.5"
        change={0}
        icon={<TrendingUp className="h-4 w-4" />}
      />
    </div>
  );
}
