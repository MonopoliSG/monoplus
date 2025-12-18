import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Users, ChevronRight } from "lucide-react";

export interface Segment {
  id: string;
  name: string;
  description: string;
  customerCount: number;
  totalCustomers: number;
  behaviors?: { label: string; percentage: number }[];
  aiInsight?: string;
}

interface SegmentCardProps {
  segment: Segment;
  onAnalyze?: (segment: Segment) => void;
  onViewCustomers?: (segment: Segment) => void;
}

export function SegmentCard({ segment, onAnalyze, onViewCustomers }: SegmentCardProps) {
  const percentage = Math.round((segment.customerCount / segment.totalCustomers) * 100);

  return (
    <Card data-testid={`card-segment-${segment.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-base">{segment.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{segment.description}</p>
          </div>
          <Badge variant="outline" className="shrink-0">
            <Users className="h-3 w-3 mr-1" />
            {segment.customerCount}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Portföy Oranı</span>
            <span className="font-medium">{percentage}%</span>
          </div>
          <Progress value={percentage} className="h-2" />
        </div>

        {segment.behaviors && segment.behaviors.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Davranış Özellikleri</p>
            {segment.behaviors.map((behavior, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span>{behavior.label}</span>
                <Badge variant="secondary" className="text-xs">
                  {behavior.percentage}%
                </Badge>
              </div>
            ))}
          </div>
        )}

        {segment.aiInsight && (
          <div className="p-3 rounded-md bg-primary/5 border border-primary/20">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs">{segment.aiInsight}</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onAnalyze?.(segment)}
            data-testid={`button-analyze-segment-${segment.id}`}
          >
            <Sparkles className="h-3 w-3 mr-1" />
            AI Analiz
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewCustomers?.(segment)}
            data-testid={`button-view-segment-${segment.id}`}
          >
            Müşteriler
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
