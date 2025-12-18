import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, CheckCircle2, AlertCircle, X } from "lucide-react";

interface CSVImportProps {
  onImport?: (data: Record<string, string>[]) => void;
  isLoading?: boolean;
}

export function CSVImport({ onImport, isLoading }: CSVImportProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [previewData, setPreviewData] = useState<string[]>([]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const parseCSV = (text: string): Record<string, string>[] => {
    const lines = text.split("\n").filter((line) => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(";").map((h) => h.trim());
    const data: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(";").map((v) => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });
      data.push(row);
    }

    return data;
  };

  const processFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setStatus("uploading");
    setProgress(0);

    try {
      const text = await selectedFile.text();
      const lines = text.split("\n").filter((line) => line.trim());
      setPreviewData(lines[0]?.split(";").slice(0, 5) || []);

      for (let i = 0; i <= 100; i += 10) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        setProgress(i);
      }

      const parsedData = parseCSV(text);
      setStatus("success");
      onImport?.(parsedData);
    } catch {
      setStatus("error");
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type === "text/csv" || droppedFile?.name.endsWith(".csv")) {
      processFile(droppedFile);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setProgress(0);
    setStatus("idle");
    setPreviewData([]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          CSV Dosyası İçe Aktar
        </CardTitle>
        <CardDescription>
          Müşteri verilerini CSV formatında yükleyin. Dosya noktalı virgül (;) ile ayrılmış olmalıdır.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status === "idle" && (
          <div
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            data-testid="dropzone-csv"
          >
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
              CSV dosyasını buraya sürükleyip bırakın
            </p>
            <p className="text-xs text-muted-foreground mb-4">veya</p>
            <Button variant="outline" asChild>
              <label className="cursor-pointer" data-testid="button-select-file">
                Dosya Seç
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </label>
            </Button>
          </div>
        )}

        {(status === "uploading" || isLoading) && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium">{file?.name}</p>
                <p className="text-xs text-muted-foreground">Yükleniyor...</p>
              </div>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-md bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Dosya başarıyla yüklendi
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">{file?.name}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={resetUpload} data-testid="button-reset-upload">
                <X className="h-4 w-4" />
              </Button>
            </div>
            {previewData.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Algılanan Sütunlar:</p>
                <div className="flex flex-wrap gap-1">
                  {previewData.map((col, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs bg-muted rounded"
                    >
                      {col}
                    </span>
                  ))}
                  {previewData.length >= 5 && (
                    <span className="px-2 py-1 text-xs text-muted-foreground">+daha fazla</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {status === "error" && (
          <div className="flex items-center gap-3 p-3 rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                Dosya yüklenirken hata oluştu
              </p>
              <p className="text-xs text-red-600 dark:text-red-400">Lütfen tekrar deneyin</p>
            </div>
            <Button variant="ghost" size="icon" onClick={resetUpload}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
