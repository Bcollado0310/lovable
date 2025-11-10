import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import {
  X,
  TrendingUp,
  DollarSign,
  Shield,
  Building2,
  Target
} from 'lucide-react';
import { PropertyForComparison } from '@/hooks/usePropertyCompare';

interface CompareDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  properties: PropertyForComparison[];
  onRemoveProperty: (id: string) => void;
  onClearAll: () => void;
}

export function CompareDrawer({ 
  isOpen, 
  onClose, 
  properties, 
  onRemoveProperty, 
  onClearAll 
}: CompareDrawerProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'funding': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'fully_funded': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-muted';
    }
  };

  const getRiskColor = (rating: number) => {
    if (rating <= 3) return 'text-green-400';
    if (rating <= 6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const formatCompactCurrency = (value: number) => {
    if (value === 0) return '$0';

    const formatter = new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: value >= 1_000_000 ? 1 : 0
    });

    return `$${formatter.format(value)}`;
  };

  const comparisonMetrics = [
    {
      key: 'expected_annual_return',
      label: 'Target IRR',
      icon: TrendingUp,
      format: (value: number) => `${value}%`,
      description: 'Expected annual return'
    },
    {
      key: 'minimum_investment',
      label: 'Min Investment',
      icon: DollarSign,
      format: formatCompactCurrency,
      description: 'Minimum investment amount'
    },
    {
      key: 'total_value',
      label: 'Total Value',
      icon: Building2,
      format: formatCompactCurrency,
      description: 'Total property value'
    },
    {
      key: 'fundingProgress',
      label: 'Funding Progress',
      icon: Target,
      format: (value: number) => `${value.toFixed(1)}%`,
      description: 'Current funding percentage'
    },
    {
      key: 'risk_rating',
      label: 'Risk Rating',
      icon: Shield,
      format: (value: number) => `${value}/10`,
      description: 'Investment risk level'
    }
  ];

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full max-w-full sm:max-w-[1100px] glass-card border-glass-border flex max-h-screen flex-col overflow-hidden"
      >
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-semibold">
              Compare Properties ({properties.length}/3)
            </SheetTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onClearAll}
                className="glass border-glass-border"
              >
                Clear All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 flex-1 space-y-6 overflow-y-auto overflow-x-hidden pr-1 pb-6 sm:pr-3">
          {/* Property Headers */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {properties.map((property, index) => {
              const imageSrc = property.image ?? property.images?.[0];
              const fundingTarget = property.target_funding || 0;
              const fundingProgress =
                fundingTarget > 0
                  ? Math.min((property.current_funding / fundingTarget) * 100, 999)
                  : 0;
              return (
                <Card key={property.id} className="glass-card border-glass-border overflow-hidden">
                  <div className="relative aspect-[4/3] w-full">
                    {imageSrc ? (
                      <img
                        src={imageSrc}
                        alt={`${property.title} preview`}
                        className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted/20 text-muted-foreground">
                        <Building2 className="h-8 w-8" />
                      </div>
                    )}
                    <span className="absolute left-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/40 bg-black/60 text-xs font-semibold text-white">
                      {index + 1}
                    </span>
                  </div>
                  <CardContent className="space-y-4 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          Status
                        </div>
                        <Badge className={getStatusColor(property.property_status)} variant="outline">
                          {property.property_status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveProperty(property.id)}
                        className="h-6 w-6 p-0 shrink-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <div className="text-sm font-semibold leading-tight text-foreground">
                        {property.title}
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Funding Progress</span>
                          <span className="font-medium text-foreground">
                            {fundingProgress.toFixed(1)}%
                          </span>
                        </div>
                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted/30">
                          <div
                            className="h-full rounded-full bg-gradient-primary"
                            style={{ width: `${Math.min(fundingProgress, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Add More Placeholder */}
            {properties.length < 3 && (
              <Card className="glass-card border-glass-border border-dashed">
                <CardContent className="p-4 flex items-center justify-center h-full">
                  <div className="text-center text-muted-foreground">
                    <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">Add up to {3 - properties.length} more</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <Separator className="bg-glass-border" />

          {/* Comparison Table */}
          <div className="space-y-4">
            {comparisonMetrics.map((metric) => (
              <div key={metric.key} className="space-y-2">
                <div className="flex items-center gap-2">
                  <metric.icon className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">{metric.label}</span>
                  <span className="text-xs text-muted-foreground">({metric.description})</span>
                </div>
                
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {properties.map((property, index) => {
                    let value: number;
                    let formattedDisplay: string | number;
                    
                    // Calculate derived values
                    if (metric.key === 'fundingProgress') {
                      value = (property.current_funding / property.target_funding) * 100;
                      formattedDisplay = metric.format(value);
                    } else {
                      value = property[metric.key as keyof PropertyForComparison] as number;
                      formattedDisplay = metric.format(value);
                    }

                    // Find best value for highlighting
                    const allValues = properties.map(p => {
                      if (metric.key === 'fundingProgress') {
                        return (p.current_funding / p.target_funding) * 100;
                      }
                      return p[metric.key as keyof PropertyForComparison] as number;
                    });

                    const isBest = (() => {
                      if (metric.key === 'expected_annual_return' || metric.key === 'fundingProgress') {
                        return value === Math.max(...allValues);
                      }
                      if (metric.key === 'minimum_investment') {
                        return value === Math.min(...allValues);
                      }
                      if (metric.key === 'risk_rating') {
                        return value === Math.min(...allValues);
                      }
                      return value === Math.max(...allValues);
                    })();

                    return (
                      <div
                        key={property.id}
                        className={`rounded-lg border p-3 text-center ${
                          isBest 
                            ? 'bg-primary/10 border-primary/30' 
                            : 'bg-background/50 border-glass-border'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold ${
                            isBest ? 'border-primary/60 text-primary' : 'border-current'
                          }`}>
                            {index + 1}
                          </span>
                          <span
                            className="text-[11px] font-medium leading-tight text-center text-muted-foreground whitespace-normal break-words max-w-[9rem]"
                            title={property.title}
                          >
                            {property.title}
                          </span>
                        </div>
                        <div
                          className={`mt-3 text-base font-semibold ${
                            metric.key === 'risk_rating' ? getRiskColor(value) : ''
                          } ${isBest ? 'text-primary' : ''}`}
                        >
                          {formattedDisplay}
                        </div>
                        {isBest && (
                          <div className="text-xs text-primary mt-1">Best</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button className="flex-1 bg-gradient-primary hover:shadow-neon">
              View All Details
            </Button>
            <Button variant="outline" className="glass border-glass-border">
              Export Comparison
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
