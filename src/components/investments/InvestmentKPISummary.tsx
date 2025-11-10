import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import {
  Calculator,
  DollarSign,
  Home,
  Info,
  Percent,
  PiggyBank,
  TrendingUp
} from "lucide-react";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { analytics } from "@/utils/analytics";

interface KPIData {
  totalInvested: number;
  currentValue: number;
  netReturnPercent: number;
  dpi: number;
  tvpi: number;
  irr: number;
  incomeYTD: number;
  propertiesCount: number;
}

interface InvestmentKPISummaryProps {
  data: KPIData;
  currency: string;
}

const tooltips = {
  totalInvested: "Sum of all contributed principal to date.",
  currentValue: "Estimated current portfolio value including accrued income.",
  netReturnPercent: "(Current Value + Distributions − Total Invested) ÷ Total Invested.",
  dpi: "Distributions to Paid-In Capital = Total Distributions ÷ Total Invested.",
  tvpi: "Total Value to Paid-In Capital = (Current Value + Distributions) ÷ Total Invested.",
  irr: "Annualized return based on actual cashflow timing; net of fees.",
  incomeYTD: "Total distributions and income received year-to-date.",
  propertiesCount: "Number of active property investments in portfolio."
};

export function InvestmentKPISummary({ data, currency }: InvestmentKPISummaryProps) {
  const formatCurrency = (amount: number) => {
    const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£';
    return `${symbol}${amount.toLocaleString()}`;
  };

  const kpis = [
    {
      title: "Total Invested",
      value: data.totalInvested,
      format: "currency",
      tooltip: tooltips.totalInvested,
      key: "totalInvested",
      sublabel: "Principal contributed",
      icon: DollarSign
    },
    {
      title: "Current Value",
      value: data.currentValue,
      format: "currency",
      tooltip: tooltips.currentValue,
      key: "currentValue",
      sublabel: "Portfolio value",
      icon: TrendingUp
    },
    {
      title: "Net Return %",
      value: data.netReturnPercent,
      format: "percentage",
      tooltip: tooltips.netReturnPercent,
      key: "netReturnPercent",
      sublabel: "Total return",
      icon: Percent
    },
    {
      title: "DPI",
      value: data.dpi,
      format: "ratio",
      tooltip: tooltips.dpi,
      key: "dpi",
      sublabel: "Distributions multiple",
      icon: PiggyBank
    },
    {
      title: "TVPI",
      value: data.tvpi,
      format: "ratio",
      tooltip: tooltips.tvpi,
      key: "tvpi",
      sublabel: "Value multiple",
      icon: Calculator
    },
    {
      title: "IRR (XIRR)",
      value: data.irr,
      format: "percentage",
      tooltip: tooltips.irr,
      key: "irr",
      sublabel: "Annualized return",
      icon: TrendingUp
    },
    {
      title: "Income YTD",
      value: data.incomeYTD,
      format: "currency",
      tooltip: tooltips.incomeYTD,
      key: "incomeYTD",
      sublabel: "Received this year",
      icon: DollarSign
    },
    {
      title: "# of Properties",
      value: data.propertiesCount,
      format: "number",
      tooltip: tooltips.propertiesCount,
      key: "propertiesCount",
      sublabel: "Active holdings",
      icon: Home
    }
  ];

  const formatValue = (value: number, format: string) => {
    switch (format) {
      case "currency":
        return formatCurrency(value);
      case "percentage":
        return `${value.toFixed(2)}%`;
      case "ratio":
        return `${value.toFixed(2)}x`;
      case "number":
        return value.toString();
      default:
        return value.toString();
    }
  };

  return (
    <TooltipProvider>
      <div
        data-mode="pro"
        className="relative grid w-full gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-8"
        style={{ gridAutoRows: "1fr" }}
      >
        {kpis.map((kpi) => (
          <div key={kpi.key} className="kpiCard-wrap h-full" style={{ zIndex: 1 }}>
            <Card className="kpi-card border-glass-border h-full min-h-[132px] rounded-xl bg-background/40 focus-visible:outline-none focus-visible:ring-0">
              <CardContent className="flex h-full flex-col justify-between gap-3 p-4">
                <div className="flex items-start justify-between">
                  <kpi.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  <Tooltip>
                    <TooltipTrigger
                      asChild
                      onFocus={() => analytics.track("kpi_tooltip_opened", { kpi: kpi.key })}
                      onClick={() => analytics.track("kpi_tooltip_opened", { kpi: kpi.key })}
                    >
                      <button className="rounded-full p-1 text-muted-foreground transition-colors hover:text-primary focus:outline-none focus-visible:ring-0">
                        <Info className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-xs leading-relaxed">{kpi.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="space-y-1.5 text-left">
                  <div
                    className="text-lg font-semibold leading-tight text-primary"
                    aria-label={`${kpi.title}: ${formatValue(kpi.value, kpi.format)}`}
                  >
                    {kpi.format === "currency" || kpi.format === "number" ? (
                      <AnimatedCounter
                        value={kpi.value}
                        formatFn={
                          kpi.format === "currency"
                            ? (val: number) => formatCurrency(val)
                            : (val: number) => val.toString()
                        }
                      />
                    ) : (
                      formatValue(kpi.value, kpi.format)
                    )}
                  </div>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-foreground">
                    {kpi.title}
                  </div>
                  <div className="text-[10px] text-muted-foreground">{kpi.sublabel}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </TooltipProvider>
  );
}
