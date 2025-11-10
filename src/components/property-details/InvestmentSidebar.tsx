import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  DollarSign, 
  Calculator, 
  Bell, 
  Bookmark, 
  TrendingUp, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

const currencyMeta: Record<string, { symbol: string; locale: string }> = {
  USD: { symbol: '$', locale: 'en-US' },
  EUR: { symbol: '\u20AC', locale: 'de-DE' },
  GBP: { symbol: '\u00A3', locale: 'en-GB' }
};

const getCurrencyMeta = (currency: string) => {
  const upper = currency.toUpperCase();
  return currencyMeta[upper] ?? currencyMeta.USD;
};

const getPreferredCurrency = (fallback: string) => {
  if (typeof window === 'undefined') return fallback;
  try {
    const stored = window.localStorage.getItem('investment-filters');
    if (!stored) return fallback;
    const parsed = JSON.parse(stored);
    return (parsed?.currency ?? fallback).toUpperCase();
  } catch {
    return fallback;
  }
};

interface InvestmentSidebarProps {
  property: {
    id: string;
    title: string;
    minimum_investment: number;
    expected_annual_return: number;
    target_funding: number;
    current_funding: number;
    property_status: string;
    funding_deadline?: string;
    currency?: string;
  };
  className?: string;
  isMobile?: boolean;
  onInvest?: (amount: number) => void;
}

