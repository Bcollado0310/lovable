import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Pie, PieChart as RePieChart, Cell } from "recharts";
import { Calendar, ChevronDown, ChevronUp, ExternalLink, Eye } from "lucide-react";
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

interface SimpleIncomeSnapshotProps {
  upcomingPayouts: UpcomingPayout[];
  monthlyDistributions: MonthlyDistribution[];
  totalIncome: number;
  totalROC: number;
  totalDistributions: number;
  range?: DateRange;
  allocationSlot?: ReactNode;
}

const formatCurrency = (amount: number): string => `$${amount.toLocaleString()}`;

const getStatusColor = (status: UpcomingPayout["status"]): string => {
  switch (status) {
    case "scheduled":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "processing":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "paid":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  }
};

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/95 rounded-lg p-3 shadow-lg">
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

export function SimpleIncomeSnapshot({
  upcomingPayouts,
  monthlyDistributions,
  totalIncome,
  totalROC,
  totalDistributions,
  range = "all",
  allocationSlot
}: SimpleIncomeSnapshotProps) {
  const { isCollapsed, toggleCollapse } = useDashboardCollapse("simple");

  const filteredMonthlyDistributions = useMemo(() => {
    if (!monthlyDistributions || monthlyDistributions.length === 0) {
      return [];
    }

    if (range === "all") {
      return monthlyDistributions;
    }

    if (range === "ytd") {
      const currentMonthLabel = new Date().toLocaleString("en-US", { month: "short" });
      const currentIndex = monthLabelToIndex(currentMonthLabel);
      if (currentIndex === -1) {
        return monthlyDistributions;
      }

      return monthlyDistributions.filter((entry) => {
        const entryIndex = monthLabelToIndex(entry.month);
        return entryIndex === -1 ? true : entryIndex <= currentIndex;
      });
    }

    const monthsByRange: Record<Exclude<DateRange, "ytd" | "all">, number> = {
      "1m": 1,
      "3m": 3,
      "6m": 6,
      "1y": 12
    };

    const count = monthsByRange[range as Exclude<DateRange, "ytd" | "all">];
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

  const histogramGreen = "hsl(152 70% 45%)";
  const histogramGreenTextClass = "text-[hsl(152_70%_45%)]";

  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(null);
  const chartRef = useRef<HTMLDivElement | null>(null);

  const clearSelection = useCallback(() => {
    setSelectedMonthIndex(null);
  }, []);

  useEffect(() => {
    clearSelection();
  }, [range, monthlyDistributions, clearSelection]);

  const selectedMonth =
    selectedMonthIndex !== null ? filteredMonthlyDistributions[selectedMonthIndex] ?? null : null;
  const selectedMonthLabel = selectedMonth?.month ?? null;

  const handleMonthSelect = (index: number) => {
    setSelectedMonthIndex((prev) => (prev === index ? null : index));
  };

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (chartRef.current && !chartRef.current.contains(event.target as Node)) {
        clearSelection();
      }
    };

    document.addEventListener("click", handleDocumentClick, true);
    return () => document.removeEventListener("click", handleDocumentClick, true);
  }, [clearSelection]);
  const displayedPayouts = upcomingPayouts.slice(0, 2);

  const [goalTarget, setGoalTarget] = useState<'income' | 'total'>('total');
  const [goalMode, setGoalMode] = useState<'amount' | 'percent'>('amount');
  const [goalAmount, setGoalAmount] = useState<number>(() => Math.max((totalDistributions || 0) * 1.25, 1000));
  const [goalPercent, setGoalPercent] = useState<number>(125);
  const [goalDialogOpen, setGoalDialogOpen] = useState<boolean>(false);

  useEffect(() => {
    const activeValue = goalTarget === 'income' ? aggregatedTotals.income : aggregatedTotals.total;
    if (goalMode === 'amount') {
      if (!Number.isFinite(goalAmount) || goalAmount <= 0) {
        setGoalAmount(Math.max(activeValue * 1.25, 1000));
      }
    } else if (!Number.isFinite(goalPercent) || goalPercent <= 0) {
      setGoalPercent(125);
    }
  }, [goalTarget, goalMode, aggregatedTotals.income, aggregatedTotals.total, goalAmount, goalPercent]);

  const displayTotals = selectedMonth
    ? {
        income: selectedMonth.ordinary_income,
        total: selectedMonth.total
      }
    : {
        income: aggregatedTotals.income,
        total: aggregatedTotals.total
      };

  const summaryDonuts = useMemo(() => {
    const metrics = [
      {
        key: 'income' as const,
        label: selectedMonthLabel ?? '12-mo',
        caption: 'Income',
        value: displayTotals.income,
        fill: 'hsl(var(--primary))',
        accentClass: 'text-primary'
      },
      {
        key: 'total' as const,
        label: selectedMonthLabel ? `${selectedMonthLabel} Total` : 'Total',
        caption: 'Distributions',
        value: displayTotals.total,
        fill: histogramGreen,
        accentClass: histogramGreenTextClass
      }
    ];

    return metrics.map((item) => {
      const baseValue = Math.max(item.value, 0);
      const targetValue =
        item.key === goalTarget
          ? goalMode === 'amount'
            ? Math.max(goalAmount, 0)
            : Math.max((goalPercent / 100) * (baseValue || 1), baseValue * 0.1)
          : Math.max(baseValue * 1.2, baseValue + 1);

      const goalValue = Math.max(targetValue, baseValue * 0.1, 1);
      const remainder = Math.max(goalValue - baseValue, goalValue * 0.03);
      const progress = goalValue > 0 ? Math.min(baseValue / goalValue, 1) : 1;

      return {
        ...item,
        goalValue,
        remainder,
        progress
      };
    });
  }, [displayTotals.income, displayTotals.total, goalTarget, goalMode, goalAmount, goalPercent, histogramGreenTextClass, selectedMonthLabel, selectedMonth]);

  const activeMetric = summaryDonuts.find((item) => item.key === goalTarget);
  const activeGoalMax = Math.max(
    activeMetric?.goalValue ?? 0,
    goalMode === 'amount' ? goalAmount : 0,
    (activeMetric?.value ?? 0) * 1.6,
    1000
  );
  const activeGoalDisplay = useMemo(() => {
    const metricValue = activeMetric?.value ?? 0;
    const metricGoal = activeMetric?.goalValue ?? 0;
    if (goalMode === 'amount') {
      return Math.max(goalAmount, metricGoal, metricValue);
    }
    return Math.max(metricGoal, metricValue);
  }, [activeMetric, goalMode, goalAmount, goalPercent]);
  const goalSummary = useMemo(() => {
    const targetLabel = goalTarget === 'income' ? 'Income' : 'Total distributions';
    if (goalMode === 'amount') {
      return `${targetLabel} goal set to ${formatCurrency(goalAmount)}`;
    }
    const basisLabel = goalTarget === 'income' ? 'current income' : 'current total distributions';
    return `${goalPercent}% of ${basisLabel}`;
  }, [goalTarget, goalMode, goalAmount, goalPercent]);

  const toggleUpcoming = () =>
    toggleCollapse("simple-income-upcoming", (moduleKey, collapsed, mode) => {
      if (collapsed) {
        dashboardAnalytics.moduleCollapsed(moduleKey, mode);
      } else {
        dashboardAnalytics.moduleExpanded(moduleKey, mode);
      }
    });

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-2">
      <Card className="glass-card border-glass-border">
        <CardHeader>
          <CardTitle>Last 12 Months Distributions</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredMonthlyDistributions.length > 0 ? (
            <div className="space-y-4">
              <div ref={chartRef} className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredMonthlyDistributions}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <Tooltip cursor={{ fill: "transparent" }} content={<CustomBarTooltip />} />
                    <Bar
                      dataKey="ordinary_income"
                      stackId="a"
                      fill="hsl(var(--primary))"
                      stroke="transparent"
                      name="Ordinary Income"
                      isAnimationActive={false}
                      cursor="pointer"
                    >
                      {filteredMonthlyDistributions.map((_, index) => {
                        const isSelected = selectedMonthIndex === index;
                        const dimmed = selectedMonthIndex !== null && !isSelected;

                        return (
                          <Cell
                            key={`oi-simple-${index}`}
                            fill="hsl(var(--primary))"
                            cursor="pointer"
                            fillOpacity={dimmed ? 0.2 : 1}
                            stroke={isSelected ? "hsl(var(--primary))" : "transparent"}
                            strokeWidth={isSelected ? 2 : 0}
                            onClick={() => handleMonthSelect(index)}
                          />
                        );
                      })}
                    </Bar>
                    <Bar
                      dataKey="return_of_capital"
                      stackId="a"
                      fill={histogramGreen}
                      stroke="transparent"
                      name="Return of Capital"
                      isAnimationActive={false}
                      cursor="pointer"
                    >
                      {filteredMonthlyDistributions.map((_, index) => {
                        const isSelected = selectedMonthIndex === index;
                        const dimmed = selectedMonthIndex !== null && !isSelected;

                        return (
                          <Cell
                            key={`roc-simple-${index}`}
                            fill={histogramGreen}
                            cursor="pointer"
                            fillOpacity={dimmed ? 0.2 : 1}
                            stroke={isSelected ? histogramGreen : "transparent"}
                            strokeWidth={isSelected ? 2 : 0}
                            onClick={() => handleMonthSelect(index)}
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <div>
                  {selectedMonth ? (
                    <>
                      <span className="font-medium text-foreground">{selectedMonth.month}</span>
                      <span className="ml-1">
                        - Income {formatCurrency(selectedMonth.ordinary_income)} | ROC{" "}
                        {formatCurrency(selectedMonth.return_of_capital)} | Total{" "}
                        {formatCurrency(selectedMonth.total)}
                      </span>
                    </>
                  ) : (
                    <span>Click a month bar to inspect its breakdown.</span>
                  )}
                </div>
                {selectedMonth && (
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="inline-flex w-fit items-center gap-1 rounded-full border border-transparent bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary transition hover:bg-primary/15"
                  >
                    Clear selection
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-muted-foreground mb-2 text-xs">No distributions yet.</div>
              <div className="text-xs text-muted-foreground">
                Income distributions will appear here once your investments start generating returns.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glass-card border-glass-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleUpcoming}
                className="p-1 hover:bg-muted rounded-sm transition-colors"
                aria-label="Toggle upcoming payouts"
              >
                {isCollapsed("simple-income-upcoming") ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </button>
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle>Upcoming Payouts</CardTitle>
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
        <CardContent
          className={`transition-all duration-200 ${
            isCollapsed("simple-income-upcoming") ? 'h-0 overflow-hidden opacity-0 p-0' : 'animate-fade-in'
          }`}
        >
          {displayedPayouts.length > 0 ? (
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
          ) : (
            <div className="text-center py-6">
              <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No scheduled payouts.</p>
            </div>
          )}
        </CardContent>
      </Card>


      <Card className="glass-card border-glass-border h-full flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Totals Snapshot</CardTitle>
          <span className="text-sm font-semibold gradient-text">
            {formatCurrency(selectedMonth ? selectedMonth.total : aggregatedTotals.total)}
          </span>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col items-center gap-8 w-full">
          {summaryDonuts.every((item) => item.value === 0) ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              Totals will appear once your distributions start posting.
            </div>
          ) : (
            <div className="grid w-full max-w-[720px] mx-auto gap-12 sm:grid-cols-2 place-items-center justify-center">
              {summaryDonuts.map((item) => (
                <div key={item.key} className="flex flex-col items-center gap-6">
                  <div className="relative h-48 w-48 sm:h-56 sm:w-56 2xl:h-64 2xl:w-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <defs>
                          <radialGradient id={`donut-light-${item.key}`} cx="50%" cy="40%" r="65%">
                            <stop offset="0%" stopColor="rgba(255,255,255,0.45)" />
                            <stop offset="55%" stopColor="rgba(255,255,255,0.12)" />
                            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                          </radialGradient>
                          <linearGradient id={`donut-glow-${item.key}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="10%" stopColor={item.fill} stopOpacity="1" />
                            <stop offset="95%" stopColor={item.fill} stopOpacity="0.45" />
                          </linearGradient>
                        </defs>
                        <Pie
                          dataKey="value"
                          data={[{ name: "value", value: item.value }, { name: "remainder", value: item.remainder }]}
                          innerRadius="60%"
                          outerRadius="100%"
                          startAngle={94}
                          endAngle={454}
                          cornerRadius={18}
                          stroke="none"
                        >
                          <Cell fill={`url(#donut-glow-${item.key})`} stroke="none" />
                          <Cell fill="rgba(0,0,0,0.25)" stroke="none" />
                        </Pie>
                        <Pie
                          dataKey="value"
                          data={[{ name: "shadow", value: item.goalValue }]}
                          innerRadius="105%"
                          outerRadius="113%"
                          startAngle={90}
                          endAngle={450}
                          stroke="none"
                        >
                          <Cell fill="rgba(0,0,0,0.22)" stroke="none" />
                        </Pie>
                      </RePieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center gap-1">
                      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                        {item.label}
                      </span>
                      <span className={`text-2xl font-semibold ${item.accentClass} drop-shadow-[0_10px_32px_rgba(0,0,0,0.55)]`}>
                        {formatCurrency(item.value)}
                      </span>
                    </div>
                    <div className="pointer-events-none absolute inset-0 rounded-full shadow-[0_26px_65px_-18px_rgba(0,0,0,0.7)]" />
                    <div className="pointer-events-none absolute inset-4 rounded-full border border-white/5" />
                    <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_28%_18%,rgba(255,255,255,0.35),transparent_55%)]" />
                  </div>
                  <div className="flex flex-col items-center gap-1 text-center">
                    <span className="text-sm font-medium uppercase tracking-wide text-muted-foreground">{item.caption}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.key === goalTarget ? `${Math.min(Math.round(item.progress * 100), 999)}% towards goal` : `Goal ~ ${formatCurrency(item.goalValue)}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-auto w-full max-w-[720px] rounded-2xl border border-white/5 bg-muted/10 p-4 space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-[0.4em] text-muted-foreground">Target</span>
                <span className="text-sm text-muted-foreground">{goalSummary}</span>
              </div>
              <Button
                type="button"
                size="lg"
                className="w-full sm:w-auto bg-gradient-primary hover:shadow-neon"
                onClick={() => setGoalDialogOpen(true)}
              >
                Configure Goal
              </Button>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Projected benchmark</span>
              <span>Goal ~ {formatCurrency(activeGoalDisplay)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {allocationSlot ? <div className="h-full">{allocationSlot}</div> : null}
      </div>

      <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
        <DialogContent className="glass-card border-glass-border sm:max-w-[720px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure Goal Target</DialogTitle>
            <DialogDescription>
              Choose the metric and target style that keeps you on track.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.4em] text-muted-foreground">Target</span>
                <div className="flex rounded-lg bg-background/40 p-1 gap-1">
                  <Button
                    type="button"
                    variant={goalTarget === 'income' ? 'default' : 'ghost'}
                    size="sm"
                    className="px-3"
                    onClick={() => {
                      setGoalTarget('income');
                      if (goalMode === 'amount') {
                        const base = aggregatedTotals.income || 0;
                        setGoalAmount(Math.max(base * 1.25, 1000));
                      }
                    }}
                  >
                    Income
                  </Button>
                  <Button
                    type="button"
                    variant={goalTarget === 'total' ? 'default' : 'ghost'}
                    size="sm"
                    className="px-3"
                    onClick={() => {
                      setGoalTarget('total');
                      if (goalMode === 'amount') {
                        const base = aggregatedTotals.total || 0;
                        setGoalAmount(Math.max(base * 1.25, 1000));
                      }
                    }}
                  >
                    Total
                  </Button>
                </div>
              </div>

              <div className="flex rounded-lg bg-background/40 p-1 gap-1">
                <Button
                  type="button"
                  variant={goalMode === 'amount' ? 'default' : 'ghost'}
                  size="sm"
                  className="px-3"
                  onClick={() => {
                    setGoalMode('amount');
                    const base = goalTarget === 'income' ? aggregatedTotals.income : aggregatedTotals.total;
                    setGoalAmount(Math.max(base * 1.25, 1000));
                  }}
                >
                  Amount
                </Button>
                <Button
                  type="button"
                  variant={goalMode === 'percent' ? 'default' : 'ghost'}
                  size="sm"
                  className="px-3"
                  onClick={() => {
                    setGoalMode('percent');
                    if (goalPercent <= 0) {
                      setGoalPercent(125);
                    }
                  }}
                >
                  Percent
                </Button>
              </div>
            </div>

            {goalMode === 'amount' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Goal amount</span>
                  <span>{formatCurrency(goalAmount)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={Math.max(activeGoalMax, goalAmount, 1000)}
                  step="100"
                  value={goalAmount}
                  onChange={(event) => setGoalAmount(Number(event.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                  <Input
                    type="number"
                    value={Math.round(goalAmount)}
                    onChange={(event) => setGoalAmount(Math.max(Number(event.target.value) || 0, 0))}
                    className="w-full sm:w-28 bg-background/40 border-white/10"
                    min="0"
                    step="100"
                  />
                  <div className="flex flex-1 flex-col gap-1 text-xs text-muted-foreground min-w-[200px]">
                    <span>Target compared to {goalTarget === 'income' ? '12-mo income' : 'total distributions'}</span>
                    <span>Goal ~ {formatCurrency(activeGoalDisplay)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Goal percentage</span>
                  <span>{goalPercent}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="300"
                  step="5"
                  value={goalPercent}
                  onChange={(event) => setGoalPercent(Number(event.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                  <Input
                    type="number"
                    value={goalPercent}
                    onChange={(event) => setGoalPercent(Math.min(Math.max(Number(event.target.value) || 0, 1), 300))}
                    className="w-full sm:w-24 bg-background/40 border-white/10"
                    min="10"
                    max="300"
                  />
                  <div className="flex flex-1 flex-col gap-1 text-xs text-muted-foreground min-w-[200px]">
                    <span>Applied against current {goalTarget === 'income' ? 'income' : 'total'} value</span>
                    <span>Goal ~ {formatCurrency(activeGoalDisplay)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" className="w-full sm:w-auto bg-gradient-primary hover:shadow-neon">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}













