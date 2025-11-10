import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RangeSelector } from "@/components/ui/range-selector";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { usePerformanceRange } from "@/hooks/usePerformanceRange";
import { useDeveloperPropertyAnalytics } from "@/hooks/useDeveloperPropertyAnalytics";
import { formatCurrency } from "@/utils/developerHelpers";
import {
  TrendingUp,
  CircleDollarSign,
  Users,
  Activity,
  Building2,
  Layers,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
} from "recharts";

function currencyTick(value: number) {
  if (Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}k`;
  }
  return `$${value}`;
}

export default function DeveloperAnalytics() {
  const [propertyFilter, setPropertyFilter] = useState("all");
  const { range, setRange } = usePerformanceRange();
  const { data: analytics, loading, error } = useDeveloperPropertyAnalytics(range, propertyFilter);

  const summaryCards = useMemo(() => {
    const summary = analytics?.summary;
    if (!summary) {
      return [];
    }

    return [
      {
        label: "Capital inflows",
        value: formatCurrency(summary.capitalInflows),
        subtext: `Avg daily ${formatCurrency(summary.contributionVelocity || 0)}`,
        icon: TrendingUp,
      },
      {
        label: "Distributions paid",
        value: formatCurrency(summary.distributionsPaid),
        subtext: `Net ${formatCurrency(summary.netCashFlow)}`,
        icon: CircleDollarSign,
      },
      {
        label: "Active investors",
        value: summary.activeInvestors.toString(),
        subtext: `Avg ticket ${formatCurrency(summary.averageTicketSize || 0)}`,
        icon: Users,
      },
      {
        label: "Sample size",
        value: analytics.sampleSize.toString(),
        subtext: analytics.range.label,
        icon: Activity,
      },
    ];
  }, [analytics]);

  const selectedSnapshot = useMemo(() => {
    if (!analytics?.propertyPerformance?.length) return null;
    if (propertyFilter === "all") {
      return analytics.propertyPerformance.reduce(
        (acc, property) => ({
          ...acc,
          targetAmount: acc.targetAmount + property.targetAmount,
          raisedAmount: acc.raisedAmount + property.raisedAmount,
          distributionsPaid: acc.distributionsPaid + property.distributionsPaid,
          netCashFlow: acc.netCashFlow + property.netCashFlow,
          periodInvestors: acc.periodInvestors + property.periodInvestors,
        }),
        {
          id: "portfolio",
          title: "Portfolio • All projects",
          location: "Multi-market",
          status: "portfolio",
          targetAmount: 0,
          raisedAmount: 0,
          distributionsPaid: 0,
          netCashFlow: 0,
          periodInvestors: 0,
        }
      );
    }
    return analytics.propertyPerformance.find((property) => property.id === propertyFilter);
  }, [analytics, propertyFilter]);

  const insights = useMemo(() => {
    if (!analytics) return [];
    const { summary, propertyPerformance } = analytics;
    const topProperty = propertyPerformance[0];
    const share = summary.capitalInflows > 0 && topProperty
      ? Math.round((topProperty.netCashFlow / summary.capitalInflows) * 100)
      : 0;

    return [
      `Capital inflows of ${formatCurrency(summary.capitalInflows)} over ${analytics.range.label.toLowerCase()}.`,
      `${summary.activeInvestors} active investors averaged ${formatCurrency(summary.averageTicketSize || 0)} per ticket.`,
      topProperty
        ? `${topProperty.title} generated ${formatCurrency(topProperty.netCashFlow)} net cash flow (${share}% of inflows).`
        : "Portfolio is awaiting new capital events.",
    ];
  }, [analytics]);

  const propertyOptions = analytics?.filters.offerings || [];
  const timelineData = analytics?.timeline || [];
  const investorSegments = analytics?.investorSegments || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Deep performance visibility across every project and payout cycle.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select value={propertyFilter} onValueChange={setPropertyFilter}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select a property" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All projects</SelectItem>
              {propertyOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <RangeSelector value={range} onValueChange={setRange} className="w-[140px]" />
        </div>
      </div>

      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-4 text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : analytics ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {summaryCards.map((card) => (
              <Card key={card.label}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.label}
                  </CardTitle>
                  <card.icon className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">{card.value}</div>
                  <p className="text-sm text-muted-foreground">{card.subtext}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedSnapshot && (
            <Card>
              <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="text-xl">{selectedSnapshot.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {selectedSnapshot.location || "Focused asset"}
                  </p>
                </div>
                <Badge variant="outline">
                  {analytics.range.label}
                </Badge>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground">Capital raised (period)</p>
                  <div className="text-2xl font-semibold">{formatCurrency(selectedSnapshot.raisedAmount)}</div>
                  <Progress value={Math.min(100, (selectedSnapshot.raisedAmount / Math.max(selectedSnapshot.targetAmount, 1)) * 100)} className="mt-3" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Distributions paid</p>
                  <div className="text-2xl font-semibold">{formatCurrency(selectedSnapshot.distributionsPaid || 0)}</div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Net cash flow</p>
                  <div className="text-2xl font-semibold text-emerald-400">
                    {formatCurrency(selectedSnapshot.netCashFlow || 0)}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active investors</p>
                  <div className="text-2xl font-semibold">
                    {selectedSnapshot.periodInvestors ?? selectedSnapshot.investorCount ?? 0}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Cash flow timeline</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Investments vs distributions for the selected window
                  </p>
                </div>
              </CardHeader>
              <CardContent className="h-[320px]">
                {timelineData.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={timelineData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" className="text-xs text-muted-foreground" />
                      <YAxis
                        tickFormatter={currencyTick}
                        className="text-xs text-muted-foreground"
                      />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        labelClassName="text-sm"
                      />
                      <Area
                        type="monotone"
                        dataKey="cumulative"
                        fill="hsl(var(--primary)/0.15)"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                      />
                      <Bar dataKey="investments" fill="hsl(var(--primary))" opacity={0.8} barSize={18} radius={4} />
                      <Bar dataKey="distributions" fill="hsl(var(--destructive))" opacity={0.7} barSize={18} radius={4} />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    No capital events recorded in this range.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Investor mix</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Segmented by investor type for the selected filter
                </p>
              </CardHeader>
              <CardContent className="h-[320px]">
                {investorSegments.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={investorSegments}
                      layout="vertical"
                      barCategoryGap={18}
                      margin={{ left: 8, right: 16, top: 8, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis
                        type="number"
                        tickFormatter={currencyTick}
                        className="text-xs text-muted-foreground"
                      />
                      <YAxis
                        type="category"
                        dataKey="type"
                        width={110}
                        tickMargin={6}
                        tickLine={false}
                        className="text-xs text-muted-foreground"
                      />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Bar dataKey="totalDeployed" fill="hsl(var(--primary))" radius={4} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    No investor activity yet for this selection.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Property performance</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Compare period-level traction across every project
                  </p>
                </div>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Funding progress</TableHead>
                      <TableHead>Net cash flow</TableHead>
                      <TableHead>Distributions</TableHead>
                      <TableHead>Active investors</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.propertyPerformance.map((property) => (
                      <TableRow key={property.id}>
                        <TableCell>
                          <div className="font-medium">{property.title}</div>
                          <p className="text-xs text-muted-foreground">{property.location}</p>
                        </TableCell>
                        <TableCell className="w-[200px]">
                          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                            <span>{property.status}</span>
                            <span>{property.fundingProgress.toFixed(1)}%</span>
                          </div>
                          <Progress value={property.fundingProgress} />
                        </TableCell>
                        <TableCell>{formatCurrency(property.netCashFlow)}</TableCell>
                        <TableCell>{formatCurrency(property.distributionsPaid)}</TableCell>
                        <TableCell>{property.periodInvestors}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Key insights</CardTitle>
                <Layers className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent className="space-y-4">
                {insights.map((insight) => (
                  <div key={insight} className="flex gap-3 text-sm">
                    <Building2 className="mt-0.5 h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">{insight}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No analytics available yet. Trigger an offering to see live data.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
