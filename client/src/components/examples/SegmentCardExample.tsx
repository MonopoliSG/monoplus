import { SegmentCard, type Segment } from "../SegmentCard";

const segment: Segment = {
  id: "1",
  name: "Genç Profesyoneller (25-35)",
  description: "25-35 yaş arası çalışan profesyoneller",
  customerCount: 312,
  totalCustomers: 1247,
  behaviors: [
    { label: "Araç Sigortası Var", percentage: 78 },
    { label: "Sağlık Sigortası Var", percentage: 45 },
  ],
  aiInsight: "Bu segment dijital kanallara yatkın. Mobil uygulama üzerinden self-servis işlemler sunulabilir.",
};

export default function SegmentCardExample() {
  return (
    <div className="p-4 max-w-md">
      <SegmentCard
        segment={segment}
        onAnalyze={(s) => console.log("Analyze:", s.name)}
        onViewCustomers={(s) => console.log("View customers:", s.name)}
      />
    </div>
  );
}
