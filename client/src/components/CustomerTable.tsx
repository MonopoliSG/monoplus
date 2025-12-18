import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, MoreVertical, Eye, Sparkles, Phone } from "lucide-react";

export interface Customer {
  id: string;
  musteriIsmi: string;
  meslekGrubu: string;
  tcKimlik: string;
  sehir: string;
  ilce: string;
  gsmNo: string;
  anaBrans: string;
  araBrans: string;
  kvkk: string;
  policeNo?: string;
}

interface CustomerTableProps {
  customers: Customer[];
  onViewCustomer?: (customer: Customer) => void;
  onAnalyzeCustomer?: (customer: Customer) => void;
}

export function CustomerTable({ customers, onViewCustomer, onAnalyzeCustomer }: CustomerTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCustomers = customers.filter((customer) =>
    customer.musteriIsmi.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.tcKimlik.includes(searchTerm) ||
    customer.sehir.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Müşteri ara (isim, TC, şehir)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="input-search-customers"
          />
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Müşteri</TableHead>
              <TableHead>Meslek</TableHead>
              <TableHead>Şehir</TableHead>
              <TableHead>Ana Branş</TableHead>
              <TableHead>KVKK</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Müşteri bulunamadı
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((customer) => (
                <TableRow key={customer.id} data-testid={`row-customer-${customer.id}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(customer.musteriIsmi)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{customer.musteriIsmi}</div>
                        <div className="text-xs text-muted-foreground">{customer.gsmNo}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{customer.meslekGrubu || "-"}</span>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{customer.sehir}</div>
                      <div className="text-xs text-muted-foreground">{customer.ilce}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {customer.anaBrans || "-"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={customer.kvkk === "Evet" ? "default" : "outline"}
                      className="text-xs"
                    >
                      {customer.kvkk || "Belirsiz"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" data-testid={`button-actions-${customer.id}`}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => onViewCustomer?.(customer)}
                          data-testid={`menu-view-${customer.id}`}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Profili Görüntüle
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onAnalyzeCustomer?.(customer)}
                          data-testid={`menu-analyze-${customer.id}`}
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          AI Analiz
                        </DropdownMenuItem>
                        <DropdownMenuItem data-testid={`menu-call-${customer.id}`}>
                          <Phone className="h-4 w-4 mr-2" />
                          Ara
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="text-sm text-muted-foreground">
        Toplam {filteredCustomers.length} müşteri
      </div>
    </div>
  );
}