export function InvestmentSidebar({
  property,
  className,
  isMobile = false,
  onInvest
}: InvestmentSidebarProps) {
  const [investmentAmountInput, setInvestmentAmountInput] = useState("0");
  const [watchlistEnabled, setWatchlistEnabled] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);

  const currency = getPreferredCurrency(property.currency ?? 'USD');
  const { symbol, locale } = getCurrencyMeta(currency);
  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }),
    [locale]
  );
  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        maximumFractionDigits: 0
      }),
    [locale, currency]
  );

  const fundingPercentage = (property.current_funding / property.target_funding) * 100;
  const isFullyFunded = property.property_status === 'fully_funded';
  const remaining = property.target_funding - property.current_funding;

  const remainingAllocation = Math.max(remaining, 0);
  const maxInvestment = Math.max(
    property.minimum_investment * 20,
    remainingAllocation > 0 ? remainingAllocation : property.minimum_investment * 20
  );
  const investmentAmount =
    investmentAmountInput === "" ? 0 : Number(investmentAmountInput);
  const allocationPercent =
    maxInvestment > 0
      ? Math.min(Math.round((investmentAmount / maxInvestment) * 100), 100)
      : 0;
  const formattedAmountInput =
    investmentAmountInput === "" ? "" : numberFormatter.format(Number(investmentAmountInput));

  // Calculate projected returns
  const projectedAnnualIncome = (investmentAmount * property.expected_annual_return) / 100;
  const projectedMonthlyIncome = projectedAnnualIncome / 12;
  const projectedTotalReturn = investmentAmount * 1.8; // 1.8x equity multiple assumption
  const meetsMinimum = investmentAmount >= property.minimum_investment;
  const formattedInvestmentAmount = currencyFormatter.format(
    Math.round(investmentAmount || 0)
  );

  const handleAmountChange = (value: string) => {
    const sanitized = value.replace(/\D/g, '');
    if (sanitized === '') {
      setInvestmentAmountInput('');
      return;
    }

    const numeric = Number(sanitized);
    if (Number.isNaN(numeric)) {
      return;
    }

    const bounded = Math.min(numeric, maxInvestment);
    setInvestmentAmountInput(String(bounded));
  };

  const getTimeLeft = () => {
    if (!property.funding_deadline) return null;
    const deadline = new Date(property.funding_deadline);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return 'Expired';
    if (diffDays === 1) return '1 day left';
    if (diffDays <= 7) return `${diffDays} days left`;
    return `${diffDays} days left`;
  };

  const timeLeft = getTimeLeft();

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Investment Calculator */}
      <Card className="glass-card border-glass-border flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Investment Calculator
          </CardTitle>
          {timeLeft && (
            <Badge 
              variant="outline" 
              className={cn(
                "w-fit",
                timeLeft.includes('day') && parseInt(timeLeft) <= 7 ? "border-red-500/50 text-red-400" : "border-yellow-500/50 text-yellow-400"
              )}
            >
              <Calendar className="h-3 w-3 mr-1" />
              {timeLeft}
            </Badge>
          )}
        </CardHeader>
        
        <CardContent className="flex flex-col gap-6">
          {/* Investment Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="investment-amount">Investment Amount</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                {symbol}
              </span>
              <Input
                id="investment-amount"
                value={formattedAmountInput}
                onChange={(e) => handleAmountChange(e.target.value)}
                inputMode="numeric"
                pattern="[0-9]*"
                className="glass border-glass-border bg-background/60 pl-9 pr-4 text-right text-lg font-semibold tracking-tight"
                placeholder="0"
              />
            </div>

            <div className="space-y-1">
              <div className="relative h-1.5 w-full rounded-full bg-muted/40">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-primary transition-all duration-300"
                  style={{ width: `${allocationPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{currencyFormatter.format(property.minimum_investment)}</span>
                <span className="font-medium text-foreground">
                  {allocationPercent}% allocation
                </span>
                <span>{currencyFormatter.format(maxInvestment)}</span>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              Suggested minimum: {currencyFormatter.format(property.minimum_investment)}
            </div>
            {investmentAmountInput === "" && (
              <div className="text-xs text-muted-foreground italic">
                Enter a custom amount to preview projections.
              </div>
            )}
          </div>

          <Separator className="bg-glass-border" />

          {/* Projected Returns */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="font-medium">Projected Returns</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Annual Income</div>
                <div className="font-medium text-primary">
                  {currencyFormatter.format(Math.round(projectedAnnualIncome))}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Monthly Income</div>
                <div className="font-medium">
                  {currencyFormatter.format(Math.round(projectedMonthlyIncome))}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Total Return (3-5Y)</div>
                <div className="font-medium text-green-400">
                  {currencyFormatter.format(Math.round(projectedTotalReturn))}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Profit</div>
                <div className="font-medium text-green-400">
                  {currencyFormatter.format(
                    Math.round(projectedTotalReturn - investmentAmount)
                  )}
                </div>
              </div>
            </div>

            <div className="p-3 bg-muted/20 rounded-lg border border-muted/50">
              <p className="text-xs text-muted-foreground">
                Projections based on {property.expected_annual_return}% target IRR and 1.8x equity multiple. 
                Actual returns may vary.
              </p>
            </div>
          </div>

          <Separator className="bg-glass-border" />

          <div className="flex flex-col gap-6 xl:mt-auto">
            {/* Investment CTA */}
            {isFullyFunded ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-yellow-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Fully Funded</span>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full glass border-glass-border"
                  disabled
                >
                  Join Waitlist for Secondary
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* KYC/Accreditation Status */}
                <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-blue-400" />
                    <span className="text-sm font-medium text-blue-400">Accreditation Required</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Complete your investor verification to proceed with investment.
                  </p>
                </div>

                <Button 
                  className="w-full bg-gradient-primary hover:shadow-neon" 
                  size={isMobile ? "lg" : "default"}
                  disabled={!meetsMinimum}
                  onClick={() => meetsMinimum && onInvest?.(investmentAmount)}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Invest {formattedInvestmentAmount}
                </Button>
              </div>
            )}

            <Separator className="bg-glass-border" />

            {/* Watchlist & Reminders */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bookmark className="h-4 w-4" />
                  <Label htmlFor="watchlist" className="text-sm">Add to Watchlist</Label>
                </div>
                <Switch
                  id="watchlist"
                  checked={watchlistEnabled}
                  onCheckedChange={setWatchlistEnabled}
                />
              </div>

              {!isFullyFunded && property.funding_deadline && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    <Label htmlFor="reminder" className="text-sm">Deadline Reminder</Label>
                  </div>
                  <Switch
                    id="reminder"
                    checked={reminderEnabled}
                    onCheckedChange={setReminderEnabled}
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card className="glass-card border-glass-border">
        <CardContent className="p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Funded</span>
            <span className="font-medium">{fundingPercentage.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Remaining</span>
            <span className="font-medium">{currencyFormatter.format(remainingAllocation)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Investors</span>
            <span className="font-medium">247</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Avg Investment</span>
            <span className="font-medium">{currencyFormatter.format(28500)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
