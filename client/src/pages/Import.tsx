import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { CSVImport } from "@/components/CSVImport";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, FileText, AlertTriangle, ArrowRight, RefreshCw, Users, FileSpreadsheet, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

const expectedColumns = [
  { name: "Ünvan", mapped: "Müşteri İsmi", required: true },
  { name: "Meslek Grubu", mapped: "Meslek", required: false },
  { name: "TC Kimlik No", mapped: "TC Kimlik", required: true },
  { name: "Şehir", mapped: "Şehir", required: false },
  { name: "İlçe", mapped: "İlçe", required: false },
  { name: "GSM No", mapped: "Telefon", required: false },
  { name: "Ana Branş", mapped: "Ana Branş", required: false },
  { name: "Ara Branş", mapped: "Ara Branş", required: false },
  { name: "Poliçe No", mapped: "Poliçe No", required: false },
  { name: "Poliçe Başlangıç Tarihi", mapped: "Başlangıç", required: false },
  { name: "Poliçe Bitiş Tarihi", mapped: "Bitiş", required: false },
  { name: "Tanzim Tarihi", mapped: "Tanzim", required: false },
];

interface DuplicateItem {
  existing: any;
  new: any;
}

interface ExcelImportResult {
  created: number;
  updated: number;
  duplicates: any[];
  errors: string[];
  totalRows: number;
}

