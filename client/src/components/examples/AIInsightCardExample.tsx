import { AIInsightCard } from "../AIInsightCard";

export default function AIInsightCardExample() {
  return (
    <div className="p-4 max-w-md space-y-4">
      <AIInsightCard
        title="Çapraz Satış Fırsatı"
        insight="Araç sigortası olan müşterilerin %35'i henüz sağlık sigortasına sahip değil. Bu segmente özel kampanya ile aylık 50+ yeni poliçe potansiyeli mevcut."
        confidence={87}
        category="Satış"
        onAccept={() => console.log("Accepted")}
        onReject={() => console.log("Rejected")}
      />
      <AIInsightCard
        title="Analiz Yapılıyor"
        insight=""
        isLoading={true}
      />
    </div>
  );
}
