import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Building2, 
  TrendingUp, 
  Users, 
  Calendar, 
  DollarSign,
  Award,
  Clock,
  Target,
  Star,
  ExternalLink
} from 'lucide-react';

interface SponsorTabProps {
  property: any;
}

export function SponsorTab({ property }: SponsorTabProps) {
  const sponsorProfile = {
    name: 'Premium Real Estate Partners',
    founded: 2009,
    headquarters: 'New York, NY',
    aum: 2100000000, // $2.1B
    totalDeals: 47,
    activePlatformDeals: 12,
    avgResponseTime: '< 24 hours',
    description: 'Premium Real Estate Partners is a leading real estate investment and development firm specializing in value-add multifamily and mixed-use properties across primary and secondary markets in the United States.'
  };

  const trackRecord = {
    realizedDeals: 23,
    realizedIRR: 18.4,
    realizedEM: 2.1,
    unrealizedDeals: 24,
    unrealizedIRR: 16.8,
    unrealizedEM: 1.8,
    totalInvested: 890000000,
    totalReturned: 1670000000
  };

  const keyPeople = [
    {
      name: 'Michael Rodriguez',
      title: 'Managing Partner & CEO',
      experience: '20+ years',
      education: 'MBA Wharton, BS Civil Engineering',
      bio: 'Michael founded Premium Real Estate in 2009 and has overseen over $2.1B in real estate transactions. Prior experience includes senior roles at Blackstone Real Estate and Goldman Sachs.',
      specialties: ['Acquisitions', 'Capital Markets', 'Strategy']
    },
    {
      name: 'Sarah Chen',
      title: 'Partner & Head of Asset Management',
      experience: '15+ years',
      education: 'MBA Stanford, BA Economics',
      bio: 'Sarah leads all asset management and value creation initiatives. Previously served as VP at Starwood Capital and analyst at Morgan Stanley Real Estate.',
      specialties: ['Asset Management', 'Operations', 'Value Creation']
    },
    {
      name: 'David Thompson',
      title: 'Partner & Head of Development',
      experience: '18+ years',
      education: 'MS Construction Management, BS Architecture',
      bio: 'David oversees all construction and development projects with a focus on cost control and quality delivery. Former VP at Related Companies.',
      specialties: ['Development', 'Construction', 'Project Management']
    }
  ];

  const platformDeals = [
    { 
      name: 'Riverside Gardens',
      location: 'Atlanta, GA',
      type: 'Multifamily',
      status: 'Stabilized',
      irr: 19.2,
      em: 2.3,
      year: 2022
    },
    { 
      name: 'Metro Commons',
      location: 'Austin, TX',
      type: 'Mixed-Use',
      status: 'Active',
      irr: 16.8,
      em: 1.9,
      year: 2023
    },
    { 
      name: 'Park Avenue Residences',
      location: 'Charlotte, NC',
      type: 'Multifamily',
      status: 'Sold',
      irr: 21.5,
      em: 2.4,
      year: 2021
    },
    { 
      name: 'Downtown Lofts',
      location: 'Nashville, TN',
      type: 'Multifamily',
      status: 'Active',
      irr: 15.3,
      em: 1.7,
      year: 2023
    }
  ];

  const alignment = {
    coInvestment: 15, // 15% of the deal
    skinInTheGame: 1275000, // $1.275M
    keyManClause: true,
    clawbackProvision: true,
    performanceMetrics: [
      'Minimum 12% IRR hurdle for promote',
      'Asset management fee waived if IRR < 10%',
      'Clawback provision for underperformance'
    ]
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Sold':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Active':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Stabilized':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-muted';
    }
  };

  return (
    <div className="space-y-8">
      {/* Sponsor Overview */}
      <Card className="glass-card border-glass-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {sponsorProfile.name}
            </CardTitle>
            <div className="flex gap-2">
              <Badge variant="outline" className="glass border-glass-border">
                <Star className="h-3 w-3 mr-1 text-yellow-400" />
                Preferred Sponsor
              </Badge>
              <Button variant="outline" size="sm" className="glass border-glass-border">
                <ExternalLink className="h-4 w-4 mr-2" />
                Visit Website
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground leading-relaxed">
            {sponsorProfile.description}
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 glass rounded-lg">
              <Calendar className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-sm text-muted-foreground">Founded</div>
              <div className="font-semibold">{sponsorProfile.founded}</div>
            </div>
            <div className="text-center p-3 glass rounded-lg">
              <DollarSign className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-sm text-muted-foreground">AUM</div>
              <div className="font-semibold">${(sponsorProfile.aum / 1000000000).toFixed(1)}B</div>
            </div>
            <div className="text-center p-3 glass rounded-lg">
              <Building2 className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-sm text-muted-foreground">Total Deals</div>
              <div className="font-semibold">{sponsorProfile.totalDeals}</div>
            </div>
            <div className="text-center p-3 glass rounded-lg">
              <Clock className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-sm text-muted-foreground">Response Time</div>
              <div className="font-semibold">{sponsorProfile.avgResponseTime}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Track Record */}
      <Card className="glass-card border-glass-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Investment Track Record
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Realized Investments */}
            <div className="space-y-4">
              <h3 className="font-semibold text-green-400 flex items-center gap-2">
                <Award className="h-4 w-4" />
                Realized Investments
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 glass rounded-lg">
                  <div className="text-2xl font-bold text-green-400">
                    {trackRecord.realizedIRR}%
                  </div>
                  <div className="text-sm text-muted-foreground">Avg IRR</div>
                </div>
                <div className="text-center p-3 glass rounded-lg">
                  <div className="text-2xl font-bold text-green-400">
                    {trackRecord.realizedEM}x
                  </div>
                  <div className="text-sm text-muted-foreground">Avg EM</div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">
                  {trackRecord.realizedDeals} deals completed
                </div>
              </div>
            </div>

            {/* Unrealized Investments */}
            <div className="space-y-4">
              <h3 className="font-semibold text-blue-400 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Current Portfolio
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 glass rounded-lg">
                  <div className="text-2xl font-bold text-blue-400">
                    {trackRecord.unrealizedIRR}%
                  </div>
                  <div className="text-sm text-muted-foreground">Projected IRR</div>
                </div>
                <div className="text-center p-3 glass rounded-lg">
                  <div className="text-2xl font-bold text-blue-400">
                    {trackRecord.unrealizedEM}x
                  </div>
                  <div className="text-sm text-muted-foreground">Projected EM</div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">
                  {trackRecord.unrealizedDeals} active investments
                </div>
              </div>
            </div>
          </div>

          <Separator className="bg-glass-border" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center p-4 glass rounded-lg">
              <div className="text-xl font-bold text-primary">
                ${(trackRecord.totalInvested / 1000000000).toFixed(1)}B
              </div>
              <div className="text-sm text-muted-foreground">Total Invested</div>
            </div>
            <div className="text-center p-4 glass rounded-lg">
              <div className="text-xl font-bold text-green-400">
                ${(trackRecord.totalReturned / 1000000000).toFixed(1)}B
              </div>
              <div className="text-sm text-muted-foreground">Total Returned</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Personnel */}
      <Card className="glass-card border-glass-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Key Personnel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {keyPeople.map((person, index) => (
            <div key={index} className="p-4 glass rounded-lg space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-lg">{person.name}</h3>
                  <p className="text-primary font-medium">{person.title}</p>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <div>{person.experience}</div>
                  <div>{person.education}</div>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground leading-relaxed">
                {person.bio}
              </p>
              
              <div className="flex gap-2 flex-wrap">
                {person.specialties.map((specialty, idx) => (
                  <Badge key={idx} variant="outline" className="glass border-glass-border text-xs">
                    {specialty}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Platform Deals */}
      <Card className="glass-card border-glass-border">
        <CardHeader>
          <CardTitle>Recent Platform Deals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-glass-border">
                  <th className="text-left py-2">Property</th>
                  <th className="text-left py-2">Location</th>
                  <th className="text-left py-2">Type</th>
                  <th className="text-center py-2">Status</th>
                  <th className="text-right py-2">IRR</th>
                  <th className="text-right py-2">EM</th>
                  <th className="text-right py-2">Year</th>
                </tr>
              </thead>
              <tbody>
                {platformDeals.map((deal, index) => (
                  <tr key={index} className="border-b border-glass-border/50">
                    <td className="py-3 font-medium">{deal.name}</td>
                    <td className="py-3">{deal.location}</td>
                    <td className="py-3">{deal.type}</td>
                    <td className="py-3 text-center">
                      <Badge className={getStatusColor(deal.status)} variant="outline">
                        {deal.status}
                      </Badge>
                    </td>
                    <td className="text-right py-3 font-medium text-primary">
                      {deal.irr}%
                    </td>
                    <td className="text-right py-3 font-medium text-primary">
                      {deal.em}x
                    </td>
                    <td className="text-right py-3">{deal.year}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Alignment & Skin in the Game */}
      <Card className="glass-card border-glass-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Sponsor Alignment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 glass rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {alignment.coInvestment}%
              </div>
              <div className="text-sm text-muted-foreground">Co-Investment</div>
              <div className="text-xs text-muted-foreground mt-1">
                ${alignment.skinInTheGame.toLocaleString()} invested
              </div>
            </div>
            
            <div className="text-center p-4 glass rounded-lg">
              <div className="text-2xl font-bold text-green-400">
                {alignment.keyManClause ? 'Yes' : 'No'}
              </div>
              <div className="text-sm text-muted-foreground">Key-Man Clause</div>
              <div className="text-xs text-muted-foreground mt-1">
                Protection if key personnel leave
              </div>
            </div>
            
            <div className="text-center p-4 glass rounded-lg">
              <div className="text-2xl font-bold text-blue-400">
                {alignment.clawbackProvision ? 'Yes' : 'No'}
              </div>
              <div className="text-sm text-muted-foreground">Clawback Provision</div>
              <div className="text-xs text-muted-foreground mt-1">
                GP returns capital if underperforming
              </div>
            </div>
          </div>

          <Separator className="bg-glass-border" />

          <div>
            <h3 className="font-semibold mb-3">Performance Incentives</h3>
            <div className="space-y-2">
              {alignment.performanceMetrics.map((metric, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span className="text-sm">{metric}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}