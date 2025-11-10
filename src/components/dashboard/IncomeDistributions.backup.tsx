import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Calendar, Eye, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { useDashboardCollapse } from "@/hooks/useDashboardCollapse";
import { dashboardAnalytics } from "@/utils/analytics";
import type { DateRange } from "@/components/ui/range-selector";

interface UpcomingPayout {
  id: string;
  date: string;
  investment: string;
  estimated_amount: number;
  status: "scheduled" | "processing" | "paid";
}

interface MonthlyDistribution {
  month: string;
  ordinary_income: number;
  return_of_capital: number;
  total: number;
}

const MONTH_ORDER = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
] as const;

const monthLabelToIndex = (label: string): number => {
  const normalized = label.slice(0, 3).toLowerCase();
  return MONTH_ORDER.findIndex((month) => month.toLowerCase() === normalized);
};

interface IncomeDistributionsProps {
  upcomingPayouts: UpcomingPayout[];
  monthlyDistributions: MonthlyDistribution[];
  totalIncome: number;
  totalROC: number;
  totalDistributions: number;
  mode?: 'simple' | 'pro';
  range?: DateRange;
}

export function IncomeDistributions({
  upcomingPayouts,
  monthlyDistributions,
  totalIncome,
  totalROC,
  totalDistributions,
  mode = 'pro',
  range = 'all'
}: IncomeDistributionsProps) {
  const { isCollapsed, toggleCollapse } = useDashboardCollapse(mode);
  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "processing": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "paid": return "bg-green-500/20 text-green-400 border-green-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`;
  };

  const [activeMonthIndex, setActiveMonthIndex] = useState<number | null>(null);

  useEffect(() => {
    setActiveMonthIndex(null);
  }, [range, monthlyDistributions]);

  const filteredMonthlyDistributions = useMemo(() => {
    if (!monthlyDistributions || monthlyDistributions.length === 0) {
      return [];
    }

    if (range === 'all') {
      return monthlyDistributions;
    }

    if (range === 'ytd') {
      const currentMonthLabel = new Date().toLocaleString('en-US', { month: 'short' });
      const currentIndex = monthLabelToIndex(currentMonthLabel);
      if (currentIndex === -1) {
        return monthlyDistributions;
      }

      return monthlyDistributions.filter((entry) => {
        const entryIndex = monthLabelToIndex(entry.month);
        return entryIndex === -1 ? true : entryIndex <= currentIndex;
      });
    }

    const monthsByRange: Record<Exclude<DateRange, 'ytd' | 'all'>, number> = {
      '1m': 1,
      '3m': 3,
      '6m': 6,
      '1y': 12
    };

    const count = monthsByRange[range as Exclude<DateRange, 'ytd' | 'all'>];
    if (!count) {
      return monthlyDistributions;
    }

    return monthlyDistributions.slice(-count);
  }, [monthlyDistributions, range]);

  const aggregatedTotals = useMemo(() => {
    if (!filteredMonthlyDistributions || filteredMonthlyDistributions.length === 0) {
      return {
        income: totalIncome,
        roc: totalROC,
        total: totalDistributions
      };
    }

    return filteredMonthlyDistributions.reduce(
      (acc, entry) => ({
        income: acc.income + entry.ordinary_income,
        roc: acc.roc + entry.return_of_capital,
        total: acc.total + entry.total
      }),
      { income: 0, roc: 0, total: 0 }
    );
  }, [filteredMonthlyDistributions, totalIncome, totalROC, totalDistributions]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 rounded-lg p-3 shadow-lg z-[9999]">
          <p className="text-sm font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const handleBarHover = (_: unknown, index: number) => {
    setActiveMonthIndex(index);
  };

  const resetBarHover = () => {
    setActiveMonthIndex(null);
  };

  const displayedPayouts = mode === 'simple' ? upcomingPayouts.slice(0, 2) : upcomingPayouts;
  const isSimpleMode = mode === 'simple';
  const isProMode = mode === 'pro';

  if (isProMode) {
    return (
      <div className="space-y-4">
        {/* Upcoming Payouts - Full Table */}
        <Card className="glass-card border-glass-border overflow-visible">
          <CardHeader className={isSimpleMode ? 'py-5' : 'py-3'}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleCollapse('distributions', (moduleKey, isCollapsed, mode) => {
                    if (isCollapsed) {
                      dashboardAnalytics.moduleCollapsed(moduleKey, mode);
                    } else {
                      dashboardAnalytics.moduleExpanded(moduleKey, mode);
                    }
                  })}
                  className={`p-1 hover:bg-muted rounded-sm transition-colors focus:ring-2 focus:ring-primary focus:ring-offset-1 ${isSimpleMode ? 'h-7 w-7' : 'h-6 w-6'}`}
                  aria-label={`${isCollapsed('distributions') ? 'Expand' : 'Collapse'} distributions section`}
                  aria-expanded={!isCollapsed('distributions')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleCollapse('distributions', (moduleKey, isCollapsed, mode) => {
                        if (isCollapsed) {
                          dashboardAnalytics.moduleCollapsed(moduleKey, mode);
                        } else {
                          dashboardAnalytics.moduleExpanded(moduleKey, mode);
                        }
                      });
                    }
                  }}
                >
                  {isCollapsed('distributions') ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                </button>
                <Calendar className={`text-primary ${isSimpleMode ? 'h-5 w-5' : 'h-4 w-4'}`} />
                <CardTitle className={isSimpleMode ? 'text-lg' : 'text-base'}>Upcoming Payouts</CardTitle>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  dashboardAnalytics.viewDetailsClicked('distributions', mode, '/transactions?type=distribution');
                  window.location.href = '/transactions?type=distribution';
                }}
                className={isSimpleMode ? 'text-sm h-8 px-3' : 'text-xs h-7 px-2'}
              >
                <ExternalLink className={`mr-1 ${isSimpleMode ? 'h-4 w-4' : 'h-3 w-3'}`} />
                View Details
              </Button>
            </div>
          </CardHeader>
          <CardContent className={`overflow-visible transition-all duration-200 ${
            isCollapsed('distributions') ? 'h-0 overflow-hidden opacity-0 p-0' : 
            `animate-fade-in ${isSimpleMode ? 'py-6' : 'py-4'}`
          }`}>
            {upcomingPayouts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Investment</TableHead>
                    <TableHead className="text-xs">Est. Amount</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingPayouts.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell className="text-xs">
                        {new Date(payout.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {payout.investment}
                      </TableCell>
                      <TableCell className="text-xs">
                        ${payout.estimated_amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(payout.status)}>
                          {payout.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-6">
                <Calendar className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No scheduled payouts.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Last 12 Months Distributions - Analytics */}
        <Card className="glass-card border-glass-border">
          <CardHeader className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleCollapse('distributions')}
                  className="p-1 hover:bg-muted rounded-sm transition-colors"
                  aria-label="Toggle distributions analytics section"
                >
                  {isCollapsed('distributions') ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                </button>
                <CardTitle className="text-base">Distributions Analytics</CardTitle>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.location.href = '/transactions?type=distribution'}
                className="text-xs"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View Details
              </Button>
            </div>
          </CardHeader>
          <CardContent className={`py-4 transition-all duration-200 ${isCollapsed('distributions') ? 'h-0 overflow-hidden opacity-0 p-0' : 'animate-fade-in'}`}>
            {filteredMonthlyDistributions.length > 0 ? (
              <div className="space-y-4">
                {/* Chart */}
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={filteredMonthlyDistributions} onMouseLeave={resetBarHover}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="month" 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={10}
                      />
                      <YAxis 
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={10}
                      />
                      <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />
                      <Bar
                        dataKey="ordinary_income"
                        stackId="a"
                        fill="hsl(var(--primary))"
                        stroke="transparent"
                        name="Ordinary Income"
                        onMouseOver={handleBarHover}
                      >
                        {filteredMonthlyDistributions.map((_, index) => (
                          <Cell
                            key={`oi-${index}`}
                            fill="hsl(var(--primary))"
                            fillOpacity={activeMonthIndex === null || activeMonthIndex === index ? 1 : 0.2}
                          />
                        ))}
                      </Bar>
                      <Bar
                        dataKey="return_of_capital"
                        stackId="a"
                        fill="hsl(var(--status-funded))"
                        stroke="transparent"
                        name="Return of Capital"
                        onMouseOver={handleBarHover}
                      >
                        {filteredMonthlyDistributions.map((_, index) => (
                          <Cell
                            key={`roc-${index}`}
                            fill="hsl(var(--status-funded))"
                            fillOpacity={activeMonthIndex === null || activeMonthIndex === index ? 1 : 0.2}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Totals */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-muted/20 rounded-lg">
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">12-mo Income</div>
                    <div className="text-sm font-bold text-primary">
                      {formatCurrency(aggregatedTotals.income)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">ROC</div>
                    <div className="text-sm font-bold text-[hsl(var(--status-funded))]">
                      {formatCurrency(aggregatedTotals.roc)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">Total</div>
                    <div className="text-sm font-bold gradient-text">
                      {formatCurrency(aggregatedTotals.total)}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="text-muted-foreground mb-2 text-xs">No distributions yet.</div>
                <div className="text-xs text-muted-foreground">Income distributions will appear here once your investments start generating returns.</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={mode === 'simple' ? 'space-y-6' : 'grid grid-cols-1 lg:grid-cols-2 gap-6'}>
      {/* Upcoming Payouts */}
      <Card className="glass-card border-glass-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleCollapse('distributions')}
                className="p-1 hover:bg-muted rounded-sm transition-colors"
                aria-label="Toggle distributions section"
              >
                {isCollapsed('distributions') ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </button>
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle>Upcoming Payouts</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.location.href = '/transactions?type=distribution'}
                className="text-xs"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View Details
              </Button>
              {mode === 'simple' && upcomingPayouts.length > 2 && (
                <Button variant="outline" size="sm">
                  View all payouts
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className={`transition-all duration-200 ${isCollapsed('distributions') ? 'h-0 overflow-hidden opacity-0 p-0' : 'animate-fade-in'}`}>
          {displayedPayouts.length > 0 ? (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Investment</TableHead>
                    <TableHead>Est. Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedPayouts.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell className="text-sm">
                        {new Date(payout.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {payout.investment}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatCurrency(payout.estimated_amount)}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(payout.status)} border`}>
                          {payout.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No scheduled payouts.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Last 12 Months Distributions */}
      <Card className="glass-card border-glass-border">
        <CardHeader>
          <CardTitle>Last 12 Months Distributions</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredMonthlyDistributions.length > 0 ? (
            <div className="space-y-4">
              {/* Chart */}
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredMonthlyDistributions} onMouseLeave={resetBarHover}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="month" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />
                    <Bar
                      dataKey="ordinary_income"
                      stackId="a"
                      fill="hsl(var(--primary))"
                      stroke="transparent"
                      name="Ordinary Income"
                      onMouseOver={handleBarHover}
                    >
                      {filteredMonthlyDistributions.map((_, index) => (
                        <Cell
                          key={`oi-simple-${index}`}
                          fill="hsl(var(--primary))"
                          fillOpacity={activeMonthIndex === null || activeMonthIndex === index ? 1 : 0.25}
                        />
                      ))}
                    </Bar>
                    <Bar
                      dataKey="return_of_capital"
                      stackId="a"
                      fill="hsl(var(--status-funded))"
                      stroke="transparent"
                      name="Return of Capital"
                      onMouseOver={handleBarHover}
                    >
                      {filteredMonthlyDistributions.map((_, index) => (
                        <Cell
                          key={`roc-simple-${index}`}
                          fill="hsl(var(--status-funded))"
                          fillOpacity={activeMonthIndex === null || activeMonthIndex === index ? 1 : 0.25}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Totals */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-muted/20 rounded-lg">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">12-mo Income</div>
                  <div className="text-lg font-bold text-primary">
                    {formatCurrency(aggregatedTotals.income)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">ROC</div>
                  <div className="text-lg font-bold text-[hsl(var(--status-funded))]">
                    {formatCurrency(aggregatedTotals.roc)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Total</div>
                  <div className="text-lg font-bold gradient-text">
                    {formatCurrency(aggregatedTotals.total)}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-muted-foreground mb-2">No distributions yet.</div>
              <div className="text-sm text-muted-foreground">Income distributions will appear here once your investments start generating returns.</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
