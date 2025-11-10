import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useDashboardCollapse } from "@/hooks/useDashboardCollapse";
import { dashboardAnalytics } from "@/utils/analytics";

interface AllocationData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

interface AllocationChartProps {
  assetTypeData: AllocationData[];
  geographyData: AllocationData[];
  riskBucketData: AllocationData[];
  sponsorData: AllocationData[];
  mode?: 'simple' | 'pro';
}

const COLORS = [
  'hsl(var(--primary))',           // Cyan for Residential
  'hsl(var(--secondary))',         // Purple for Commercial  
  'hsl(40 100% 50%)',             // Orange for Development (distinct from purple)
  'hsl(120 100% 40%)',            // Green
  'hsl(220 100% 60%)',            // Blue
  'hsl(300 100% 60%)',            // Magenta
  'hsl(60 100% 50%)',             // Yellow
  'hsl(0 100% 60%)'               // Red
];

export function AllocationChart({ 
  assetTypeData, 
  geographyData, 
  riskBucketData, 
  sponsorData,
  mode = 'pro'
}: AllocationChartProps) {
  const [selectedView, setSelectedView] = useLocalStorage<"asset" | "geography" | "risk" | "sponsor">("allocation-selected-view", "asset");
  const [selectedSlice, setSelectedSlice] = useState<string | null>(null);
  const { isCollapsed, toggleCollapse } = useDashboardCollapse(mode);

  const getCurrentData = () => {
    if (mode === 'simple') return assetTypeData; // Always show asset type in simple mode
    switch (selectedView) {
      case "asset": return assetTypeData;
      case "geography": return geographyData;
      case "risk": return riskBucketData;
      case "sponsor": return sponsorData;
      default: return assetTypeData;
    }
  };

  const getCurrentTitle = () => {
    if (mode === 'simple') return "Asset Type";
    switch (selectedView) {
      case "asset": return "Asset Type";
      case "geography": return "Geography";
      case "risk": return "Risk Bucket";
      case "sponsor": return "Sponsor";
      default: return "Asset Type";
    }
  };

  const currentData = getCurrentData();
  const isEmpty = !currentData || currentData.length === 0;
  const hasLimitedData = currentData.length < 2;
  const topThree = currentData.slice(0, 3);
  const totalValue = currentData.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background/95 border border-glass-border rounded-lg p-3 shadow-lg z-[9999]">
          <p className="text-sm font-medium">{data.name}</p>
          <p className="text-sm text-primary">
            {data.percentage.toFixed(1)}% | ${data.value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  const handleLegendClick = (itemName: string) => {
    setSelectedSlice(selectedSlice === itemName ? null : itemName);
  };

  return (
    <Card className="glass-card border-glass-border overflow-visible">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleCollapse('allocation', (moduleKey, isCollapsed, mode) => {
                if (isCollapsed) {
                  dashboardAnalytics.moduleCollapsed(moduleKey, mode);
                } else {
                  dashboardAnalytics.moduleExpanded(moduleKey, mode);
                }
              })}
              className={`p-1 hover:bg-muted rounded-sm transition-colors focus:ring-2 focus:ring-primary focus:ring-offset-1 ${mode === 'simple' ? 'h-7 w-7' : 'h-6 w-6'}`}
              aria-label={`${isCollapsed('allocation') ? 'Expand' : 'Collapse'} allocation section`}
              aria-expanded={!isCollapsed('allocation')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleCollapse('allocation', (moduleKey, isCollapsed, mode) => {
                    if (isCollapsed) {
                      dashboardAnalytics.moduleCollapsed(moduleKey, mode);
                    } else {
                      dashboardAnalytics.moduleExpanded(moduleKey, mode);
                    }
                  });
                }
              }}
            >
              {isCollapsed('allocation') ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </button>
            <CardTitle className={mode === 'simple' ? 'text-lg font-semibold' : 'text-base'}>{mode === 'simple' ? 'Allocation Snapshot' : 'Allocation & Diversification'}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                dashboardAnalytics.viewDetailsClicked('allocation', mode, '/investments?tab=allocation');
                window.location.href = '/investments?tab=allocation';
              }}
              className={mode === 'simple' ? 'text-sm h-8 px-3' : 'text-xs h-7 px-2'}
            >
              <ExternalLink className={`mr-1 ${mode === 'simple' ? 'h-4 w-4' : 'h-3 w-3'}`} />
              View Details
            </Button>
          {mode === 'pro' && (
            <div className="flex bg-muted/20 rounded-lg p-1">
              {[
                { key: "asset", label: "Asset Type" },
                { key: "geography", label: "Geography" },
                { key: "risk", label: "Risk Bucket" },
                { key: "sponsor", label: "Sponsor" }
              ].map((tab) => (
                <Button
                  key={tab.key}
                  variant={selectedView === tab.key ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setSelectedView(tab.key as any);
                    dashboardAnalytics.allocationTabChanged(tab.key);
                  }}
                  className={selectedView === tab.key ? "bg-primary text-primary-foreground" : ""}
                >
                  {tab.label}
                </Button>
              ))}
            </div>
          )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className={`overflow-visible transition-all duration-200 ${
        isCollapsed('allocation') ? 'h-0 overflow-hidden opacity-0 p-0' : 
        `animate-fade-in ${mode === 'simple' ? 'p-6 space-y-4' : 'p-4 space-y-3'}`
      }`}>
        {isEmpty ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-muted-foreground mb-2">No allocations yet</div>
              <div className="text-sm text-muted-foreground">Start investing to see your portfolio allocation</div>
            </div>
          </div>
        ) : hasLimitedData && mode === 'simple' ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-muted-foreground mb-2">We'll show diversification once you have multiple holdings</div>
            </div>
          </div>
        ) : (
          <div className={mode === 'simple' ? 'grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-start' : 'space-y-6'}>
            {/* Pie Chart */}
            <div className={mode === 'simple' ? 'w-full lg:pr-2' : ''}>
              <div className={mode === 'simple' ? 'w-full aspect-square max-w-sm sm:max-w-md lg:max-w-full mx-auto lg:mx-0' : 'w-full aspect-square max-w-lg mx-auto'}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 16, right: 16, bottom: 16, left: 16 }}>
                    <Pie
                      data={currentData}
                      cx="50%"
                      cy="50%"
                      innerRadius="65%"
                      outerRadius="80%"
                      paddingAngle={2}
                      dataKey="value"
                      startAngle={90}
                      endAngle={450}
                      onClick={(entry) => handleLegendClick(entry.name)}
                    >
                      {currentData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]}
                          opacity={selectedSlice === null || selectedSlice === entry.name ? 1 : 0.3}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground">
                      <tspan x="50%" dy="-0.5em" className="text-xs font-medium fill-muted-foreground tracking-wide">Total Value</tspan>
                      <tspan x="50%" dy="1.2em" className="text-xl font-semibold fill-foreground">${totalValue.toLocaleString()}</tspan>
                    </text>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Legend/Top 3 Exposures */}
            <div className={mode === 'simple' ? 'min-w-0 space-y-3 lg:pl-2' : 'space-y-3'}>
              <h4 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {mode === 'simple' ? getCurrentTitle() : `Top 3 Exposures by ${getCurrentTitle()}`}
              </h4>
              <div className="space-y-2">
                {(mode === 'simple' ? currentData : topThree).map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleLegendClick(item.name)}
                    className={`w-full flex items-center justify-between gap-3 p-3 rounded-lg transition-all duration-200 hover:bg-muted/30 ${
                      selectedSlice === item.name ? 'bg-muted/20 ring-1 ring-primary/20' : 'bg-muted/10'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm font-medium text-left truncate">{item.name}</span>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-sm font-semibold tabular-nums">
                        ${item.value.toLocaleString()}
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {item.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}