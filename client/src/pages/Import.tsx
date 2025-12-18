import { useState } from "react";
import { CSVImport } from "@/components/CSVImport";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, FileText, AlertTriangle, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

const expectedColumns = [
  { name: "Ünvan", mapped: "Müşteri İsmi", required: true },
  { name: "Meslek Grubu", mapped: "Meslek", required: false },
  { name: "TC Kimlik No", mapped: "TC Kimlik", required: true },
  { name: "Şehir", mapped: "Şehir", required: true },
  { name: "İlçe", mapped: "İlçe", required: false },
  { name: "GSM No", mapped: "Telefon", required: true },
  { name: "Ana Branş", mapped: "Ana Branş", required: false },
  { name: "Ara Branş", mapped: "Ara Branş", required: false },
  { name: "KVKK", mapped: "KVKK Onayı", required: false },
  { name: "Poliçe No", mapped: "Poliçe No", required: false },
];

export default function Import() {
  const { toast } = useToast();
  const [importedData, setImportedData] = useState<Record<string, string>[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImport = (data: Record<string, string>[]) => {
    setImportedData(data);
    toast({
      title: "CSV Dosyası Yüklendi",
      description: `${data.length} satır veri algılandı.`,
    });
  };

  const processImport = () => {
    setIsProcessing(true);
    // todo: remove mock functionality
    setTimeout(() => {
      setIsProcessing(false);
      toast({
        title: "Veriler İçe Aktarıldı",
        description: `${importedData.length} müşteri kaydı sisteme eklendi.`,
      });
    }, 2000);
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">CSV İçe Aktar</h1>
        <p className="text-muted-foreground">Müşteri verilerinizi CSV formatında sisteme yükleyin</p>
      </div>

      <CSVImport onImport={handleImport} isLoading={isProcessing} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Beklenen Sütunlar
          </CardTitle>
          <CardDescription>
            CSV dosyanız aşağıdaki sütunları içermelidir. Noktalı virgül (;) ile ayrılmış olmalıdır.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2">
            {expectedColumns.map((col) => (
              <div
                key={col.name}
                className="flex items-center justify-between p-2 rounded-md bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{col.name}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{col.mapped}</span>
                </div>
                {col.required ? (
                  <Badge variant="destructive" className="text-xs">Zorunlu</Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">Opsiyonel</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {importedData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Veri Önizleme
            </CardTitle>
            <CardDescription>
              {importedData.length} satır veri yüklenmeye hazır
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Geçerli kayıtlar: {importedData.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span>Eksik veri: 0</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Ünvan</th>
                    <th className="text-left p-2">Şehir</th>
                    <th className="text-left p-2">Ana Branş</th>
                    <th className="text-left p-2">GSM</th>
                  </tr>
                </thead>
                <tbody>
                  {importedData.slice(0, 5).map((row, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">{row["Ünvan"] || "-"}</td>
                      <td className="p-2">{row["Şehir"] || "-"}</td>
                      <td className="p-2">{row["Ana Branş"] || "-"}</td>
                      <td className="p-2">{row["GSM No"] || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {importedData.length > 5 && (
                <p className="text-xs text-muted-foreground mt-2">
                  ve {importedData.length - 5} satır daha...
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 pt-4">
              <Button onClick={processImport} disabled={isProcessing} data-testid="button-process-import">
                {isProcessing ? "İşleniyor..." : "Verileri İçe Aktar"}
              </Button>
              <Button variant="outline" asChild>
                <Link href="/customers">Müşterilere Git</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
