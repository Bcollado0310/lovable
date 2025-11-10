import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, AreaChart, Area, ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, startOfMonth, eachMonthOfInterval, isWithinInterval } from 'date-fns';

interface CashFlowChartProps {
  transactions: any[];
  dateRange: { start: Date; end: Date };
  loading?: boolean;
}

export default function CashFlowChart({ transactions, dateRange, loading }: CashFlowChartProps) {
  const chartData = useMemo(() => {
    // Generate months within date range
    const months = eachMonthOfInterval({
      start: startOfMonth(dateRange.start),
      end: startOfMonth(dateRange.end)
    });

    const data = months.map(month => {
      const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
      const monthInterval = { start: month, end: monthEnd };

      const monthTransactions = transactions.filter(t => 
        isWithinInterval(new Date(t.created_at), monthInterval)
      );

      const inflows = monthTransactions.filter(t => 
        ['distribution_income', 'return_of_capital', 'dividend', 'interest', 'sale_proceeds', 'tax_refund'].includes(t.transaction_type)
      ).reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const outflows = monthTransactions.filter(t => 
        ['contribution', 'capital_call', 'withdrawal', 'fee_mgmt', 'fee_txn', 'tax_withholding'].includes(t.transaction_type)
      ).reduce((sum, t) => sum + Math.abs(t.amount), 0);

      return {
        period: format(month, 'MMM yyyy'),
        month: format(month, 'yyyy-MM'),
        inflow: inflows,
        outflow: outflows,
        netFlow: inflows - outflows
      };
    });

    // Calculate running balance
    let runningBalance = 0;
    return data.map(item => {
      runningBalance += item.netFlow;
      return {
        ...item,
        runningBalance
      };
    });
  }, [transactions, dateRange]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background/95 backdrop-blur-md border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-green-500">Money In:</span>
              <span className="font-medium">${data.inflow.toLocaleString()}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-red-500">Money Out:</span>
              <span className="font-medium">-${data.outflow.toLocaleString()}</span>
            </div>
            <div className="flex justify-between gap-4 border-t pt-1">
              <span>Net Flow:</span>
              <span className={`font-medium ${data.netFlow >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {data.netFlow >= 0 ? '+' : ''}${data.netFlow.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Running Balance:</span>
              <span className={`font-medium ${data.runningBalance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                ${data.runningBalance.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Cash Flow Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 animate-pulse bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Cash Flow Over Time</CardTitle>
        <p className="text-sm text-muted-foreground">
          Running balance with monthly cash flows
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="period" 
                className="text-muted-foreground"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                className="text-muted-foreground"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Inflow/Outflow Bars */}
              <Bar 
                dataKey="inflow" 
                fill="hsl(var(--chart-2))" 
                fillOpacity={0.8}
                name="Inflows"
              />
              <Bar 
                dataKey="outflow" 
                fill="hsl(var(--chart-1))" 
                fillOpacity={0.8}
                name="Outflows"
                stackId="flow"
              />
              
              {/* Running Balance Line */}
              <Line
                type="monotone"
                dataKey="runningBalance"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                name="Running Balance"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-chart-2"></div>
            <span>Money In</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-chart-1"></div>
            <span>Money Out</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary"></div>
            <span>Running Balance</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}