export default function Import() {
  const { toast } = useToast();
  const [importedData, setImportedData] = useState<Record<string, string>[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateItem[]>([]);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [clearExisting, setClearExisting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const checkDuplicatesMutation = useMutation({
    mutationFn: async (customers: Record<string, string>[]) => {
      const res = await apiRequest("POST", "/api/customers/check-duplicates", { customers });
      return await res.json();
    },
    onSuccess: (data: { hasDuplicates: boolean; duplicates: DuplicateItem[] }) => {
      if (data.hasDuplicates) {
        setDuplicates(data.duplicates);
        setShowDuplicateDialog(true);
      } else {
        importMutation.mutate({ customers: importedData, overwrite: false });
      }
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Oturum sonlandı", description: "Yeniden giriş yapılıyor...", variant: "destructive" });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({ title: "Hata", description: "Duplikat kontrolü yapılamadı", variant: "destructive" });
    },
  });

  const importMutation = useMutation({
    mutationFn: async ({ customers, overwrite }: { customers: Record<string, string>[]; overwrite: boolean }) => {
      const res = await apiRequest("POST", "/api/customers/import", { customers, overwrite });
      return await res.json();
    },
    onSuccess: (data: { created: number; updated: number }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers/paginated"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "İçe Aktarma Tamamlandı",
        description: `${data.created} yeni kayıt eklendi, ${data.updated} kayıt güncellendi.`,
      });
      setImportedData([]);
      setShowDuplicateDialog(false);
      setDuplicates([]);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Oturum sonlandı", description: "Yeniden giriş yapılıyor...", variant: "destructive" });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({ title: "Hata", description: "Veriler içe aktarılamadı", variant: "destructive" });
    },
  });

  const excelImportMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('clearExisting', clearExisting.toString());
      formData.append('overwrite', 'true');
      
      const res = await fetch('/api/customers/import-excel', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Excel dosyası yüklenemedi');
      }
      
      return await res.json() as ExcelImportResult;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers/paginated"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Excel İçe Aktarma Tamamlandı",
        description: `${data.created} yeni kayıt eklendi, ${data.updated} kayıt güncellendi.${data.errors.length > 0 ? ` ${data.errors.length} hata oluştu.` : ''}`,
      });
      setExcelFile(null);
      setClearExisting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Oturum sonlandı", description: "Yeniden giriş yapılıyor...", variant: "destructive" });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({ title: "Hata", description: error.message || "Excel dosyası işlenemedi", variant: "destructive" });
    },
  });

  const handleImport = (data: Record<string, string>[]) => {
    setImportedData(data);
    toast({
      title: "CSV Dosyası Yüklendi",
      description: `${data.length} satır veri algılandı.`,
    });
  };

  const processImport = () => {
    checkDuplicatesMutation.mutate(importedData);
  };

  const handleOverwriteConfirm = () => {
    importMutation.mutate({ customers: importedData, overwrite: true });
  };

  const handleSkipDuplicates = () => {
    const tcSet = new Set(duplicates.map((d) => d.existing.tcKimlikNo));
    const filteredData = importedData.filter((row) => !tcSet.has(row["TC Kimlik No"]));
    importMutation.mutate({ customers: filteredData, overwrite: false });
  };

  const handleExcelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        toast({ title: "Hata", description: "Lütfen .xlsx veya .xls dosyası seçin", variant: "destructive" });
        return;
      }
      setExcelFile(file);
    }
  };

  const handleExcelImport = () => {
    if (excelFile) {
      excelImportMutation.mutate(excelFile);
    }
  };

  const isProcessing = checkDuplicatesMutation.isPending || importMutation.isPending;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">Veri İçe Aktar</h1>
        <p className="text-muted-foreground">Müşteri verilerinizi Excel veya CSV formatında sisteme yükleyin</p>
      </div>

      <Tabs defaultValue="excel" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="excel" className="flex items-center gap-2" data-testid="tab-excel">
            <FileSpreadsheet className="h-4 w-4" />
            Excel İçe Aktar
          </TabsTrigger>
          <TabsTrigger value="csv" className="flex items-center gap-2" data-testid="tab-csv">
            <FileText className="h-4 w-4" />
            CSV İçe Aktar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="excel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Excel Dosyası Yükle (.xlsx)
              </CardTitle>
              <CardDescription>
                Excel dosyanızı doğrudan yükleyin. Türkçe karakterler korunarak aktarılacaktır.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div 
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".xlsx,.xls"
                  onChange={handleExcelFileChange}
                  data-testid="input-excel-file"
                />
                {excelFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <FileSpreadsheet className="h-12 w-12 text-green-600" />
                    <p className="font-medium">{excelFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(excelFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-12 w-12 text-muted-foreground" />
                    <p className="font-medium">Excel dosyasını buraya sürükleyin veya tıklayın</p>
                    <p className="text-sm text-muted-foreground">.xlsx veya .xls formatı</p>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="clearExisting"
                  checked={clearExisting}
                  onCheckedChange={(checked) => setClearExisting(checked === true)}
                  data-testid="checkbox-clear-existing"
                />
                <label
                  htmlFor="clearExisting"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  Mevcut tüm müşteri verilerini sil ve yeniden yükle
                </label>
              </div>

              {clearExisting && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md text-yellow-800 dark:text-yellow-200">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <p className="text-sm">
                    Dikkat: Bu seçenek mevcut tüm müşteri verilerini silecek ve sadece Excel dosyasındaki verileri yükleyecektir.
                  </p>
                </div>
              )}

              {excelFile && (
                <div className="flex items-center gap-2 pt-2">
                  <Button 
                    onClick={handleExcelImport} 
                    disabled={excelImportMutation.isPending}
                    data-testid="button-import-excel"
                  >
                    {excelImportMutation.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Yükleniyor...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Excel Dosyasını İçe Aktar
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setExcelFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  >
                    İptal
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="csv" className="space-y-4">
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
                    className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/50"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium truncate">{col.name}</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm text-muted-foreground truncate">{col.mapped}</span>
                    </div>
                    {col.required ? (
                      <Badge variant="destructive" className="text-xs flex-shrink-0">Zorunlu</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs flex-shrink-0">Opsiyonel</Badge>
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
                <div className="flex items-center gap-4 text-sm flex-wrap">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Geçerli kayıtlar: {importedData.length}</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Ünvan</th>
                        <th className="text-left p-2">TC Kimlik</th>
                        <th className="text-left p-2">Ana Branş</th>
                        <th className="text-left p-2">Şehir</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importedData.slice(0, 5).map((row, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">{row["Ünvan"] || "-"}</td>
                          <td className="p-2">{row["TC Kimlik No"] || "-"}</td>
                          <td className="p-2">{row["Ana Branş"] || "-"}</td>
                          <td className="p-2">{row["Şehir"] || "-"}</td>
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

                <div className="flex items-center gap-2 pt-4 flex-wrap">
                  <Button onClick={processImport} disabled={isProcessing} data-testid="button-process-import">
                    {isProcessing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        İşleniyor...
                      </>
                    ) : (
                      "Verileri İçe Aktar"
                    )}
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/customers">
                      <Users className="h-4 w-4 mr-2" />
                      Müşterilere Git
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Mevcut Kayıtlar Bulundu
            </DialogTitle>
            <DialogDescription>
              {duplicates.length} adet mevcut müşteri kaydı tespit edildi. Bu kayıtları güncellemek istiyor musunuz?
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[400px] pr-4">
            <div className="space-y-4">
              {duplicates.map((dup, index) => (
                <Card key={index} className="p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-sm mb-2 text-muted-foreground">Mevcut Kayıt</h4>
                      <div className="space-y-1 text-sm">
                        <p><strong>İsim:</strong> {dup.existing.musteriIsmi}</p>
                        <p><strong>TC:</strong> {dup.existing.tcKimlikNo}</p>
                        <p><strong>Branş:</strong> {dup.existing.anaBrans || "-"}</p>
                        <p><strong>Şehir:</strong> {dup.existing.sehir || "-"}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm mb-2 text-green-600">Yeni Veri</h4>
                      <div className="space-y-1 text-sm">
                        <p><strong>İsim:</strong> {dup.new["Ünvan"]}</p>
                        <p><strong>TC:</strong> {dup.new["TC Kimlik No"]}</p>
                        <p><strong>Branş:</strong> {dup.new["Ana Branş"] || "-"}</p>
                        <p><strong>Şehir:</strong> {dup.new["Şehir"] || "-"}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>

          <DialogFooter className="flex-wrap gap-2">
            <Button variant="outline" onClick={() => setShowDuplicateDialog(false)}>
              İptal
            </Button>
            <Button variant="secondary" onClick={handleSkipDuplicates} disabled={importMutation.isPending}>
              Mevcut Kayıtları Atla
            </Button>
            <Button onClick={handleOverwriteConfirm} disabled={importMutation.isPending} data-testid="button-confirm-overwrite">
              {importMutation.isPending ? "İşleniyor..." : "Tümünü Güncelle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
