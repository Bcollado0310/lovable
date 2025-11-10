import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

interface SparklineData {
  value: number;
  date: string;
}

interface EnhancedKPICardProps {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  sparklineData: SparklineData[];
  deltaPercentage?: number;
  deltaLabel?: string;
}

export const EnhancedKPICard = memo(function EnhancedKPICard({
  title,
  value,
  description,
  icon: Icon,
  sparklineData,
  deltaPercentage,
  deltaLabel,
}: EnhancedKPICardProps) {
  const getDeltaColor = () => {
    if (deltaPercentage === undefined) return "text-muted-foreground";
    return deltaPercentage >= 0 ? "text-green-400" : "text-red-400";
  };

  const getDeltaSign = () => {
    if (deltaPercentage === undefined) return "";
    return deltaPercentage >= 0 ? "+" : "";
  };

  return (
    <Card className="transition-all duration-300 hover:shadow-card border-border/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-foreground">{value}</div>
          {deltaPercentage !== undefined && (
            <Badge 
              variant="secondary" 
              className={`text-xs ${getDeltaColor()} bg-muted/20 border-0`}
            >
              {getDeltaSign()}{Math.abs(deltaPercentage).toFixed(1)}%
            </Badge>
          )}
        </div>
        
        {sparklineData.length > 0 && (
          <div className="h-8 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={1.5}
                  dot={false}
                  strokeOpacity={0.8}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
        
        {deltaLabel && (
          <p className="text-xs text-muted-foreground">
            {deltaLabel}
          </p>
        )}
      </CardContent>
    </Card>
  );
});