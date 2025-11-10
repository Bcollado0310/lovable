import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MapPin, 
  Navigation, 
  Building2, 
  TrendingUp, 
  Users, 
  DollarSign,
  School,
  Shield,
  Car,
  Train
} from 'lucide-react';

interface LocationTabProps {
  property: any;
}

export function LocationTab({ property }: LocationTabProps) {
  const [activeLayer, setActiveLayer] = useState('overview');

  const locationData = {
    coordinates: { lat: 40.7589, lng: -73.9851 },
    neighborhood: 'Midtown West',
    walkScore: 92,
    transitScore: 85,
    bikeScore: 78
  };

  const comps = [
    { 
      name: 'Riverside Apartments', 
      distance: '0.3 mi', 
      rent: '$2,850', 
      year: 2019,
      units: 76,
      occupancy: '96%'
    },
    { 
      name: 'Park View Residences', 
      distance: '0.5 mi', 
      rent: '$2,720', 
      year: 2021,
      units: 92,
      occupancy: '94%'
    },
    { 
      name: 'Metropolitan Heights', 
      distance: '0.7 mi', 
      rent: '$2,980', 
      year: 2018,
      units: 124,
      occupancy: '97%'
    },
    { 
      name: 'Garden Court', 
      distance: '0.8 mi', 
      rent: '$2,650', 
      year: 2020,
      units: 68,
      occupancy: '93%'
    }
  ];

  const marketStats = [
    { metric: 'Population Growth (5Y)', value: '+12.3%', trend: 'up', source: 'US Census' },
    { metric: 'Median HH Income', value: '$78,500', trend: 'up', source: 'ACS 2023' },
    { metric: 'Unemployment Rate', value: '3.2%', trend: 'down', source: 'BLS' },
    { metric: 'Rental Vacancy', value: '4.1%', trend: 'down', source: 'Local MLS' },
    { metric: 'New Supply (2024)', value: '487 units', trend: 'neutral', source: 'CoStar' },
    { metric: 'Rent Growth (1Y)', value: '+4.2%', trend: 'up', source: 'RentData' }
  ];

  const pointsOfInterest = [
    { category: 'Transportation', items: ['Metro Station (0.2 mi)', 'Bus Stop (0.1 mi)', 'Highway Access (0.8 mi)'] },
    { category: 'Shopping', items: ['Grocery Store (0.3 mi)', 'Shopping Center (0.5 mi)', 'Pharmacy (0.2 mi)'] },
    { category: 'Dining', items: ['Restaurants (0.1 mi)', 'Coffee Shops (0.2 mi)', 'Fast Food (0.1 mi)'] },
    { category: 'Recreation', items: ['City Park (0.4 mi)', 'Fitness Center (0.3 mi)', 'Library (0.6 mi)'] },
    { category: 'Healthcare', items: ['Hospital (1.2 mi)', 'Urgent Care (0.7 mi)', 'Dentist (0.4 mi)'] },
    { category: 'Education', items: ['Elementary School (0.5 mi)', 'High School (0.8 mi)', 'University (2.1 mi)'] }
  ];

  const neighborhoodSnapshot = {
    crimeIndex: 78, // Higher is safer
    schoolRating: '8/10',
    walkability: 'Very Walkable',
    publicTransit: 'Excellent',
    demographics: {
      medianAge: 34,
      collegeGraduates: '72%',
      familyHouseholds: '45%'
    }
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <TrendingUp className="h-3 w-3 text-green-400" />;
    if (trend === 'down') return <TrendingUp className="h-3 w-3 text-red-400 rotate-180" />;
    return <div className="h-3 w-3" />;
  };

  const getCrimeColor = (index: number) => {
    if (index >= 80) return 'text-green-400';
    if (index >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-8">
      {/* Interactive Map */}
      <Card className="glass-card border-glass-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Property Location & Area Map
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant={activeLayer === 'overview' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveLayer('overview')}
                className="glass border-glass-border"
              >
                Overview
              </Button>
              <Button
                variant={activeLayer === 'commute' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveLayer('commute')}
                className="glass border-glass-border"
              >
                Commute
              </Button>
              <Button
                variant={activeLayer === 'amenities' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveLayer('amenities')}
                className="glass border-glass-border"
              >
                Amenities
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Mock Map */}
          <div className="relative h-96 bg-muted/10 rounded-lg overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
            
            {/* Property Pin */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-6 h-6 bg-primary rounded-full border-2 border-background shadow-lg animate-pulse" />
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-background/90 px-2 py-1 rounded text-xs font-medium whitespace-nowrap">
                {property.title}
              </div>
            </div>

            {/* Comparable Properties */}
            {comps.map((comp, index) => (
              <div
                key={index}
                className="absolute w-4 h-4 bg-yellow-500 rounded-full border border-background shadow-sm"
                style={{
                  top: `${30 + index * 15}%`,
                  left: `${25 + index * 20}%`
                }}
              >
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-background/90 px-1 py-0.5 rounded text-xs whitespace-nowrap">
                  {comp.name}
                </div>
              </div>
            ))}

            {/* Map Controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <Button size="sm" variant="outline" className="glass border-glass-border h-8 w-8 p-0">+</Button>
              <Button size="sm" variant="outline" className="glass border-glass-border h-8 w-8 p-0">−</Button>
            </div>

            {/* Layer Info */}
            <div className="absolute bottom-4 left-4 glass-card border-glass-border p-3">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 bg-primary rounded-full" />
                <span>Subject Property</span>
              </div>
              <div className="flex items-center gap-2 text-xs mt-1">
                <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                <span>Comparable Properties</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Walkability Scores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card border-glass-border">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Car className="h-5 w-5 text-primary mr-2" />
              <span className="font-medium">Walk Score</span>
            </div>
            <div className="text-3xl font-bold text-primary">{locationData.walkScore}</div>
            <div className="text-sm text-green-400">Walker's Paradise</div>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-glass-border">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Train className="h-5 w-5 text-primary mr-2" />
              <span className="font-medium">Transit Score</span>
            </div>
            <div className="text-3xl font-bold text-primary">{locationData.transitScore}</div>
            <div className="text-sm text-green-400">Excellent Transit</div>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-glass-border">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Navigation className="h-5 w-5 text-primary mr-2" />
              <span className="font-medium">Bike Score</span>
            </div>
            <div className="text-3xl font-bold text-primary">{locationData.bikeScore}</div>
            <div className="text-sm text-green-400">Very Bikeable</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="comparables" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="comparables">Comparables</TabsTrigger>
          <TabsTrigger value="market-stats">Market Stats</TabsTrigger>
          <TabsTrigger value="amenities">Amenities</TabsTrigger>
          <TabsTrigger value="neighborhood">Neighborhood</TabsTrigger>
        </TabsList>

        {/* Comparable Properties */}
        <TabsContent value="comparables">
          <Card className="glass-card border-glass-border">
            <CardHeader>
              <CardTitle>Nearby Comparable Properties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-glass-border">
                      <th className="text-left py-2">Property</th>
                      <th className="text-right py-2">Distance</th>
                      <th className="text-right py-2">Avg Rent</th>
                      <th className="text-right py-2">Year Built</th>
                      <th className="text-right py-2">Units</th>
                      <th className="text-right py-2">Occupancy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comps.map((comp, index) => (
                      <tr key={index} className="border-b border-glass-border/50">
                        <td className="py-3 font-medium">{comp.name}</td>
                        <td className="text-right py-3">{comp.distance}</td>
                        <td className="text-right py-3 text-primary font-medium">{comp.rent}</td>
                        <td className="text-right py-3">{comp.year}</td>
                        <td className="text-right py-3">{comp.units}</td>
                        <td className="text-right py-3">
                          <Badge variant="outline" className="glass border-glass-border">
                            {comp.occupancy}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Market Statistics */}
        <TabsContent value="market-stats">
          <Card className="glass-card border-glass-border">
            <CardHeader>
              <CardTitle>Market Statistics & Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {marketStats.map((stat, index) => (
                  <div key={index} className="p-4 glass rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">{stat.metric}</span>
                      {getTrendIcon(stat.trend)}
                    </div>
                    <div className="text-xl font-bold text-primary">{stat.value}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Source: {stat.source}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Points of Interest */}
        <TabsContent value="amenities">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pointsOfInterest.map((category, index) => (
              <Card key={index} className="glass-card border-glass-border">
                <CardHeader>
                  <CardTitle className="text-lg">{category.category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {category.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full" />
                        <span className="text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Neighborhood Snapshot */}
        <TabsContent value="neighborhood">
          <Card className="glass-card border-glass-border">
            <CardHeader>
              <CardTitle>Neighborhood Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 glass rounded-lg">
                  <Shield className={`h-8 w-8 mx-auto mb-2 ${getCrimeColor(neighborhoodSnapshot.crimeIndex)}`} />
                  <div className="text-lg font-bold">Safety Index</div>
                  <div className={`text-2xl font-bold ${getCrimeColor(neighborhoodSnapshot.crimeIndex)}`}>
                    {neighborhoodSnapshot.crimeIndex}/100
                  </div>
                  <div className="text-xs text-muted-foreground">Above Average</div>
                </div>
                
                <div className="text-center p-4 glass rounded-lg">
                  <School className="h-8 w-8 mx-auto mb-2 text-green-400" />
                  <div className="text-lg font-bold">School Rating</div>
                  <div className="text-2xl font-bold text-green-400">
                    {neighborhoodSnapshot.schoolRating}
                  </div>
                  <div className="text-xs text-muted-foreground">Great Schools</div>
                </div>
                
                <div className="text-center p-4 glass rounded-lg">
                  <Users className="h-8 w-8 mx-auto mb-2 text-blue-400" />
                  <div className="text-lg font-bold">Median Age</div>
                  <div className="text-2xl font-bold text-blue-400">
                    {neighborhoodSnapshot.demographics.medianAge}
                  </div>
                  <div className="text-xs text-muted-foreground">Years Old</div>
                </div>
                
                <div className="text-center p-4 glass rounded-lg">
                  <Building2 className="h-8 w-8 mx-auto mb-2 text-purple-400" />
                  <div className="text-lg font-bold">College Grads</div>
                  <div className="text-2xl font-bold text-purple-400">
                    {neighborhoodSnapshot.demographics.collegeGraduates}
                  </div>
                  <div className="text-xs text-muted-foreground">Education Level</div>
                </div>
              </div>

              <div className="p-4 bg-muted/20 rounded-lg border border-muted/50">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Data Sources:</strong> Crime data from local police departments, 
                  school ratings from GreatSchools.org, demographic data from US Census ACS 2023. 
                  All data is the most recent available and subject to change.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}