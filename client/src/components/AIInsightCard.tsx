import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";

interface AIInsightCardProps {
  title: string;
  insight: string;
  confidence?: number;
  category?: string;
  isLoading?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
}

export function AIInsightCard({
  title,
  insight,
  confidence,
  category,
  isLoading,
  onAccept,
  onReject,
}: AIInsightCardProps) {
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            </div>
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            {category && (
              <Badge variant="secondary" className="text-xs">
                {category}
              </Badge>
            )}
            {confidence !== undefined && (
              <Badge variant="outline" className="text-xs">
                %{confidence} güven
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center gap-2 py-4">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">AI analiz ediliyor...</span>
          </div>
        ) : (
          <>
            <p className="text-sm leading-relaxed">{insight}</p>
            {(onAccept || onReject) && (
              <div className="flex items-center gap-2 pt-2">
                {onAccept && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onAccept}
                    className="flex-1"
                    data-testid="button-accept-insight"
                  >
                    <ThumbsUp className="h-3 w-3 mr-1" />
                    Uygula
                  </Button>
                )}
                {onReject && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onReject}
                    data-testid="button-reject-insight"
                  >
                    <ThumbsDown className="h-3 w-3 mr-1" />
                    Reddet
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
