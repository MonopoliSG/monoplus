import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
}

export function StatsCard({ title, value, change, changeLabel, icon }: StatsCardProps) {
  const getTrendIcon = () => {
    if (change === undefined) return null;
    if (change > 0) return <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />;
    if (change < 0) return <TrendingDown className="h-3 w-3 text-red-600 dark:text-red-400" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

  const getTrendColor = () => {
    if (change === undefined) return "";
    if (change > 0) return "text-green-600 dark:text-green-400";
    if (change < 0) return "text-red-600 dark:text-red-400";
    return "text-muted-foreground";
  };

  return (
    <Card data-testid={`card-stat-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" data-testid={`text-stat-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>
          {value}
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-xs mt-1 ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>{change > 0 ? "+" : ""}{change}%</span>
            {changeLabel && <span className="text-muted-foreground ml-1">{changeLabel}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
