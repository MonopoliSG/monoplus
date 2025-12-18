import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Phone,
  MapPin,
  Briefcase,
  Shield,
  FileText,
  Sparkles,
  X,
} from "lucide-react";
import type { Customer } from "./CustomerTable";

interface CustomerProfileProps {
  customer: Customer;
  onClose?: () => void;
  aiRecommendations?: string[];
}

export function CustomerProfile({ customer, onClose, aiRecommendations }: CustomerProfileProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-xl">{getInitials(customer.unvan)}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-semibold" data-testid="text-customer-name">{customer.unvan}</h2>
            <p className="text-muted-foreground">{customer.meslekGrubu || "Meslek belirtilmemiş"}</p>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-profile">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Kişisel Bilgiler
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">TC Kimlik</span>
              <span className="text-sm font-medium" data-testid="text-tc-kimlik">{customer.tcKimlik}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center gap-2">
              <span className="text-sm text-muted-foreground">Telefon</span>
              <div className="flex items-center gap-2">
                <Phone className="h-3 w-3 text-muted-foreground" />
                <span className="text-sm font-medium">{customer.gsmNo}</span>
              </div>
            </div>
            <Separator />
            <div className="flex justify-between items-center gap-2">
              <span className="text-sm text-muted-foreground">Konum</span>
              <div className="flex items-center gap-2">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                <span className="text-sm font-medium">{customer.sehir}, {customer.ilce}</span>
              </div>
            </div>
            <Separator />
            <div className="flex justify-between items-center gap-2">
              <span className="text-sm text-muted-foreground">Meslek</span>
              <div className="flex items-center gap-2">
                <Briefcase className="h-3 w-3 text-muted-foreground" />
                <span className="text-sm font-medium">{customer.meslekGrubu || "-"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Sigorta Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center gap-2">
              <span className="text-sm text-muted-foreground">Ana Branş</span>
              <Badge variant="secondary">{customer.anaBrans || "-"}</Badge>
            </div>
            <Separator />
            <div className="flex justify-between items-center gap-2">
              <span className="text-sm text-muted-foreground">Ara Branş</span>
              <Badge variant="outline">{customer.araBrans || "-"}</Badge>
            </div>
            <Separator />
            <div className="flex justify-between items-center gap-2">
              <span className="text-sm text-muted-foreground">Poliçe No</span>
              <div className="flex items-center gap-2">
                <FileText className="h-3 w-3 text-muted-foreground" />
                <span className="text-sm font-medium">{customer.policeNo || "-"}</span>
              </div>
            </div>
            <Separator />
            <div className="flex justify-between items-center gap-2">
              <span className="text-sm text-muted-foreground">KVKK Onayı</span>
              <Badge variant={customer.kvkk === "Evet" ? "default" : "destructive"}>
                {customer.kvkk || "Belirsiz"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {aiRecommendations && aiRecommendations.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              AI Çapraz Satış Tavsiyeleri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {aiRecommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-primary">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
