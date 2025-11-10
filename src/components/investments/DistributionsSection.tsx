import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { EmptyState } from '@/components/EmptyState';

interface UpcomingPayout {
  id: string;
  investment: string;
  date: string;
  estimated_amount: number;
  status: 'scheduled' | 'processing' | 'paid';
}

interface MonthlyDistribution {
  month: string;
  ordinary_income: number;
  return_of_capital: number;
  total: number;
}

interface DistributionsSectionProps {
  upcomingPayouts: UpcomingPayout[];
  monthlyDistributions: MonthlyDistribution[];
  currency: string;
}

export function DistributionsSection({ 
  upcomingPayouts, 
  monthlyDistributions, 
  currency 
}: DistributionsSectionProps) {
  const formatCurrency = (amount: number) => {
    const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£';
    return `${symbol}${amount.toLocaleString()}`;
  };

  const ordinaryColor = 'hsl(var(--primary))';
  const rocColor = 'hsl(152 70% 45%)';

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const handleBarHover = (state: any) => {
    if (typeof state?.activeTooltipIndex === 'number') {
      setActiveIndex(state.activeTooltipIndex);
    }
  };

  const handleBarLeave = () => setActiveIndex(null);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) {
      return null;
    }

    return (
      <div className="bg-background/95 border border-glass-border rounded-lg p-3 shadow-lg text-sm space-y-1">
        <p className="font-semibold mb-1">{label}</p>
        {payload.map((entry: any) => {
          const isROC = entry.dataKey === 'return_of_capital';
          return (
            <div
              key={entry.dataKey}
              className="flex justify-between gap-3"
              style={{ color: isROC ? rocColor : ordinaryColor }}
            >
              <span>{isROC ? 'Return of Capital' : 'Ordinary Income'}</span>
              <span>{formatCurrency(entry.value)}</span>
            </div>
          );
        })}
      </div>
    );
  };


  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      scheduled: "outline",
      processing: "default",
      paid: "secondary"
    };
    
    return (
      <Badge variant={variants[status] || "outline"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const totalIncome12M = monthlyDistributions.reduce((sum, month) => sum + month.ordinary_income, 0);
  const totalROC12M = monthlyDistributions.reduce((sum, month) => sum + month.return_of_capital, 0);
  const totalDistributions12M = totalIncome12M + totalROC12M;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Upcoming Payouts */}
      <Card className="glass-card border-glass-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Payouts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingPayouts.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No scheduled payouts</p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Investment</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingPayouts.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell className="font-medium">{payout.investment}</TableCell>
                      <TableCell>{new Date(payout.date).toLocaleDateString()}</TableCell>
                      <TableCell>{formatCurrency(payout.estimated_amount)}</TableCell>
                      <TableCell>{getStatusBadge(payout.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Last 12 Months Distributions */}
      <Card className="glass-card border-glass-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Last 12 Months Distributions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyDistributions.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No distribution history</p>
            </div>
          ) : (
            <>
              <div className="h-64 w-full mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyDistributions}
                    onMouseMove={handleBarHover}
                    onMouseLeave={handleBarLeave}
                    barCategoryGap="20%"
                  >
                    <defs>
                      <filter id="distributionGlowPrimary" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                        <feMerge>
                          <feMergeNode in="coloredBlur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                      <filter id="distributionGlowRoc" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                        <feMerge>
                          <feMergeNode in="coloredBlur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="month"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickFormatter={(value) => formatCurrency(value)}
                    />
                    <Tooltip cursor={false} content={<CustomTooltip />} />
                    <Bar
                      dataKey="ordinary_income"
                      stackId="a"
                      fill={ordinaryColor}
                      name="Ordinary Income"
                      isAnimationActive={false}
                    >
                      {monthlyDistributions.map((_, index) => {
                        const isActive = activeIndex === index;
                        return (
                          <Cell
                            key={`income-${index}`}
                            fill={ordinaryColor}
                            filter={isActive ? 'url(#distributionGlowPrimary)' : 'none'}
                            style={{
                              transformOrigin: 'center bottom',
                              transform: isActive ? 'scale(1.018)' : 'scale(1)',
                              transition: 'transform 160ms ease-out',
                            }}
                          />
                        );
                      })}
                    </Bar>
                    <Bar
                      dataKey="return_of_capital"
                      stackId="a"
                      fill={rocColor}
                      name="Return of Capital"
                      isAnimationActive={false}
                    >
                      {monthlyDistributions.map((_, index) => {
                        const isActive = activeIndex === index;
                        return (
                          <Cell
                            key={`roc-${index}`}
                            fill={rocColor}
                            filter={isActive ? 'url(#distributionGlowRoc)' : 'none'}
                            style={{
                              transformOrigin: 'center bottom',
                              transform: isActive ? 'scale(1.018)' : 'scale(1)',
                              transition: 'transform 160ms ease-out',
                            }}
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              {/* Totals Summary */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/50">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">12-mo Income</div>
                  <div className="font-semibold text-primary">{formatCurrency(totalIncome12M)}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">12-mo ROC</div>
                  <div className="font-semibold text-emerald-400">{formatCurrency(totalROC12M)}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Total</div>
                  <div className="font-semibold">{formatCurrency(totalDistributions12M)}</div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}