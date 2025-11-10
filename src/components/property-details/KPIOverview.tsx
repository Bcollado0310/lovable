import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip-portal';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Target, 
  Percent, 
  Clock, 
  Shield, 
  Building, 
  DollarSign,
  Users,
  Info
} from 'lucide-react';

interface KPIOverviewProps {
  kpis: {
    target_irr: number;
    target_em: number;
    target_yield: number;
    hold_period: string;
    ltv: number;
    debt_rate: number;
    debt_type: string;
    io_years: number;
    risk_score: number;
    sponsor_coinvest: number;
  };
}

export function KPIOverview({ kpis }: KPIOverviewProps) {
  const kpiAccentColor = 'text-primary';

  const kpiCards = [
    {
      icon: TrendingUp,
      title: 'Target IRR',
      value: `${kpis.target_irr}%`,
      tooltip: 'Internal Rate of Return - the annualized effective return rate, taking into account the time value of money'
    },
    {
      icon: Target,
      title: 'Target Equity Multiple',
      value: `${kpis.target_em}x`,
      tooltip: 'Total distributions divided by initial investment. A 2.0x EM means you receive $2 for every $1 invested'
    },
    {
      icon: Percent,
      title: 'Target Annual Yield',
      value: `${kpis.target_yield}%`,
      tooltip: 'Expected annual cash-on-cash return from rental income and distributions'
    },
    {
      icon: Clock,
      title: 'Hold Period',
      value: kpis.hold_period,
      tooltip: 'Expected investment duration before property sale and final distribution'
    },
    {
      icon: Building,
      title: 'LTV at Close',
      value: `${kpis.ltv}%`,
      tooltip: 'Loan-to-Value ratio - the percentage of the property value financed with debt'
    },
    {
      icon: DollarSign,
      title: 'Debt Terms',
      value: `${kpis.debt_rate}% ${kpis.debt_type}`,
      subtitle: `${kpis.io_years} years IO`,
      tooltip: `Interest rate and loan type. IO = Interest Only period where only interest payments are due`
    },
    {
      icon: Shield,
      title: 'Risk Score',
      value: `${kpis.risk_score}/10`,
      tooltip: 'Proprietary risk assessment based on market, sponsor, property condition, and financial structure'
    },
    {
      icon: Users,
      title: 'Sponsor Co-Invest',
      value: `${kpis.sponsor_coinvest}%`,
      tooltip: 'Percentage of the deal the sponsor is investing their own capital - demonstrates alignment with investors'
    }
  ];

  return (
    <TooltipProvider>
      <div className="space-y-4 overflow-visible">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Key Performance Indicators</h2>
          <Badge variant="outline" className="glass border-glass-border text-xs">
            <Info className="h-3 w-3 mr-1" />
            Targets are projections, not guarantees
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-visible relative z-20 auto-rows-fr">
          {kpiCards.map((kpi, index) => (
            <div key={kpi.title} className="card-wrapper property-kpi-card h-full" style={{ zIndex: 1 }}>
              <Card 
                className="glass-card h-full border-glass-border"
                tabIndex={0}
                role="region"
                aria-label={`${kpi.title}: ${kpi.value}`}
              >
                <CardContent className="flex h-full flex-col justify-between p-4">
                  <div className="mb-3 flex items-start justify-between">
                    <kpi.icon className={`h-5 w-5 ${kpiAccentColor}`} />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          className="p-0.5"
                          aria-label={`Information about ${kpi.title}`}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                              e.currentTarget.blur();
                            }
                          }}
                        >
                          <Info className="h-4 w-4 cursor-help text-muted-foreground hover:text-primary" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs" id={`tooltip-overview-${index}`}>
                        <p className="text-sm">{kpi.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  
                  <div>
                    <div className="mb-1 text-sm text-muted-foreground">{kpi.title}</div>
                    <div className={`text-2xl font-bold ${kpiAccentColor}`}>
                      {kpi.value}
                    </div>
                    {kpi.subtitle && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        {kpi.subtitle}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="p-4 bg-muted/20 rounded-lg border border-muted/50">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Important Disclosure:</strong> All projected returns, yields, and performance metrics are estimates based on current market conditions and assumptions. 
            Actual results may vary significantly and there is no guarantee that projected returns will be achieved. 
            Real estate investments carry risks including loss of principal, illiquidity, and market volatility.
          </p>
        </div>
      </div>
    </TooltipProvider>
  );
}
