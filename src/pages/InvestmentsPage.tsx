import { useState, useMemo } from 'react';
import { LayoutHeader } from "@/components/layout/LayoutHeader";
import { usePortfolioData } from "@/hooks/usePortfolioData";
import { useInvestmentFilters } from "@/hooks/useInvestmentFilters";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { InvestmentFiltersBar } from "@/components/investments/InvestmentFiltersBar";
import { InvestmentKPISummary } from "@/components/investments/InvestmentKPISummary";
import { PositionsTable } from "@/components/investments/PositionsTable";
import { PositionDetailDrawer } from "@/components/investments/PositionDetailDrawer";
import { CommitmentsSection } from "@/components/investments/CommitmentsSection";
import { DistributionsSection } from "@/components/investments/DistributionsSection";
import { DocumentsPanel } from "@/components/investments/DocumentsPanel";
import { InvestmentActivityFeed } from "@/components/investments/InvestmentActivityFeed";
import { analytics } from "@/utils/analytics";

export default function InvestmentsPage() {
  const { investments, loading, error, refreshData } = usePortfolioData();
  const { filters, filterInvestments, isTableView } = useInvestmentFilters();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedInvestment, setSelectedInvestment] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Filter investments based on current filters
  const filteredInvestments = filterInvestments(investments);

  // Calculate KPIs based on filtered data
  const kpiData = useMemo(() => {
    const totalInvested = filteredInvestments.reduce((sum, inv) => sum + inv.amount_invested, 0);
    const currentValue = filteredInvestments.reduce((sum, inv) => sum + inv.current_value, 0);
    const totalDistributions = filteredInvestments.reduce((sum, inv) => sum + (inv.total_distributions || 0), 0);
    const netReturnPercent = totalInvested > 0 ? ((currentValue + totalDistributions - totalInvested) / totalInvested) * 100 : 0;
    const dpi = totalInvested > 0 ? totalDistributions / totalInvested : 0;
    const tvpi = totalInvested > 0 ? (currentValue + totalDistributions) / totalInvested : 0;
    const incomeYTD = filteredInvestments.reduce((sum, inv) => sum + (inv.income_ytd || 0), 0);

    return {
      totalInvested,
      currentValue,
      netReturnPercent,
      dpi,
      tvpi,
      irr: 12.5, // Mock IRR calculation
      incomeYTD,
      propertiesCount: filteredInvestments.length,
    };
  }, [filteredInvestments]);

  // Mock data for additional sections
  const commitments = [
    {
      id: '1',
      property_title: 'Downtown Office Complex',
      commitment_amount: 100000,
      funded_amount: 65000,
      funded_percentage: 65,
      deadline: '2024-01-15',
      status: 'pending' as const,
    },
    {
      id: '2',
      property_title: 'Residential Development',
      commitment_amount: 75000,
      funded_amount: 30000,
      funded_percentage: 40,
      deadline: '2024-01-10',
      status: 'overdue' as const,
    },
  ];

  const upcomingPayouts = [
    {
      id: '1',
      investment: 'Luxury Apartments',
      date: '2024-01-15',
      estimated_amount: 1250,
      status: 'scheduled' as const,
    },
    {
      id: '2', 
      investment: 'Commercial Plaza',
      date: '2024-01-20',
      estimated_amount: 2100,
      status: 'processing' as const,
    },
  ];

  const monthlyDistributions = [
    { month: 'Jan', ordinary_income: 2500, return_of_capital: 500, total: 3000 },
    { month: 'Feb', ordinary_income: 2200, return_of_capital: 800, total: 3000 },
    { month: 'Mar', ordinary_income: 2800, return_of_capital: 200, total: 3000 },
    { month: 'Apr', ordinary_income: 2400, return_of_capital: 600, total: 3000 },
    { month: 'May', ordinary_income: 2600, return_of_capital: 400, total: 3000 },
    { month: 'Jun', ordinary_income: 2900, return_of_capital: 100, total: 3000 },
  ];

  const documents = [
    {
      id: '1',
      name: 'Q4 2023 Portfolio Statement',
      type: 'statement' as const,
      date: '2023-12-31',
      isNew: true,
    },
    {
      id: '2',
      name: 'K-1 Tax Documents',
      type: 'tax' as const,
      date: '2023-12-31',
      isNew: true,
    },
    {
      id: '3',
      name: 'Annual Investment Report',
      type: 'report' as const,
      date: '2023-12-15',
      isNew: false,
    },
  ];

  const activities = [
    {
      id: '1',
      type: 'distribution' as const,
      title: 'Distribution Received',
      description: 'Quarterly distribution from Luxury Apartments',
      date: '2023-12-15T10:00:00Z',
      amount: 1250,
      status: 'completed',
    },
    {
      id: '2',
      type: 'investment' as const,
      title: 'Investment Funded',
      description: 'Successfully funded Downtown Office Complex',
      date: '2023-12-10T14:30:00Z',
      amount: 25000,
      status: 'active',
    },
    {
      id: '3',
      type: 'document' as const,
      title: 'New Document Available',
      description: 'Q4 financial statements ready for download',
      date: '2023-12-08T09:15:00Z',
      link: '/documents/q4-statement',
      status: 'new',
    },
  ];

  const handleExport = (type: 'csv' | 'xlsx', scope: 'selected' | 'all') => {
    const dataToExport = scope === 'selected' 
      ? filteredInvestments.filter(inv => selectedIds.includes(inv.id))
      : filteredInvestments;
    
    analytics.track('investment_export', { type, scope, count: dataToExport.length });
    console.log(`Exporting ${dataToExport.length} investments as ${type}`);
  };

  const handleRowClick = (investment: any) => {
    setSelectedInvestment(investment);
    setIsDrawerOpen(true);
    analytics.track('investment_detail_opened', { investment_id: investment.id });
  };

  const handleCompleteFunding = (id: string) => {
    analytics.track('commitment_funding_clicked', { commitment_id: id });
    console.log('Complete funding for commitment:', id);
  };

  if (loading) {
    return <LoadingSpinner message="Loading your investment portfolio..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <Alert className="glass-card border-red-500/50">
            <AlertDescription className="text-red-400">
              Error loading investments: {error}
              <Button 
                onClick={refreshData} 
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

  return (
    <div className="min-h-screen bg-background">
      <LayoutHeader title="My Investments" />
      
      <div className="max-w-7xl mx-auto p-6 space-y-6">

        {/* Filters Bar */}
        <InvestmentFiltersBar 
          onExport={handleExport}
          selectedCount={selectedIds.length}
        />

        {/* KPI Summary */}
        <InvestmentKPISummary 
          data={kpiData}
          currency={filters.currency}
        />

        {/* Positions Table/Grid */}
        <PositionsTable
          investments={filteredInvestments}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onRowClick={handleRowClick}
          currency={filters.currency}
          isTableView={isTableView}
        />

        {/* Commitments & Distributions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CommitmentsSection
            commitments={commitments}
            currency={filters.currency}
            onCompleteFunding={handleCompleteFunding}
          />
          <DocumentsPanel
            documents={documents}
            unreadCount={2}
            onViewAll={() => console.log('View all documents')}
          />
        </div>

        {/* Distributions & Payouts */}
        <DistributionsSection
          upcomingPayouts={upcomingPayouts}
          monthlyDistributions={monthlyDistributions}
          currency={filters.currency}
        />

        {/* Activity Feed */}
        <InvestmentActivityFeed
          activities={activities}
          currency={filters.currency}
        />

        {/* Position Detail Drawer */}
        <PositionDetailDrawer
          investment={selectedInvestment}
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          currency={filters.currency}
        />
      </div>
    </div>
  );
}