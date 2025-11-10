import { memo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, ReferenceLine, Cell } from "recharts";
import { formatCurrency } from "@/utils/developerHelpers";

interface TicketDistributionData {
  range: string;
  count: number;
  percentage: number;
}

interface TicketDistributionChartProps {
  data: TicketDistributionData[];
  median: number;
  loading?: boolean;
}

export const TicketDistributionChart = memo(function TicketDistributionChart({
  data,
  median,
  loading = false,
}: TicketDistributionChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = data.find(d => d.range === label);
      return (
        <div className="rounded-lg border border-border bg-background p-3 shadow-md">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-sm text-primary">
            Count: {payload[0].value}
          </p>
          <p className="text-sm text-muted-foreground">
            {dataPoint?.percentage.toFixed(1)}% of investments
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Investment Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full animate-pulse bg-muted/20 rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:bg-card transition-none">
      <CardHeader>
        <CardTitle className="text-base">Investment Distribution</CardTitle>
        <p className="text-sm text-muted-foreground">
          Median: {formatCurrency(median)}
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={data}
              onMouseMove={(state) => {
                if (state?.activeTooltipIndex !== undefined) {
                  setActiveIndex(state.activeTooltipIndex);
                }
              }}
              onMouseLeave={() => setActiveIndex(null)}
              barCategoryGap="20%"
            >
              <defs>
                <filter id="barGlowVertical" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <XAxis 
                dataKey="range"
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <Tooltip content={<CustomTooltip />} cursor={false} />
              <Bar
                dataKey="count"
                radius={[4, 4, 0, 0]}
                activeBar={false}
                isAnimationActive={false}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`}
                    fill="hsl(var(--primary))"
                    stroke={activeIndex === index ? "hsl(var(--primary))" : "none"}
                    strokeWidth={activeIndex === index ? 2 : 0}
                    filter={activeIndex === index ? "url(#barGlowVertical)" : "none"}
                    style={{
                      transform: activeIndex === index ? "scale(1.01)" : "scale(1)",
                      transformOrigin: "center",
                      transition: "all 150ms ease-out"
                    }}
                    role="graphics-symbol"
                    tabIndex={0}
                    onFocus={() => setActiveIndex(index)}
                    onBlur={() => setActiveIndex(null)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
});