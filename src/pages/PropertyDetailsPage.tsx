import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useProperties } from '@/hooks/useProperties';
import { PropertyHero } from '@/components/property-details/PropertyHero';
import { KPIOverview } from '@/components/property-details/KPIOverview';
import { PropertyTabs } from '@/components/property-details/PropertyTabs';
import { InvestmentSidebar } from '@/components/property-details/InvestmentSidebar';
import { InvestNowDialog } from '@/components/property-details/InvestNowDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Building2 } from 'lucide-react';

export default function PropertyDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { properties, loading } = useProperties();
  const [property, setProperty] = useState<any>(null);
  const [investDialogOpen, setInvestDialogOpen] = useState(false);
  const [investAmount, setInvestAmount] = useState<number | null>(null);

  useEffect(() => {
    if (id && properties.length > 0) {
      const found = properties.find(p => p.id === id);
      setProperty(found);
    }
  }, [id, properties]);

  const handleInvestStart = (amount?: number) => {
    if (!property) return;
    const fallbackAmount = amount ?? property.minimum_investment;
    setInvestAmount(fallbackAmount);
    setInvestDialogOpen(true);
  };

  const mockKPIs = {
    target_irr: property?.expected_annual_return || 15.8,
    target_em: 1.8,
    target_yield: 7.5,
    hold_period: '3-5 Years',
    ltv: 65,
    debt_rate: 4.75,
    debt_type: 'Fixed',
    io_years: 2,
    risk_score: property?.risk_rating || 6,
    sponsor_coinvest: 15
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-md" />
            <Skeleton className="h-8 w-64" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full rounded-lg" />
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              onClick={() => navigate('/properties')}
              className="glass border-glass-border"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Properties
            </Button>
          </div>
          <Card className="glass-card border-glass-border">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Property Not Found</h3>
              <p className="text-muted-foreground text-center mb-6">
                The property you're looking for doesn't exist or has been removed.
              </p>
              <Button onClick={() => navigate('/properties')} className="bg-gradient-primary">
                Browse Properties
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const fundingPercentage = (property.current_funding / property.target_funding) * 100;

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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <div className="p-6 pb-0">
          <Button
            variant="outline"
            onClick={() => navigate('/properties')}
            className="glass border-glass-border"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Properties
          </Button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 p-6">
          {/* Main Content */}
          <div className="xl:col-span-3 space-y-8">
            {/* Hero Section */}
            <PropertyHero property={property} onInvestClick={() => handleInvestStart()} />
            
            {/* KPI Overview */}
            <KPIOverview kpis={mockKPIs} />
            
            {/* Tabbed Content */}
            <PropertyTabs property={property} />
          </div>

          {/* Sidebar */}
          <div className="xl:col-span-1">
            <InvestmentSidebar property={property} onInvest={handleInvestStart} />
            
            {/* Mobile Investment Bar */}
            <div className="xl:hidden fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-glass-border">
              <InvestmentSidebar 
                property={property} 
                isMobile={true}
                onInvest={handleInvestStart}
              />
            </div>
          </div>
        </div>
      </div>
      <InvestNowDialog
        property={property}
        open={investDialogOpen}
        onOpenChange={setInvestDialogOpen}
        defaultAmount={investAmount ?? property.minimum_investment}
      />
    </div>
  );
}
