import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PortfolioMetricCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  subtitle?: string;
}

export function PortfolioMetricCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  subtitle,
}: PortfolioMetricCardProps) {
  const getChangeColor = () => {
    switch (changeType) {
      case "positive":
        return "text-green-400";
      case "negative":
        return "text-red-400";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="card-wrapper" style={{ zIndex: 1 }}>
      <Card className="glass-card border-glass-border transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <Icon className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold gradient-text">{value}</div>
          {change && (
            <p className={`text-xs ${getChangeColor()}`}>
              {change}
            </p>
          )}
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}