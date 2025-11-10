import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Building2, TrendingUp, DollarSign } from 'lucide-react';

interface Property {
  id: string;
  title: string;
  address: string;
  city: string;
  property_type: string;
  property_status: string;
  total_value: number;
  expected_annual_return: number;
  minimum_investment: number;
  risk_rating: number;
}

interface PropertyMapViewProps {
  properties: Property[];
  onPropertySelect: (property: Property) => void;
}

export function PropertyMapView({ properties, onPropertySelect }: PropertyMapViewProps) {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [hoveredProperty, setHoveredProperty] = useState<Property | null>(null);

  // Mock coordinates for demo - in real app, these would come from geocoding
  const mockCoordinates = properties.map((property, index) => ({
    ...property,
    lat: 40.7128 + (Math.random() - 0.5) * 0.1, // NYC area
    lng: -74.0060 + (Math.random() - 0.5) * 0.1
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'funding': return 'bg-blue-500';
      case 'fully_funded': return 'bg-yellow-500';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      {/* Map Container */}
      <div className="lg:col-span-2 relative">
        <Card className="glass-card border-glass-border h-full">
          <CardContent className="p-0 h-full">
            {/* Mock Map */}
            <div className="relative w-full h-full bg-gradient-to-br from-background/5 to-background/20 rounded-lg overflow-hidden">
              {/* Map Background */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
              
              {/* Property Pins */}
              {mockCoordinates.map((property) => (
                <div
                  key={property.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 hover:scale-110"
                  style={{
                    left: `${20 + (Math.abs(property.lng + 74.0060) / 0.1) * 60}%`,
                    top: `${20 + (Math.abs(property.lat - 40.7128) / 0.1) * 60}%`
                  }}
                  onClick={() => setSelectedProperty(property)}
                  onMouseEnter={() => setHoveredProperty(property)}
                  onMouseLeave={() => setHoveredProperty(null)}
                >
                  <div className={`w-4 h-4 rounded-full border-2 border-background shadow-lg ${
                    selectedProperty?.id === property.id || hoveredProperty?.id === property.id
                      ? 'scale-150 ring-2 ring-primary/50'
                      : ''
                  } ${getStatusColor(property.property_status)}`} />
                  
                  {/* Hover Tooltip */}
                  {hoveredProperty?.id === property.id && (
                    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10">
                      <div className="bg-background/95 border border-glass-border rounded-lg p-3 shadow-lg min-w-[200px] backdrop-blur-sm">
                        <h4 className="font-medium text-sm mb-1">{property.title}</h4>
                        <p className="text-xs text-muted-foreground mb-2">
                          {property.city}
                        </p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-primary">{property.expected_annual_return}% IRR</span>
                          <Badge variant="outline" className="px-1 py-0 text-xs">
                            {property.property_status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-background/95 border-r border-b border-glass-border rotate-45" />
                    </div>
                  )}
                </div>
              ))}

              {/* Map Controls */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <Button size="sm" variant="outline" className="glass border-glass-border h-8 w-8 p-0">
                  +
                </Button>
                <Button size="sm" variant="outline" className="glass border-glass-border h-8 w-8 p-0">
                  −
                </Button>
              </div>

              {/* Legend */}
              <div className="absolute bottom-4 left-4 glass-card border-glass-border p-3 space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span>Funding</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span>Fully Funded</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Property Details Panel */}
      <div className="space-y-4 overflow-y-auto">
        {selectedProperty ? (
          <Card className="glass-card border-glass-border">
            <CardContent className="p-4 space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-1">{selectedProperty.title}</h3>
                <div className="flex items-center text-sm text-muted-foreground mb-2">
                  <MapPin className="h-3 w-3 mr-1" />
                  {selectedProperty.address}, {selectedProperty.city}
                </div>
                <Badge className="mb-3" variant="outline">
                  {selectedProperty.property_type.replace('_', ' ')}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center">
                  <DollarSign className="h-3 w-3 mr-1 text-primary" />
                  <span className="text-muted-foreground">Value:</span>
                  <span className="ml-1 font-medium">
                    ${selectedProperty.total_value.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1 text-primary" />
                  <span className="text-muted-foreground">Return:</span>
                  <span className="ml-1 font-medium">
                    {selectedProperty.expected_annual_return}%
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Min. Investment:</span>
                  <span className="font-medium">${selectedProperty.minimum_investment.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Risk Level:</span>
                  <span className={`font-medium ${
                    selectedProperty.risk_rating <= 3 ? 'text-green-400' :
                    selectedProperty.risk_rating <= 6 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {selectedProperty.risk_rating}/10
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  onClick={() => onPropertySelect(selectedProperty)}
                  className="flex-1 bg-gradient-primary hover:shadow-neon"
                  size="sm"
                >
                  View Details
                </Button>
                <Button variant="outline" size="sm" className="glass border-glass-border">
                  Compare
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="glass-card border-glass-border">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Select a Property</h3>
              <p className="text-sm text-muted-foreground text-center">
                Click on a pin to view property details
              </p>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <Card className="glass-card border-glass-border">
          <CardContent className="p-4">
            <h4 className="font-medium mb-3">Map Overview</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Properties:</span>
                <span className="font-medium">{properties.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Available:</span>
                <span className="font-medium text-green-400">
                  {properties.filter(p => p.property_status === 'available').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Funding:</span>
                <span className="font-medium text-blue-400">
                  {properties.filter(p => p.property_status === 'funding').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg. Return:</span>
                <span className="font-medium text-primary">
                  {(properties.reduce((sum, p) => sum + p.expected_annual_return, 0) / properties.length).toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}