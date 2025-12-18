import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Users } from "lucide-react";

export interface InsuranceProduct {
  id: string;
  name: string;
  category: string;
  description: string;
  targetAudience?: string;
  customerCount?: number;
}

interface ProductCardProps {
  product: InsuranceProduct;
  onEdit?: (product: InsuranceProduct) => void;
  onDelete?: (product: InsuranceProduct) => void;
}

export function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  return (
    <Card data-testid={`card-product-${product.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-base">{product.name}</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {product.category}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <CardDescription className="line-clamp-3">{product.description}</CardDescription>
        {product.targetAudience && (
          <p className="text-xs text-muted-foreground mt-2">
            Hedef: {product.targetAudience}
          </p>
        )}
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-2 pt-0">
        {product.customerCount !== undefined && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            <span>{product.customerCount} müşteri</span>
          </div>
        )}
        <div className="flex items-center gap-1 ml-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit?.(product)}
            data-testid={`button-edit-product-${product.id}`}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete?.(product)}
            data-testid={`button-delete-product-${product.id}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
