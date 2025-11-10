import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Map, 
  List, 
  X, 
  Settings2
} from 'lucide-react';
import { usePropertyFilters } from '@/hooks/usePropertyFilters';
import { cn } from '@/lib/utils';

interface PropertyFiltersBarProps {
  onViewModeChange: (mode: 'list' | 'map') => void;
  propertiesCount: number;
}

export function PropertyFiltersBar({ onViewModeChange, propertiesCount }: PropertyFiltersBarProps) {
  const { 
    filters, 
    updateFilter, 
    resetFilters, 
    viewMode, 
    setViewMode,
    hasActiveFilters
  } = usePropertyFilters();

  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleViewModeChange = (mode: 'list' | 'map') => {
    setViewMode(mode);
    onViewModeChange(mode);
  };

  return (
    <Card className="glass-card border-glass-border">
      <CardContent className="p-4 space-y-4">
        {/* Main Filter Row */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search properties..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pl-10 glass border-glass-border"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
              <SelectTrigger className="w-[140px] glass border-glass-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recommended">Recommended</SelectItem>
                <SelectItem value="fundingProgress">Funding Progress</SelectItem>
                <SelectItem value="targetIRR">Target IRR</SelectItem>
                <SelectItem value="targetEM">Target EM</SelectItem>
                <SelectItem value="minInvestment">Min Investment</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
              </SelectContent>
            </Select>

            {/* View Toggle */}
            <div className="flex rounded-lg border border-glass-border bg-glass p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleViewModeChange('list')}
                className={cn(
                  "px-3 py-1.5 h-8",
                  viewMode === 'list' ? "bg-background shadow-sm" : "hover:bg-background/50"
                )}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleViewModeChange('map')}
                className={cn(
                  "px-3 py-1.5 h-8",
                  viewMode === 'map' ? "bg-background shadow-sm" : "hover:bg-background/50"
                )}
              >
                <Map className="h-4 w-4" />
              </Button>
            </div>

            {/* Advanced Filters Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="glass border-glass-border"
            >
              <Settings2 className="h-4 w-4 mr-2" />
              Filters
              {hasActiveFilters() && (
                <Badge variant="secondary" className="ml-2 px-1.5 py-0.5 text-xs">
                  {Object.entries(filters).filter(([key, value]) => {
                    if (key === 'search') return value.length > 0;
                    if (key === 'minReturn') return value > 0;
                    if (key === 'maxInvestment') return value < 1000000;
                    if (key === 'riskMin') return value > 1;
                    if (key === 'riskMax') return value < 10;
                    return value !== 'all';
                  }).length}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <>
            <Separator className="bg-glass-border" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Return Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Min Return</Label>
                <div className="px-3 py-2 glass rounded-md border border-glass-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">0%</span>
                    <span className="text-sm font-medium">{filters.minReturn}%+</span>
                    <span className="text-sm text-muted-foreground">20%</span>
                  </div>
                  <Slider
                    value={[filters.minReturn]}
                    onValueChange={([value]) => updateFilter('minReturn', value)}
                    max={20}
                    step={0.5}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Investment Amount */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Max Investment</Label>
                <div className="px-3 py-2 glass rounded-md border border-glass-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">$0</span>
                    <span className="text-sm font-medium">≤${(filters.maxInvestment / 1000).toFixed(0)}K</span>
                    <span className="text-sm text-muted-foreground">$1M</span>
                  </div>
                  <Slider
                    value={[filters.maxInvestment]}
                    onValueChange={([value]) => updateFilter('maxInvestment', value)}
                    min={1000}
                    max={1000000}
                    step={1000}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Risk Rating */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Risk Range</Label>
                <div className="px-3 py-2 glass rounded-md border border-glass-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Low</span>
                    <span className="text-sm font-medium">{filters.riskMin}-{filters.riskMax}</span>
                    <span className="text-sm text-muted-foreground">High</span>
                  </div>
                  <Slider
                    value={[filters.riskMin, filters.riskMax]}
                    onValueChange={([min, max]) => {
                      updateFilter('riskMin', min);
                      updateFilter('riskMax', max);
                    }}
                    min={1}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Funding Status */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Funding Status</Label>
                <Select value={filters.fundingStatus} onValueChange={(value) => updateFilter('fundingStatus', value)}>
                  <SelectTrigger className="glass border-glass-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="funding">Funding Open</SelectItem>
                    <SelectItem value="fully_funded">Fully Funded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Status Chips */}
            <div className="flex flex-wrap gap-2">
              {['available', 'funding', 'fully_funded'].map((status) => (
                <Badge
                  key={status}
                  variant={filters.fundingStatus === status ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer transition-colors",
                    filters.fundingStatus === status && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => updateFilter('fundingStatus', filters.fundingStatus === status ? 'all' : status)}
                >
                  {status.replace('_', ' ')}
                </Badge>
              ))}
            </div>

            {/* Clear Filters */}
            {hasActiveFilters() && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Showing {propertiesCount} properties
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetFilters}
                  className="glass border-glass-border"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </div>
            )}
          </>
        )}

      </CardContent>
    </Card>
  );
}
