import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TrendingUp, TrendingDown, DollarSign, Receipt, PiggyBank, Calculator, HelpCircle } from 'lucide-react';
import { AnimatedCounter } from '@/components/AnimatedCounter';

interface TransactionKPIsProps {
  transactions: any[];
  loading?: boolean;
}

export default function TransactionKPIs({ transactions, loading }: TransactionKPIsProps) {
  const kpis = useMemo(() => {
    const inflows = transactions.filter(t => 
      ['distribution_income', 'return_of_capital', 'dividend', 'interest', 'sale_proceeds', 'tax_refund'].includes(t.transaction_type)
    );
    
    const outflows = transactions.filter(t => 
      ['contribution', 'capital_call', 'withdrawal', 'fee_mgmt', 'fee_txn', 'tax_withholding'].includes(t.transaction_type)
    );
    
    const contributions = transactions.filter(t => 
      ['contribution', 'capital_call'].includes(t.transaction_type)
    );
    
    const distributions = transactions.filter(t => 
      ['distribution_income', 'return_of_capital'].includes(t.transaction_type)
    );
    
    const fees = transactions.filter(t => 
      ['fee_mgmt', 'fee_txn'].includes(t.transaction_type)
    );
    
    const taxes = transactions.filter(t => 
      ['tax_withholding', 'tax_refund'].includes(t.transaction_type)
    );

    const totalInflows = inflows.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const totalOutflows = outflows.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const totalContributions = contributions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const totalDistributions = distributions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const totalFees = fees.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const taxWithheld = taxes.reduce((sum, t) => {
      return t.transaction_type === 'tax_withholding' 
        ? sum + Math.abs(t.amount) 
        : sum - Math.abs(t.amount);
    }, 0);

    // Calculate realized gains (simplified - would need more complex logic in real app)
    const exitedInvestments = new Set(
      transactions.filter(t => t.transaction_type === 'sale_proceeds').map(t => t.investment_id)
    );
    
    const realizedGains = Array.from(exitedInvestments).reduce((total, investmentId) => {
      const investmentContributions = contributions.filter(t => t.investment_id === investmentId)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const investmentDistributions = distributions.filter(t => t.investment_id === investmentId)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const saleProceeds = transactions.filter(t => 
        t.transaction_type === 'sale_proceeds' && t.investment_id === investmentId
      ).reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      return total + (investmentDistributions + saleProceeds - investmentContributions);
    }, 0);

    return {
      netCashFlow: totalInflows - totalOutflows,
      totalContributions,
      totalDistributions,
      totalFees,
      realizedGains,
      taxesWithheld: taxWithheld
    };
  }, [transactions]);

  const kpiItems = [
    {
      label: 'Net Cash Flow',
      value: kpis.netCashFlow,
      icon: kpis.netCashFlow >= 0 ? TrendingUp : TrendingDown,
      color: kpis.netCashFlow >= 0 ? 'text-green-500' : 'text-red-500',
      bgColor: kpis.netCashFlow >= 0 ? 'bg-green-500/10' : 'bg-red-500/10',
      tooltip: 'Total money received minus total money paid out within the filtered period'
    },
    {
      label: 'Total Contributions',
      value: kpis.totalContributions,
      icon: DollarSign,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      tooltip: 'Total amount invested including initial contributions and capital calls'
    },
    {
      label: 'Total Distributions',
      value: kpis.totalDistributions,
      icon: PiggyBank,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      tooltip: 'Total income and return of capital distributions received'
    },
    {
      label: 'Total Fees',
      value: kpis.totalFees,
      icon: Receipt,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      tooltip: 'Management fees, transaction fees, and other charges'
    },
    {
      label: 'Realized Gains',
      value: kpis.realizedGains,
      icon: Calculator,
      color: kpis.realizedGains >= 0 ? 'text-green-500' : 'text-red-500',
      bgColor: kpis.realizedGains >= 0 ? 'bg-green-500/10' : 'bg-red-500/10',
      tooltip: 'Profits or losses from fully exited investments (distributions minus contributions)'
    },
    {
      label: 'Taxes Withheld',
      value: kpis.taxesWithheld,
      icon: Receipt,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      tooltip: 'Tax withholdings minus any tax refunds received'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-8 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {kpiItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <Tooltip key={item.label}>
              <TooltipTrigger asChild>
                <Card className="hover:shadow-md transition-shadow cursor-help">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-muted-foreground">{item.label}</span>
                      <div className="flex items-center gap-1">
                        <div className={`p-1.5 rounded-full ${item.bgColor}`}>
                          <Icon className={`h-3 w-3 ${item.color}`} />
                        </div>
                        <HelpCircle className="h-3 w-3 text-muted-foreground/50" />
                      </div>
                    </div>
                    <div className={`text-lg font-bold ${item.color}`}>
                      {item.value >= 0 ? '+' : ''}
                      $<AnimatedCounter 
                        value={Math.abs(item.value)} 
                        duration={1000 + index * 100}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-sm">{item.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}