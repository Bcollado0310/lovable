import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  Download, 
  DollarSign, 
  PieChart,
  BarChart3,
  Settings2
} from 'lucide-react';

interface FinancialsTabProps {
  property: any;
}

export function FinancialsTab({ property }: FinancialsTabProps) {
  const [exitCapSensitivity, setExitCapSensitivity] = useState([0]);
  const [rentGrowthSensitivity, setRentGrowthSensitivity] = useState([0]);

  const sourcesUses = {
    sources: [
      { item: 'Equity Raise', amount: 8500000 },
      { item: 'Senior Debt', amount: 16900000 },
      { item: 'Total Sources', amount: 25400000, isTotal: true }
    ],
    uses: [
      { item: 'Purchase Price', amount: 23800000 },
      { item: 'Closing Costs', amount: 476000 },
      { item: 'Capital Improvements', amount: 2200000 },
      { item: 'Financing Costs', amount: 338000 },
      { item: 'Operating Reserves', amount: 500000 },
      { item: 'Total Uses', amount: 27314000, isTotal: true }
    ]
  };

  const proForma = [
    { 
      year: 'Year 1', 
      grossIncome: 2890000, 
      noi: 2023000, 
      cashFlow: 1245000,
      distributions: 850000,
      irr: 8.2 
    },
    { 
      year: 'Year 2', 
      grossIncome: 3125000, 
      noi: 2187500, 
      cashFlow: 1346250,
      distributions: 918750,
      irr: 12.4 
    },
    { 
      year: 'Year 3', 
      grossIncome: 3375000, 
      noi: 2362500, 
      cashFlow: 1453125,
      distributions: 991875,
      irr: 15.8 
    },
    { 
      year: 'Exit (Y4)', 
      grossIncome: 3645000, 
      noi: 2551500, 
      cashFlow: 15300000,
      distributions: 10455000,
      irr: 18.2 
    }
  ];

  const waterfall = [
    { tier: 'Preferred Return (8%)', lpShare: 100, gpShare: 0, amount: 2040000 },
    { tier: 'Return of Capital', lpShare: 100, gpShare: 0, amount: 8500000 },
    { tier: 'Catch-Up (to 20% promote)', lpShare: 60, gpShare: 40, amount: 510000 },
    { tier: 'Remaining Cash Flow', lpShare: 80, gpShare: 20, amount: 4250000 }
  ];

  const fees = [
    { type: 'Acquisition Fee', rate: '1.5%', amount: 357000, timing: 'At Close' },
    { type: 'Asset Management', rate: '1.0% NOI', amount: 25515, timing: 'Annual' },
    { type: 'Disposition Fee', rate: '1.0%', amount: 340000, timing: 'At Sale' }
  ];

  const debtSummary = {
    lender: 'First National Bank',
    amount: 16900000,
    rate: '4.75%',
    term: '5 years',
    amortization: '25 years',
    ltv: '65%',
    dscr: 1.35,
    covenants: ['Min DSCR 1.25x', 'Max LTV 70%', 'Quarterly reporting']
  };

  return (
    <div className="space-y-8">
      {/* Sensitivity Analysis Controls */}
      <Card className="glass-card border-glass-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            Sensitivity Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Exit Cap Rate Adjustment</span>
                <Badge variant="outline" className="glass">
                  {exitCapSensitivity[0] > 0 ? '+' : ''}{exitCapSensitivity[0]} bps
                </Badge>
              </div>
              <Slider
                value={exitCapSensitivity}
                onValueChange={setExitCapSensitivity}
                min={-100}
                max={100}
                step={25}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>-100 bps</span>
                <span>Base Case</span>
                <span>+100 bps</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Rent Growth Adjustment</span>
                <Badge variant="outline" className="glass">
                  {rentGrowthSensitivity[0] > 0 ? '+' : ''}{rentGrowthSensitivity[0]}%
                </Badge>
              </div>
              <Slider
                value={rentGrowthSensitivity}
                onValueChange={setRentGrowthSensitivity}
                min={-5}
                max={5}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>-5%</span>
                <span>Base Case</span>
                <span>+5%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card border-glass-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Projected Value & Cash Yield
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-muted/10 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-glass-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              Cash Flow by Year
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-muted/10 rounded-lg flex items-center justify-center">
              <PieChart className="h-12 w-12 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sources-uses" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sources-uses">Sources & Uses</TabsTrigger>
          <TabsTrigger value="proforma">Pro Forma</TabsTrigger>
          <TabsTrigger value="waterfall">Waterfall & Fees</TabsTrigger>
          <TabsTrigger value="debt">Debt Summary</TabsTrigger>
        </TabsList>

        {/* Sources & Uses */}
        <TabsContent value="sources-uses" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-card border-glass-border">
              <CardHeader>
                <CardTitle>Sources of Capital</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sourcesUses.sources.map((item, index) => (
                    <div key={index} className={`flex justify-between py-2 ${item.isTotal ? 'border-t border-glass-border pt-3 font-semibold' : ''}`}>
                      <span>{item.item}</span>
                      <span>${item.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-glass-border">
              <CardHeader>
                <CardTitle>Uses of Capital</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sourcesUses.uses.map((item, index) => (
                    <div key={index} className={`flex justify-between py-2 ${item.isTotal ? 'border-t border-glass-border pt-3 font-semibold' : ''}`}>
                      <span>{item.item}</span>
                      <span>${item.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Pro Forma */}
        <TabsContent value="proforma">
          <Card className="glass-card border-glass-border">
            <CardHeader>
              <CardTitle>Operating Pro Forma</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-glass-border">
                      <th className="text-left py-2">Metric</th>
                      {proForma.map((year) => (
                        <th key={year.year} className="text-right py-2">{year.year}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="space-y-2">
                    <tr>
                      <td className="py-2 font-medium">Gross Income</td>
                      {proForma.map((year) => (
                        <td key={year.year} className="text-right py-2">${year.grossIncome.toLocaleString()}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2 font-medium">Net Operating Income</td>
                      {proForma.map((year) => (
                        <td key={year.year} className="text-right py-2">${year.noi.toLocaleString()}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2 font-medium">Cash Flow</td>
                      {proForma.map((year) => (
                        <td key={year.year} className="text-right py-2">${year.cashFlow.toLocaleString()}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2 font-medium">Distributions</td>
                      {proForma.map((year) => (
                        <td key={year.year} className="text-right py-2">${year.distributions.toLocaleString()}</td>
                      ))}
                    </tr>
                    <tr className="border-t border-glass-border">
                      <td className="py-2 font-semibold">IRR to Date</td>
                      {proForma.map((year) => (
                        <td key={year.year} className="text-right py-2 font-semibold text-primary">{year.irr}%</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Waterfall & Fees */}
        <TabsContent value="waterfall" className="space-y-6">
          <Card className="glass-card border-glass-border">
            <CardHeader>
              <CardTitle>Distribution Waterfall</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-glass-border">
                      <th className="text-left py-2">Tier</th>
                      <th className="text-right py-2">LP Share</th>
                      <th className="text-right py-2">GP Share</th>
                      <th className="text-right py-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {waterfall.map((tier, index) => (
                      <tr key={index}>
                        <td className="py-2">{tier.tier}</td>
                        <td className="text-right py-2">{tier.lpShare}%</td>
                        <td className="text-right py-2">{tier.gpShare}%</td>
                        <td className="text-right py-2">${tier.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-glass-border">
            <CardHeader>
              <CardTitle>Fee Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {fees.map((fee, index) => (
                  <div key={index} className="flex items-center justify-between p-3 glass rounded-lg">
                    <div>
                      <div className="font-medium">{fee.type}</div>
                      <div className="text-sm text-muted-foreground">{fee.rate} • {fee.timing}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">${fee.amount.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Debt Summary */}
        <TabsContent value="debt">
          <Card className="glass-card border-glass-border">
            <CardHeader>
              <CardTitle>Debt Structure</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Lender</div>
                    <div className="font-medium">{debtSummary.lender}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Loan Amount</div>
                    <div className="font-medium">${debtSummary.amount.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Interest Rate</div>
                    <div className="font-medium">{debtSummary.rate}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Term</div>
                    <div className="font-medium">{debtSummary.term}</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Amortization</div>
                    <div className="font-medium">{debtSummary.amortization}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">LTV</div>
                    <div className="font-medium">{debtSummary.ltv}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">DSCR</div>
                    <div className="font-medium">{debtSummary.dscr}x</div>
                  </div>
                </div>
              </div>

              <Separator className="bg-glass-border" />

              <div>
                <div className="text-sm font-medium mb-3">Loan Covenants</div>
                <div className="space-y-2">
                  {debtSummary.covenants.map((covenant, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-sm">{covenant}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Export Buttons */}
      <div className="flex gap-4">
        <Button variant="outline" className="glass border-glass-border">
          <Download className="h-4 w-4 mr-2" />
          Download Pro Forma (.xlsx)
        </Button>
        <Button variant="outline" className="glass border-glass-border">
          <Download className="h-4 w-4 mr-2" />
          Export Cashflows (.csv)
        </Button>
      </div>
    </div>
  );
}