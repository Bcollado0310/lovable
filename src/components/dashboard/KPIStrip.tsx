import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip-portal";
import { Info, DollarSign, TrendingUp, Percent, Calculator, Target, Clock, Building2, Calendar } from "lucide-react";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { dashboardAnalytics } from "@/utils/analytics";
import type { DateRange } from "@/components/ui/range-selector";

interface KPIData {
  cash_available: number;
  total_invested: number;
  current_value: number;
  total_distributions: number;
  unfunded_commitments: number;
  active_investments: number;
}

interface KPIStripProps {
  data: KPIData;
  mode?: 'simple' | 'pro';
  range: DateRange;
}

export function KPIStrip({ data, mode = 'pro', range }: KPIStripProps) {
  const [openTooltip, setOpenTooltip] = useState<string | null>(null);

  // Format currency consistently
  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`;
  };

  // Calculate derived metrics based on selected range
  const getAdjustedData = () => {
    // In production, this would filter data based on the selected time range
    // For now, we'll apply different multipliers to simulate time-based changes
    const multipliers = {
      "1m": 0.1,
      "3m": 0.25,
      "6m": 0.5,
      "1y": 0.8,
      "ytd": 0.7,
      "all": 1.0
    };
    
    const multiplier = multipliers[range] ?? 1;
    return {
      ...data,
      total_distributions: data.total_distributions * multiplier,
      current_value: data.total_invested + (data.current_value - data.total_invested) * multiplier
    };
  };

  const adjustedData = getAdjustedData();
  const netReturn = adjustedData.current_value + adjustedData.total_distributions - adjustedData.total_invested;
  const netReturnPercentage = adjustedData.total_invested > 0 
    ? ((netReturn / adjustedData.total_invested) * 100).toFixed(2)
    : "0.00";
  
  const moic = adjustedData.total_invested > 0 
    ? ((adjustedData.current_value + adjustedData.total_distributions) / adjustedData.total_invested).toFixed(2)
    : "0.00";

  // Mock IRR calculation - would vary by time range in production
  const irrByRange = {
    "1m": "2.1",
    "3m": "8.4", 
    "6m": "11.2",
    "1y": "12.5",
    "ytd": "10.8",
    "all": "14.2"
  };
  const portfolioIRR = irrByRange[range] ?? "14.2";

  // Get next payout info for simple mode
  const nextPayout = {
    date: "Feb 15, 2024",
    amount: 2500
  };

  const kpiDefinitions = [
    {
      label: "Cash Available",
      value: formatCurrency(adjustedData.cash_available),
      numericValue: adjustedData.cash_available,
      sublabel: "Ready to invest",
      icon: DollarSign,
      tooltip: "Funds ready to invest or withdraw.",
      modes: ["simple", "pro"]
    },
    {
      label: "Current Value",
      value: formatCurrency(adjustedData.current_value),
      numericValue: adjustedData.current_value,
      sublabel: "Portfolio value",
      icon: TrendingUp,
      tooltip: "Estimated current portfolio value including accrued income.",
      modes: ["simple", "pro"]
    },
    {
      label: "Net Return %",
      value: `${netReturn >= 0 ? '+' : ''}${netReturnPercentage}%`,
      numericValue: parseFloat(netReturnPercentage),
      sublabel: "Total return",
      icon: Percent,
      tooltip: "(Current Value + Distributions − Total Invested) ÷ Total Invested.",
      modes: ["simple", "pro"]
    },
    {
      label: "Unfunded Commitments",
      value: formatCurrency(adjustedData.unfunded_commitments),
      numericValue: adjustedData.unfunded_commitments,
      sublabel: "Pending funding",
      icon: Clock,
      tooltip: "Remaining amounts you've committed but not yet funded.",
      modes: ["simple", "pro"]
    },
    {
      label: "Next Payout",
      value: adjustedData.unfunded_commitments > 0 ? `${nextPayout.date}` : "No upcoming payouts",
      numericValue: nextPayout.amount,
      sublabel: adjustedData.unfunded_commitments > 0 ? `Est. ${formatCurrency(nextPayout.amount)}` : "All caught up",
      icon: Calendar,
      tooltip: "Date and estimated amount of your next payout.",
      modes: ["simple"]
    },
    {
      label: "Total Invested",
      value: formatCurrency(adjustedData.total_invested),
      numericValue: adjustedData.total_invested,
      sublabel: "Principal contributed",
      icon: Target,
      tooltip: "Sum of all contributed principal to date.",
      modes: ["pro"]
    },
    {
      label: "MOIC",
      value: `${moic}x`,
      numericValue: parseFloat(moic),
      sublabel: "Money multiple",
      icon: Calculator,
      tooltip: "Multiple on invested capital = (Current Value + Distributions) ÷ Total Invested.",
      modes: ["pro"]
    },
    {
      label: "Portfolio IRR (XIRR)",
      value: `${portfolioIRR}%`,
      numericValue: parseFloat(portfolioIRR),
      sublabel: "Annualized return",
      icon: TrendingUp,
      tooltip: "Annualized return based on actual cashflow timing; net of fees.",
      modes: ["pro"]
    },
    {
      label: "Active Investments",
      value: adjustedData.active_investments.toString(),
      numericValue: adjustedData.active_investments,
      sublabel: "Holdings count",
      icon: Building2,
      tooltip: "Count of investments currently held.",
      modes: ["pro"]
    }
  ];

  const kpisForMode = kpiDefinitions.filter((kpi) => kpi.modes.includes(mode));

  return (
    <div className="space-y-4 overflow-visible">
      {/* KPI Cards */}
      <div
        data-mode={mode}
        className={`relative z-20 grid w-full gap-3 ${mode === "simple"
          ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5"
          : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8"
        }`}
        style={{ gridAutoRows: "1fr" }}
      >
        <TooltipProvider>
          {kpisForMode.map((kpi, index) => (
            <Card
              key={kpi.label}
              className="kpi-card border-glass-border min-h-[132px] rounded-xl bg-background/40 focus-visible:outline-none focus-visible:ring-0"
              aria-label={`${kpi.label}: ${kpi.value}`}
              aria-describedby={openTooltip === kpi.label ? `tooltip-${index}` : undefined}
            >
              <CardContent
                className={`flex h-full flex-col justify-between gap-3 ${
                  mode === "simple" ? "p-4" : "p-3"
                }`}
              >
                <div className="flex items-start justify-between">
                  <kpi.icon
                    className={`${mode === "simple" ? "h-5 w-5" : "h-4 w-4"} text-primary`}
                    aria-hidden="true"
                  />
                  <Tooltip
                    open={openTooltip === kpi.label}
                    onOpenChange={(open) => {
                      setOpenTooltip(open ? kpi.label : null);
                      if (open) dashboardAnalytics.kpiTooltipOpened(kpi.label);
                    }}
                  >
                    <TooltipTrigger asChild>
                      <button
                        className="rounded-full p-1 text-muted-foreground transition-colors hover:text-primary focus:outline-none focus-visible:ring-0"
                        aria-label={`Information about ${kpi.label}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          setOpenTooltip(openTooltip === kpi.label ? null : kpi.label);
                          dashboardAnalytics.kpiTooltipOpened(kpi.label);
                        }}
                      >
                        <Info className={`${mode === "simple" ? "h-3.5 w-3.5" : "h-3 w-3"}`} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent id={`tooltip-${index}`}>
                      <p className="max-w-xs text-xs leading-relaxed">{kpi.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                <div className={`space-y-1.5 ${mode === "simple" ? "text-left" : "text-left"}`}>
                  <div
                    className={`font-semibold leading-tight text-primary ${
                      mode === "simple" ? "text-lg" : "text-base"
                    }`}
                  >
                    <AnimatedCounter
                      value={kpi.numericValue || 0}
                      formatFn={() => kpi.value}
                      aria-label={`${kpi.label}: ${kpi.value}`}
                    />
                  </div>
                  <div
                    className={`font-semibold uppercase tracking-wide text-foreground ${
                      mode === "simple" ? "text-xs" : "text-[11px]"
                    }`}
                  >
                    {kpi.label}
                  </div>
                  <div className="text-[10px] text-muted-foreground">{kpi.sublabel}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TooltipProvider>
      </div>
    </div>
  );
}
