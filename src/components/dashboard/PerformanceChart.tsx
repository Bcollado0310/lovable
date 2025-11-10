import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/layout/ChartContainer";
import { Button } from "@/components/ui/button";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart } from "recharts";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useDashboardCollapse } from "@/hooks/useDashboardCollapse";
import { dashboardAnalytics } from "@/utils/analytics";
import { usePerformanceSeries } from "@/hooks/usePerformanceSeries";
import type { DateRange } from "@/components/ui/range-selector";

interface PerformanceChartProps {
  mode?: 'simple' | 'pro';
  range: DateRange;
}

export function PerformanceChart({ mode = 'pro', range }: PerformanceChartProps) {
  // Auto-scaling performance chart with adaptive axes
  const [selectedSeries, setSelectedSeries] = useLocalStorage<"value" | "return">("performance-selected-series", "value");
  const [showContributions, setShowContributions] = useState(false);
  const { isCollapsed, toggleCollapse } = useDashboardCollapse(mode);

  // Use the new hook that includes range in cache/memo keys
  const { data: filteredData } = usePerformanceSeries(range);
  const hasEnoughData = filteredData.length >= 1; // Changed from >= 2 to >= 1 to show single points

  // Smart currency formatting for different scales
  const shortCurrency = (n: number): string => {
    const abs = Math.abs(n);
    if (abs < 1) return `$${n.toFixed(2)}`;
    if (abs < 1_000) return `$${Math.round(n)}`;
    if (abs < 1_000_000) return `$${(n / 1_000).toFixed(0)}k`;
    if (abs < 1_000_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    return `$${(n / 1_000_000_000).toFixed(1)}B`;
  };

  const fullCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Helper functions for axis scaling
  const niceStep = (roughStep: number): number => {
    const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
    const normalizedStep = roughStep / magnitude;
    
    if (normalizedStep <= 1) return magnitude;
    if (normalizedStep <= 2) return 2 * magnitude;
    if (normalizedStep <= 5) return 5 * magnitude;
    return 10 * magnitude;
  };

  const floorTo = (value: number, step: number): number => {
    return Math.floor(value / step) * step;
  };

  const ceilTo = (value: number, step: number): number => {
    return Math.ceil(value / step) * step;
  };

  // Compute Y-axis domain and ticks
  const getYAxisConfig = () => {
    if (!filteredData || filteredData.length === 0) {
      return { domain: [0, 100], ticks: [0, 25, 50, 75, 100] };
    }

    const values = filteredData.map(d => d.portfolio_value).filter(v => isFinite(v));
    const contributions = showContributions ? filteredData.map(d => d.net_contribution).filter(v => isFinite(v)) : [];
    
    if (values.length === 0) {
      return { domain: [0, 100], ticks: [0, 25, 50, 75, 100] };
    }

    const allValues = [...values, ...contributions];
    const vMin = Math.min(...allValues);
    const vMax = Math.max(...allValues);
    
    // Handle zero-variance case
    if (vMax === vMin) {
      const value = vMax === 0 ? 100 : vMax;
      const padding = Math.abs(value) * 0.05;
      return {
        domain: [value - padding, value + padding],
        ticks: [value - padding, value, value + padding]
      };
    }

    const range = Math.max(1, vMax - vMin);
    const step = niceStep(range / 5);
    const padding = Math.max(step, range * 0.08);
    
    const yMin = vMin < 0 ? floorTo(vMin - padding, step) : 0;
    const yMax = ceilTo(vMax + padding, step);
    
    // Generate ticks
    const ticks = [];
    for (let tick = yMin; tick <= yMax; tick += step) {
      ticks.push(tick);
    }
    
    return { domain: [yMin, yMax], ticks };
  };

  // Compute X-axis configuration
  const getXAxisConfig = () => {
    if (!filteredData || filteredData.length < 2) {
      return { interval: 'preserveStartEnd' as const, tickFormatter: (dateStr: string) => dateStr };
    }

    const firstDate = new Date(filteredData[0].date);
    const lastDate = new Date(filteredData[filteredData.length - 1].date);
    const spanDays = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);

    let tickFormatter: (dateStr: string) => string;
    let interval: number | 'preserveStartEnd';

    if (spanDays <= 45) {
      // Weekly ticks for short spans
      interval = Math.max(1, Math.floor(filteredData.length / 6));
      tickFormatter = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      };
    } else if (spanDays <= 180) {
      // Monthly ticks
      interval = Math.max(1, Math.floor(filteredData.length / 6));
      tickFormatter = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short' });
      };
    } else if (spanDays <= 720) {
      // Quarterly ticks
      interval = Math.max(1, Math.floor(filteredData.length / 4));
      tickFormatter = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short' });
      };
    } else {
      // Yearly ticks
      interval = Math.max(1, Math.floor(filteredData.length / 3));
      tickFormatter = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short' });
      };
    }

    return { interval, tickFormatter };
  };

  const formatTooltipDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const yAxisConfig = getYAxisConfig();
  const xAxisConfig = getXAxisConfig();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 border border-glass-border rounded-lg p-3 shadow-lg z-[9999]">
          <p className="text-sm font-medium mb-2">{formatTooltipDate(label)}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name.includes('%') ? `${entry.value.toFixed(2)}%` : fullCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="glass-card border-glass-border overflow-visible">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleCollapse('performance', (moduleKey, isCollapsed, mode) => {
                if (isCollapsed) {
                  dashboardAnalytics.moduleCollapsed(moduleKey, mode);
                } else {
                  dashboardAnalytics.moduleExpanded(moduleKey, mode);
                }
              })}
              className={`p-1 hover:bg-muted rounded-sm transition-colors focus:ring-2 focus:ring-primary focus:ring-offset-1 ${mode === 'simple' ? 'h-7 w-7' : 'h-6 w-6'}`}
              aria-label={`${isCollapsed('performance') ? 'Expand' : 'Collapse'} performance section`}
              aria-expanded={!isCollapsed('performance')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleCollapse('performance', (moduleKey, isCollapsed, mode) => {
                    if (isCollapsed) {
                      dashboardAnalytics.moduleCollapsed(moduleKey, mode);
                    } else {
                      dashboardAnalytics.moduleExpanded(moduleKey, mode);
                    }
                  });
                }
              }}
            >
              {isCollapsed('performance') ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </button>
            <CardTitle className={mode === 'simple' ? 'text-lg font-semibold' : 'text-base'}>Performance Over Time</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                dashboardAnalytics.viewDetailsClicked('performance', mode, '/investments?tab=performance');
                window.location.href = '/investments?tab=performance';
              }}
              className={mode === 'simple' ? 'text-sm h-8 px-3' : 'text-xs h-7 px-2'}
            >
              <ExternalLink className={`mr-1 ${mode === 'simple' ? 'h-4 w-4' : 'h-3 w-3'}`} />
              View Details
            </Button>
            <div className="flex flex-wrap gap-2 shrink-0 max-w-full">
            {/* Series Toggle - Hide in simple mode */}
            {mode === 'pro' && (
              <div className="flex bg-muted/20 rounded-lg p-1 shrink-0">
                <Button
                  variant={selectedSeries === "value" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setSelectedSeries("value");
                    dashboardAnalytics.chartSeriesToggled("value");
                  }}
                  className={selectedSeries === "value" ? "bg-primary text-primary-foreground" : ""}
                >
                  Portfolio Value
                </Button>
                <Button
                  variant={selectedSeries === "return" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setSelectedSeries("return");
                    dashboardAnalytics.chartSeriesToggled("return");
                  }}
                  className={selectedSeries === "return" ? "bg-primary text-primary-foreground" : ""}
                >
                  Net Return %
                </Button>
              </div>
            )}
            </div>
          </div>
        </div>
        
        {/* Contributions Toggle */}
        <div className="flex items-center gap-2 mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShowContributions(!showContributions);
              dashboardAnalytics.contributionsToggled(!showContributions);
            }}
            className={showContributions ? "bg-primary/20" : ""}
            >
            {showContributions ? "Hide" : "Show"} Net Contributions
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className={`overflow-visible transition-all duration-200 ${
        isCollapsed('performance') ? 'h-0 overflow-hidden opacity-0 p-0' : 
        `animate-fade-in ${mode === 'simple' ? 'p-6 space-y-4' : 'p-4 space-y-3'}`
      }`}>
        {(!hasEnoughData) ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-muted-foreground mb-2">No performance yet</div>
              <div className="text-sm text-muted-foreground">Fund your first investment to start tracking</div>
            </div>
          </div>
        ) : (
          <ChartContainer 
            height={mode === 'simple' ? '332px' : '16rem'}
            className="w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              {mode === 'simple' ? (
                <AreaChart 
                  data={filteredData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  role="img"
                  aria-label={`Portfolio performance chart showing ${filteredData.length} data points over time`}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={xAxisConfig.tickFormatter}
                    interval={xAxisConfig.interval}
                  />
                  <YAxis 
                    tickFormatter={shortCurrency}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    domain={yAxisConfig.domain}
                    ticks={yAxisConfig.ticks}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  
                  <defs>
                    <linearGradient id="colorPortfolio" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="portfolio_value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#colorPortfolio)"
                    name="Portfolio Value"
                    dot={false}
                    activeDot={{ r: 4, stroke: 'hsl(var(--primary))', strokeWidth: 2, fill: 'hsl(var(--background))' }}
                  />
                  
                  {/* Optional contributions overlay */}
                  {showContributions && (
                    <Area
                      type="monotone"
                      dataKey="net_contribution"
                      stroke="hsl(var(--muted-foreground))"
                      fill="hsl(var(--muted-foreground))"
                      fillOpacity={0.1}
                      name="Net Contributions"
                    />
                  )}
                </AreaChart>
              ) : (
                <ComposedChart 
                  data={filteredData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  role="img"
                  aria-label={`Portfolio performance chart showing ${filteredData.length} data points over time`}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickFormatter={xAxisConfig.tickFormatter}
                    interval={xAxisConfig.interval}
                  />
                  <YAxis 
                    tickFormatter={selectedSeries === "value" ? shortCurrency : (value: number) => `${value.toFixed(2)}%`}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    domain={yAxisConfig.domain}
                    ticks={yAxisConfig.ticks}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  
                  <defs>
                    <linearGradient id="colorPortfolio" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  
                  <Area
                    type="monotone"
                    dataKey={selectedSeries === "value" ? "portfolio_value" : "net_return_pct"}
                    stroke="transparent"
                    fill="url(#colorPortfolio)"
                    name={selectedSeries === "value" ? "Portfolio Value" : "Net Return %"}
                    dot={false}
                  />
                  
                  <Line
                    type="monotone"
                    dataKey={selectedSeries === "value" ? "portfolio_value" : "net_return_pct"}
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                    name={selectedSeries === "value" ? "Portfolio Value" : "Net Return %"}
                  />
                  
                  {/* Optional contributions overlay */}
                  {showContributions && (
                    <Area
                      type="monotone"
                      dataKey="net_contribution"
                      stroke="hsl(var(--muted-foreground))"
                      fill="hsl(var(--muted-foreground))"
                      fillOpacity={0.1}
                      name="Net Contributions"
                    />
                  )}
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
