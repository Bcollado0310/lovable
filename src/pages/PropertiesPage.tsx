import { useEffect, useState, useMemo } from "react";
import { LayoutHeader } from "@/components/layout/LayoutHeader";
import { useProperties } from "@/hooks/useProperties";
import { usePropertyCompare } from "@/hooks/usePropertyCompare";
import { PropertyCard } from "@/components/PropertyCard";
import { PropertyFiltersBar } from "@/components/properties/PropertyFiltersBar";
import { PropertyMapView } from "@/components/properties/PropertyMapView";
import { CompareDrawer } from "@/components/properties/CompareDrawer";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";
import { usePropertyFilters } from "@/hooks/usePropertyFilters";

const normalizeValue = (value: string | undefined | null) =>
  (value ?? "").toString().trim().toLowerCase();

const STATUS_GROUPS: Record<string, string[]> = {
  available: ["available", "funding", "open", "development", "coming_soon"],
  funding: ["funding"],
  fully_funded: ["funded", "fully_funded", "closed", "completed"]
};

const matchesStatusFilter = (status: string, filterValue: string) => {
  const normalizedStatus = normalizeValue(status);
  const normalizedFilter = normalizeValue(filterValue);
  if (!normalizedFilter || normalizedFilter === "all") {
    return true;
  }

  const allowedStatuses =
    STATUS_GROUPS[normalizedFilter] ?? [normalizedFilter];

  return allowedStatuses.includes(normalizedStatus);
};

