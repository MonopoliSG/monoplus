import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, RefreshCw, Users, TrendingUp, Eye, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Segment } from "@shared/schema";

interface SegmentWithTotal extends Segment {
  totalCustomers?: number;
}

export default function Segments() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedSegment, setSelectedSegment] = useState<SegmentWithTotal | null>(null);
  const [filterField, setFilterField] = useState<string>("");
  const [filterValue, setFilterValue] = useState<string>("");

  const { data: segments = [], isLoading } = useQuery<SegmentWithTotal[]>({
    queryKey: ["/api/segments"],
  });

  const regenerateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/segments/regenerate");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/segments"] });
      toast({ title: "Segmentler yeniden oluşturuldu" });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Oturum sonlandı", variant: "destructive" });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({ title: "Hata", description: "Segmentler oluşturulamadı", variant: "destructive" });
    },
  });

  const handleViewCustomers = (segment: SegmentWithTotal) => {
    setLocation(`/customers?segment=${segment.id}`);
  };

  const filteredSegments = segments.filter((segment) => {
    if (!filterField || !filterValue) return true;
    const criteria = segment.filterCriteria as Record<string, any> || {};
    return criteria[filterField]?.toLowerCase().includes(filterValue.toLowerCase());
  });

  const totalCustomers = segments[0]?.totalCustomers || 0;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Segmentler</h1>
          <p className="text-muted-foreground">AI destekli müşteri segmentasyonu</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/segments"] })}
            data-testid="button-refresh-segments"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Segmentleri Yenile
          </Button>
          <Button
            onClick={() => regenerateMutation.mutate()}
            disabled={regenerateMutation.isPending}
            data-testid="button-regenerate-segments"
          >
            {regenerateMutation.isPending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Yeniden Segmente Et
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Toplam Segment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{segments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Ortalama Segment Boyutu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {segments.length > 0
                ? Math.round(segments.reduce((acc, s) => acc + (s.customerCount || 0), 0) / segments.length)
                : 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              AI Insight Sayısı
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {segments.filter((s) => s.aiInsight).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtrele
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Alan</Label>
              <Select value={filterField} onValueChange={setFilterField}>
                <SelectTrigger>
                  <SelectValue placeholder="Alan seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="anaBrans">Ana Branş</SelectItem>
                  <SelectItem value="sehir">Şehir</SelectItem>
                  <SelectItem value="meslekGrubu">Meslek Grubu</SelectItem>
                  <SelectItem value="aracMarkasi">Araç Marka</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Değer</Label>
              <Input
                placeholder="Filtre değeri..."
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
              />
            </div>
            <div className="space-y-2 flex items-end">
              <Button
                variant="outline"
                onClick={() => { setFilterField(""); setFilterValue(""); }}
              >
                Temizle
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {segments.length === 0 ? (
        <Card className="p-12 text-center">
          <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Henüz segment yok</h3>
          <p className="text-muted-foreground mb-4">
            Müşteri verilerinizi yükledikten sonra AI ile segmentasyon yapabilirsiniz.
          </p>
          <Button onClick={() => regenerateMutation.mutate()} disabled={regenerateMutation.isPending}>
            <Sparkles className="h-4 w-4 mr-2" />
            Segmentleri Oluştur
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-medium">Tüm Segmentler ({filteredSegments.length})</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {filteredSegments.map((segment) => (
                <Card
                  key={segment.id}
                  className={`cursor-pointer transition-colors ${
                    selectedSegment?.id === segment.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedSegment(segment)}
                  data-testid={`card-segment-${segment.id}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{segment.name}</CardTitle>
                      {segment.isAutoGenerated && (
                        <Badge variant="secondary" className="text-xs">AI</Badge>
                      )}
                    </div>
                    <CardDescription className="line-clamp-2">{segment.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Müşteri Sayısı</span>
                        <span className="font-medium">{segment.customerCount || 0}</span>
                      </div>
                      {totalCustomers > 0 && (
                        <Progress
                          value={((segment.customerCount || 0) / totalCustomers) * 100}
                          className="h-1.5"
                        />
                      )}
                    </div>
                    {segment.aiInsight && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{segment.aiInsight}</p>
                    )}
                  </CardContent>
                  <CardFooter className="pt-0 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewCustomers(segment);
                      }}
                      data-testid={`button-view-customers-${segment.id}`}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Müşterileri Göster
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-medium">Segment Detayı</h2>
            {selectedSegment ? (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{selectedSegment.name}</CardTitle>
                    <CardDescription>{selectedSegment.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Müşteri Sayısı</span>
                        <span className="font-medium">{selectedSegment.customerCount || 0}</span>
                      </div>
                      {totalCustomers > 0 && (
                        <Progress
                          value={((selectedSegment.customerCount || 0) / totalCustomers) * 100}
                          className="h-2"
                        />
                      )}
                    </div>

                    {selectedSegment.filterCriteria && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Filtre Kriterleri</p>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(selectedSegment.filterCriteria as Record<string, any>).map(
                            ([key, value]) => (
                              <Badge key={key} variant="outline" className="text-xs">
                                {key}: {String(value)}
                              </Badge>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {selectedSegment.behaviors && Array.isArray(selectedSegment.behaviors) && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Davranışlar</p>
                        {(selectedSegment.behaviors as any[]).map((behavior: any, index: number) => (
                          <div key={index} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>{behavior.label}</span>
                              <span className="font-medium">{behavior.percentage}%</span>
                            </div>
                            <Progress value={behavior.percentage} className="h-1.5" />
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      onClick={() => handleViewCustomers(selectedSegment)}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Müşteri Listesine Git
                    </Button>
                  </CardFooter>
                </Card>

                {selectedSegment.aiInsight && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        AI Öngörüsü
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{selectedSegment.aiInsight}</p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/campaigns">Kampanya Oluştur</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Detay için bir segment seçin</p>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
