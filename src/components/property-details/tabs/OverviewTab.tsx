import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  AlertTriangle, 
  Building2, 
  Users, 
  Calendar,
  MapPin,
  TrendingUp,
  Shield
} from 'lucide-react';

interface OverviewTabProps {
  property: any;
}

export function OverviewTab({ property }: OverviewTabProps) {
  const investmentThesis = [
    "Prime location in high-growth suburban market with limited new supply",
    "Value-add opportunity through unit renovations and operational improvements",
    "Strong demographic trends with growing household income and population"
  ];

  const businessPlan = {
    strategy: "Value-Add Multifamily",
    timeline: "18-24 months",
    keyItems: [
      "Acquire stabilized asset at attractive basis",
      "Execute $2.2M capital improvement program",
      "Implement revenue management and operational efficiencies",
      "Refinance or sell at stabilized NOI and improved market conditions"
    ]
  };

  const propertySpecs = {
    units: 84,
    totalSF: "92,400 SF",
    yearBuilt: 1985,
    lastRenovation: 2019,
    class: "B+",
    occupancy: "94%",
    avgRentPerSF: "$1.85",
    avgUnitSize: "1,100 SF"
  };

  const highlights = [
    { text: "Institutional quality asset in prime suburban location", checked: true },
    { text: "Strong in-place NOI with upside through renovations", checked: true },
    { text: "Experienced operator with 15+ years track record", checked: true },
    { text: "Conservative 65% LTV financing at attractive rates", checked: true },
    { text: "Multiple exit strategies including refinance or sale", checked: true },
    { text: "Quarterly distributions starting Year 1", checked: true }
  ];

  const keyRisks = [
    {
      risk: "Market Softening",
      description: "Local rental market conditions could deteriorate",
      mitigation: "Conservative underwriting with 5% rent growth vs 8% market average"
    },
    {
      risk: "Construction Cost Overruns",
      description: "Renovation costs could exceed budget",
      mitigation: "Fixed-price GC contract with 10% contingency built in"
    },
    {
      risk: "Interest Rate Risk",
      description: "Rising rates could impact refinancing",
      mitigation: "Floating rate debt with 2% cap, multiple exit strategies"
    },
    {
      risk: "Lease-Up Risk",
      description: "Slower lease-up of renovated units",
      mitigation: "Staggered renovation schedule maintains cash flow stability"
    },
    {
      risk: "Sponsor Risk",
      description: "Key personnel departure or execution issues",
      mitigation: "Deep management team, co-investment alignment, proven track record"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Investment Thesis */}
      <Card className="glass-card border-glass-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Investment Thesis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {investmentThesis.map((point, index) => (
            <div key={index} className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 shrink-0" />
              <p className="text-sm">{point}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Business Plan */}
      <Card className="glass-card border-glass-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Business Plan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 mb-4">
            <Badge variant="outline" className="glass border-glass-border">
              {businessPlan.strategy}
            </Badge>
            <Badge variant="outline" className="glass border-glass-border">
              {businessPlan.timeline}
            </Badge>
          </div>
          
          <div className="space-y-3">
            {businessPlan.keyItems.map((item, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-medium mt-0.5">
                  {index + 1}
                </div>
                <p className="text-sm">{item}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Property Specifications */}
      <Card className="glass-card border-glass-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Property Specifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 glass rounded-lg">
              <div className="text-2xl font-bold text-primary">{propertySpecs.units}</div>
              <div className="text-sm text-muted-foreground">Units</div>
            </div>
            <div className="text-center p-3 glass rounded-lg">
              <div className="text-2xl font-bold text-primary">{propertySpecs.totalSF}</div>
              <div className="text-sm text-muted-foreground">Total SF</div>
            </div>
            <div className="text-center p-3 glass rounded-lg">
              <div className="text-2xl font-bold text-primary">{propertySpecs.yearBuilt}</div>
              <div className="text-sm text-muted-foreground">Year Built</div>
            </div>
            <div className="text-center p-3 glass rounded-lg">
              <div className="text-2xl font-bold text-primary">{propertySpecs.class}</div>
              <div className="text-sm text-muted-foreground">Asset Class</div>
            </div>
            <div className="text-center p-3 glass rounded-lg">
              <div className="text-2xl font-bold text-primary">{propertySpecs.occupancy}</div>
              <div className="text-sm text-muted-foreground">Occupancy</div>
            </div>
            <div className="text-center p-3 glass rounded-lg">
              <div className="text-2xl font-bold text-primary">{propertySpecs.avgRentPerSF}</div>
              <div className="text-sm text-muted-foreground">Rent/SF</div>
            </div>
            <div className="text-center p-3 glass rounded-lg">
              <div className="text-2xl font-bold text-primary">{propertySpecs.avgUnitSize}</div>
              <div className="text-sm text-muted-foreground">Avg Unit Size</div>
            </div>
            <div className="text-center p-3 glass rounded-lg">
              <div className="text-2xl font-bold text-primary">{propertySpecs.lastRenovation}</div>
              <div className="text-sm text-muted-foreground">Last Reno</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Property Photos Grid */}
      <Card className="glass-card border-glass-border">
        <CardHeader>
          <CardTitle>Property Photos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Investment Highlights */}
      <Card className="glass-card border-glass-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-400" />
            Investment Highlights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {highlights.map((highlight, index) => (
              <div key={index} className="flex items-center gap-3 p-3 glass rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />
                <span className="text-sm">{highlight.text}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* What Could Go Wrong */}
      <Card className="glass-card border-glass-border border-yellow-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-400">
            <AlertTriangle className="h-5 w-5" />
            What Could Go Wrong?
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Key risks and our mitigation strategies
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {keyRisks.map((item, index) => (
            <div key={index} className="p-4 border border-yellow-500/20 rounded-lg bg-yellow-500/5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5 shrink-0" />
                <div className="space-y-2">
                  <div className="font-medium text-yellow-400">{item.risk}</div>
                  <div className="text-sm text-muted-foreground">{item.description}</div>
                  <div className="text-sm">
                    <span className="text-green-400 font-medium">Mitigation: </span>
                    {item.mitigation}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}