export default function PropertiesPage() {
  const { properties, loading, error, refreshProperties } = useProperties();
  const { filters, viewMode, setViewMode } = usePropertyFilters();
  const { 
    selectedProperties,
    isCompareOpen,
    addToCompare,
    removeFromCompare,
    clearCompare,
    isSelected,
    canAddMore,
    setIsCompareOpen
  } = usePropertyCompare();

  const [viewModeState, setViewModeState] = useState<'list' | 'map'>('list');

  useEffect(() => {
    setViewModeState(viewMode);
  }, [viewMode]);

  const filteredProperties = useMemo(() => {
    let filtered = [...properties];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(property =>
        property.title.toLowerCase().includes(searchLower) ||
        property.city.toLowerCase().includes(searchLower) ||
        property.address.toLowerCase().includes(searchLower) ||
        property.property_type.toLowerCase().includes(searchLower)
      );
    }

    // Return filter
    if (filters.minReturn > 0) {
      filtered = filtered.filter(property => property.expected_annual_return >= filters.minReturn);
    }

    // Investment amount filter
    if (filters.maxInvestment < 1000000) {
      filtered = filtered.filter(property => property.minimum_investment <= filters.maxInvestment);
    }

    // Risk filter
    filtered = filtered.filter(property => 
      property.risk_rating >= filters.riskMin && property.risk_rating <= filters.riskMax
    );

    // Funding status filter
    if (filters.fundingStatus !== "all") {
      filtered = filtered.filter((property) =>
        matchesStatusFilter(property.property_status, filters.fundingStatus)
      );
    }

    // Property type filter
    if (filters.propertyType !== "all") {
      filtered = filtered.filter(
        (property) =>
          normalizeValue(property.property_type) ===
          normalizeValue(filters.propertyType)
      );
    }

    // Status filter
    if (filters.status !== "all") {
      filtered = filtered.filter((property) =>
        matchesStatusFilter(property.property_status, filters.status)
      );
    }

    // Sort properties
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'fundingProgress':
          const aProgress = (a.current_funding / a.target_funding) * 100;
          const bProgress = (b.current_funding / b.target_funding) * 100;
          return bProgress - aProgress;
        case 'targetIRR':
          return b.expected_annual_return - a.expected_annual_return;
        case 'targetEM':
          return 0; // Mock sort for target equity multiple
        case 'minInvestment':
          return a.minimum_investment - b.minimum_investment;
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'recommended':
        default:
          // Mock recommended sort based on multiple factors
          const aScore = a.expected_annual_return * 0.4 + (10 - a.risk_rating) * 0.3 + 
                        ((a.current_funding / a.target_funding) * 100) * 0.3;
          const bScore = b.expected_annual_return * 0.4 + (10 - b.risk_rating) * 0.3 + 
                        ((b.current_funding / b.target_funding) * 100) * 0.3;
          return bScore - aScore;
      }
    });

    return filtered;
  }, [properties, filters]);

  const handleViewModeChange = (mode: 'list' | 'map') => {
    setViewModeState(mode);
    setViewMode(mode);
  };

  const handlePropertySelect = (property: any) => {
    console.log('Property selected:', property);
  };

  const handleCompareToggle = (property: any) => {
    if (isSelected(property.id)) {
      removeFromCompare(property.id);
    } else {
      addToCompare({
        id: property.id,
        title: property.title,
        expected_annual_return: property.expected_annual_return,
        minimum_investment: property.minimum_investment,
        risk_rating: property.risk_rating,
        property_type: property.property_type,
        total_value: property.total_value,
        target_funding: property.target_funding,
        current_funding: property.current_funding,
        property_status: property.property_status,
        image: property.images?.[0],
        images: property.images
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse gradient-text text-lg">Loading properties...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <Alert className="glass-card border-red-500/50">
            <AlertDescription className="text-red-400">
              Error loading properties: {error}
              <Button 
                onClick={refreshProperties} 
                className="ml-4 bg-gradient-primary hover:shadow-neon"
                size="sm"
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleViewModeChange(viewModeState === "list" ? "map" : "list")}
      >
        {viewModeState === "list" ? "Map View" : "List View"}
      </Button>
      {selectedProperties.length > 0 && (
        <Button size="sm" onClick={() => setIsCompareOpen(true)}>
          Compare ({selectedProperties.length})
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <LayoutHeader title="Browse Properties" actions={headerActions} />
      
      <div className="max-w-7xl mx-auto p-6 space-y-6">

        {/* Enhanced Filters Bar */}
        <PropertyFiltersBar 
          onViewModeChange={handleViewModeChange}
          propertiesCount={filteredProperties.length}
        />

        {/* Compare Badge */}
        {selectedProperties.length > 0 && (
          <div className="flex items-center justify-between">
            <Badge 
              variant="secondary" 
              className="cursor-pointer bg-primary/10 text-primary border-primary/30 hover:bg-primary/20"
              onClick={() => setIsCompareOpen(true)}
            >
              Comparing {selectedProperties.length} properties - Click to view
            </Badge>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearCompare}
              className="glass border-glass-border"
            >
              Clear Compare
            </Button>
          </div>
        )}

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">
            Showing {filteredProperties.length} of {properties.length} properties
          </p>
          {filters.sortBy && (
            <Badge variant="outline" className="glass border-glass-border">
              Sorted by: {filters.sortBy.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </Badge>
          )}
        </div>

        {/* Content Area */}
        {viewModeState === 'map' ? (
          <PropertyMapView 
            properties={filteredProperties}
            onPropertySelect={handlePropertySelect}
          />
        ) : (
          <>
            {/* Properties Grid */}
            {filteredProperties.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProperties.map((property, index) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    showInvestButton={true}
                    onCompare={handleCompareToggle}
                    isInCompare={isSelected(property.id)}
                    canAddToCompare={canAddMore}
                    isLoading={loading && index < 6} // Show skeleton for first 6 items while loading
                  />
                ))}
              </div>
            ) : (
              <Card className="glass-card border-glass-border">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No properties found</h3>
                  <p className="text-muted-foreground text-center mb-6">
                    {Object.values(filters).some(v => v !== 'all' && v !== '' && v !== 0 && v !== 1000000 && v !== 1 && v !== 10)
                      ? "Try adjusting your filters to find more properties"
                      : "New investment opportunities will appear here soon"}
                  </p>
                  <Button
                    onClick={() => window.location.reload()}
                    className="bg-gradient-primary"
                  >
                    Refresh Properties
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Compare Drawer */}
      <CompareDrawer
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        properties={selectedProperties}
        onRemoveProperty={removeFromCompare}
        onClearAll={clearCompare}
      />
    </div>
  );
}
