import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from "recharts";
import { formatCurrency } from "@/utils/developerHelpers";

interface FundingVelocityData {
  date: string;
  velocity: number;
  isWeekend: boolean;
}

interface FundingVelocityChartProps {
  data: FundingVelocityData[];
  loading?: boolean;
}

export const FundingVelocityChart = memo(function FundingVelocityChart({
  data,
  loading = false,
}: FundingVelocityChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = data.find(d => d.date === label);
      return (
        <div className="rounded-lg border border-border bg-background p-3 shadow-md">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-sm font-medium text-primary">
            7-day Rolling: {formatCurrency(payload[0].value)}
          </p>
          {dataPoint?.isWeekend && (
            <p className="text-xs text-muted-foreground">Weekend</p>
          )}
        </div>
      );
    }
    return null;
  };

  const weekendData = data.filter(d => d.isWeekend);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Funding Velocity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full animate-pulse bg-muted/20 rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Funding Velocity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Weekend shading */}
              {weekendData.map((weekend, index) => (
                <ReferenceLine
                  key={index}
                  x={weekend.date}
                  stroke="hsl(var(--muted-foreground) / 0.1)"
                  strokeWidth={20}
                />
              ))}
              
              <Line
                type="monotone"
                dataKey="velocity"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                name="7-day Rolling Sum"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
});