import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Building2, 
  TrendingUp, 
  Calendar, 
  MapPin, 
  FileText, 
  Download,
  MessageSquare,
  DollarSign,
  Percent,
  Target
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Investment {
  id: string;
  properties: {
    title: string;
    sponsor?: string;
    property_type: string;
    address?: string;
    city?: string;
    images?: string[];
    description?: string;
  };
  amount_invested: number;
  current_value: number;
  total_returns: number;
  investment_status: string;
  shares_owned: number;
  investment_date: string;
}

interface PositionDetailDrawerProps {
  investment: Investment | null;
  isOpen: boolean;
  onClose: () => void;
  currency: string;
}

export function PositionDetailDrawer({ investment, isOpen, onClose, currency }: PositionDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState("overview");

  if (!investment) return null;

  const formatCurrency = (amount: number) => {
    const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£';
    return `${symbol}${amount.toLocaleString()}`;
  };

  // Mock data for charts and other details
  const performanceData = [
    { date: '2023-01', value: investment.amount_invested },
    { date: '2023-02', value: investment.amount_invested * 1.02 },
    { date: '2023-03', value: investment.amount_invested * 1.05 },
    { date: '2023-04', value: investment.amount_invested * 1.08 },
    { date: '2023-05', value: investment.amount_invested * 1.12 },
    { date: '2023-06', value: investment.current_value },
  ];

  const distributions = [
    { date: '2023-12-15', amount: 1250, type: 'Income' },
    { date: '2023-09-15', amount: 1100, type: 'Income' },
    { date: '2023-06-15', amount: 1200, type: 'Income' },
    { date: '2023-03-15', amount: 850, type: 'Return of Capital' },
  ];

  const documents = [
    { name: 'Q4 2023 Financial Statement', date: '2023-12-31', type: 'Statement' },
    { name: 'K-1 Tax Document', date: '2023-12-31', type: 'Tax' },
    { name: 'Annual Report 2023', date: '2023-12-31', type: 'Report' },
    { name: 'Operating Agreement', date: '2023-01-15', type: 'Legal' },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="gradient-text">{investment.properties.title}</SheetTitle>
          <SheetDescription>
            {investment.properties.sponsor} • {investment.properties.property_type}
          </SheetDescription>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="distributions">Distributions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <Card className="glass-card border-glass-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Key Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Cost Basis</div>
                  <div className="text-xl font-bold">{formatCurrency(investment.amount_invested)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Current Value</div>
                  <div className="text-xl font-bold">{formatCurrency(investment.current_value)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total Returns</div>
                  <div className={`text-xl font-bold ${investment.total_returns >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(investment.total_returns)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Shares Owned</div>
                  <div className="text-xl font-bold">{investment.shares_owned.toLocaleString()}</div>
                </div>
              </CardContent>
            </Card>

            {/* Property Details */}
            <Card className="glass-card border-glass-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Property Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {investment.properties.images?.[0] && (
                  <img 
                    src={investment.properties.images[0]} 
                    alt={investment.properties.title}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Type</div>
                    <div className="capitalize">{investment.properties.property_type}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Status</div>
                    <Badge>{investment.investment_status}</Badge>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Investment Date</div>
                    <div>{new Date(investment.investment_date).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Location</div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {investment.properties.city}
                    </div>
                  </div>
                </div>
                {investment.properties.description && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Description</div>
                    <p className="text-sm">{investment.properties.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button className="flex-1">
                <DollarSign className="h-4 w-4 mr-2" />
                Fund More
              </Button>
              <Button variant="outline" className="flex-1">
                <MessageSquare className="h-4 w-4 mr-2" />
                Contact Sponsor
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            {/* Performance Chart */}
            <Card className="glass-card border-glass-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Value Over Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickFormatter={(value) => formatCurrency(value)}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: 'hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: any) => [formatCurrency(value), 'Value']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="glass-card border-glass-border">
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Net Return %</div>
                  <div className="text-2xl font-bold text-green-400">
                    {((investment.total_returns / investment.amount_invested) * 100).toFixed(2)}%
                  </div>
                </CardContent>
              </Card>
              <Card className="glass-card border-glass-border">
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">IRR</div>
                  <div className="text-2xl font-bold">12.5%</div>
                </CardContent>
              </Card>
              <Card className="glass-card border-glass-border">
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">MOIC</div>
                  <div className="text-2xl font-bold">1.18x</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="distributions" className="space-y-6">
            {/* Next Payout */}
            <Card className="glass-card border-glass-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Next Payout
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-2xl font-bold">{formatCurrency(1350)}</div>
                    <div className="text-sm text-muted-foreground">Expected March 15, 2024</div>
                  </div>
                  <Badge>Scheduled</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Distribution History */}
            <Card className="glass-card border-glass-border">
              <CardHeader>
                <CardTitle>Distribution History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {distributions.map((dist, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-border/50">
                      <div>
                        <div className="font-medium">{formatCurrency(dist.amount)}</div>
                        <div className="text-sm text-muted-foreground">{dist.type}</div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(dist.date).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Documents */}
            <Card className="glass-card border-glass-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {documents.map((doc, index) => (
                    <div key={index} className="flex justify-between items-center py-2">
                      <div>
                        <div className="font-medium">{doc.name}</div>
                        <div className="text-sm text-muted-foreground">{doc.type}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm text-muted-foreground">
                          {new Date(doc.date).toLocaleDateString()}
                        </div>
                        <Button size="sm" variant="ghost">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}