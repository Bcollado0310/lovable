import { memo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts";

interface ConversionFunnelData {
  stage: string;
  count: number;
  rate: number;
}

interface ConversionFunnelChartProps {
  data: ConversionFunnelData[];
  loading?: boolean;
}

export const ConversionFunnelChart = memo(function ConversionFunnelChart({
  data,
  loading = false,
}: ConversionFunnelChartProps) {
  console.log('ConversionFunnelChart received data:', data);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = data.find(d => d.stage === label);
      return (
        <div className="rounded-lg border border-border bg-background p-3 shadow-md">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-sm text-primary">
            Count: {payload[0].value.toLocaleString()}
          </p>
          <p className="text-sm text-muted-foreground">
            Rate: {dataPoint?.rate.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomBarLabel = (props: any) => {
    const { x, y, width, height, payload } = props;
    
    // Safety check for payload
    if (!payload || !payload.stage) {
      return null;
    }
    
    const dataPoint = data.find(d => d.stage === payload.stage);
    
    return (
      <g>
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-background text-xs font-medium"
        >
          {payload.count ? payload.count.toLocaleString() : '0'}
        </text>
        <text
          x={x + width / 2}
          y={y + height / 2 + 12}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-background text-xs"
        >
          {dataPoint?.rate?.toFixed(1) || '0'}%
        </text>
      </g>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full animate-pulse bg-muted/20 rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center">
            <p className="text-sm text-muted-foreground">No conversion data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:bg-card transition-none">
      <CardHeader>
        <CardTitle className="text-base">Conversion Funnel</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={data} 
              layout="vertical" 
              margin={{ left: 8, right: 12, top: 4, bottom: 4 }}
              onMouseMove={(state) => {
                if (state?.activeTooltipIndex !== undefined) {
                  setActiveIndex(state.activeTooltipIndex);
                }
              }}
              onMouseLeave={() => setActiveIndex(null)}
              barCategoryGap="20%"
            >
              <defs>
                <filter id="barGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <XAxis 
                type="number"
                domain={[0, 'auto']}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(v: number) => v.toLocaleString()}
                tickLine={{ stroke: 'hsl(var(--border))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                type="category"
                dataKey="stage"
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                width={90}
              />
              <Tooltip content={<CustomTooltip />} cursor={false} />
              <Bar
                dataKey="count"
                radius={[0, 4, 4, 0]}
                barSize={18}
                activeBar={false}
                isAnimationActive={false}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`}
                    fill="hsl(var(--primary))"
                    stroke={activeIndex === index ? "hsl(var(--primary))" : "none"}
                    strokeWidth={activeIndex === index ? 2 : 0}
                    filter={activeIndex === index ? "url(#barGlow)" : "none"}
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