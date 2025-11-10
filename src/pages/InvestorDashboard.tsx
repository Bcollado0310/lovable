import { LayoutHeader } from "@/components/layout/LayoutHeader";
import { PageGrid } from "@/components/layout/PageGrid";
import { ResponsiveCard } from "@/components/layout/ResponsiveCard";
import { usePortfolioData } from "@/hooks/usePortfolioData";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { KPIStrip } from "@/components/dashboard/KPIStrip";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { AllocationChart } from "@/components/dashboard/AllocationChart";
import { SimpleIncomeSnapshot } from "@/components/dashboard/SimpleIncomeSnapshot";
import { IncomeDistributions } from "@/components/dashboard/IncomeDistributions";
import { CommitmentsPipeline } from "@/components/dashboard/CommitmentsPipeline";
import { ActivityTimeline } from "@/components/dashboard/ActivityTimeline";
import { OnboardingChecklist } from "@/components/dashboard/OnboardingChecklist";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useIsLargeScreen } from "@/hooks/useScreenSize";
import { dashboardAnalytics } from "@/utils/analytics";
import { RangeSelector } from "@/components/ui/range-selector";
import { usePerformanceRange } from "@/hooks/usePerformanceRange";

export default function InvestorDashboard() {
  const { user } = useAuth();
  const isLargeScreen = useIsLargeScreen();
  
  // Smart default: Simple for new users and small screens, Pro for large screens on return visits
  const getDefaultMode = (): 'simple' | 'pro' => {
    // Check if user has a stored preference
    const stored = localStorage.getItem('dashboardMode');
    if (stored) {
      return JSON.parse(stored) as 'simple' | 'pro';
    }
    // Default to Simple for new users and small screens
    return isLargeScreen ? 'pro' : 'simple';
  };

  const [dashboardMode, setDashboardMode] = useLocalStorage<'simple' | 'pro'>('dashboardMode', getDefaultMode());
  const { range: dashboardRange, setRange: setDashboardRange } = usePerformanceRange();
  const {
    portfolio,
    loading, 
    error, 
    refreshData,
    kpiData,
    performanceData,
    allocationData,
    upcomingPayouts,
    monthlyDistributions,
    totalIncome,
    totalROC,
    totalDistributions,
    commitments,
    watchlist,
    activities
  } = usePortfolioData();

  if (loading) {
    return <LoadingSpinner message="Loading your portfolio..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <Alert className="glass-card border-red-500/50">
            <AlertDescription className="text-red-400">
              Error loading portfolio: {error}
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

  // Check if onboarding should be shown
  const shouldShowOnboarding = !portfolio || portfolio.total_invested === 0;

  return (
    <section id="dashboard" data-mode={dashboardMode} className="min-h-screen bg-background">
      <LayoutHeader 
        title={`Welcome back, ${user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Investor'}`}
        actions={
          <div className="flex items-center gap-3">
            <RangeSelector
              value={dashboardRange}
              onValueChange={(value) => {
                setDashboardRange(value);
                dashboardAnalytics.rangeChanged(value);
                dashboardAnalytics.performanceRangeChanged(value);
              }}
              className="w-[160px]"
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroup
                    type="single"
                    value={dashboardMode}
                    onValueChange={(value) => {
                      if (value) {
                        const newMode = value as 'simple' | 'pro';
                        const previousMode = dashboardMode;
                        setDashboardMode(newMode);
                        dashboardAnalytics.dashboardModeChanged(newMode, previousMode);
                      }
                    }}
                    className="bg-muted rounded-md p-1"
                    role="tablist"
                    aria-label="Dashboard mode selection"
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                        e.preventDefault();
                        const newMode = dashboardMode === 'simple' ? 'pro' : 'simple';
                        const previousMode = dashboardMode;
                        setDashboardMode(newMode);
                        dashboardAnalytics.dashboardModeChanged(newMode, previousMode);
                      }
                    }}
                  >
                    <ToggleGroupItem 
                      value="simple" 
                      className="text-xs px-3 py-1 data-[state=on]:bg-background data-[state=on]:text-foreground focus:ring-2 focus:ring-primary focus:ring-offset-1"
                      role="tab"
                      aria-selected={dashboardMode === 'simple'}
                      tabIndex={dashboardMode === 'simple' ? 0 : -1}
                    >
                      Simple
                    </ToggleGroupItem>
                    <ToggleGroupItem 
                      value="pro" 
                      className="text-xs px-3 py-1 data-[state=on]:bg-background data-[state=on]:text-foreground focus:ring-2 focus:ring-primary focus:ring-offset-1"
                      role="tab"
                      aria-selected={dashboardMode === 'pro'}
                      tabIndex={dashboardMode === 'pro' ? 0 : -1}
                    >
                      Pro
                    </ToggleGroupItem>
                  </ToggleGroup>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Simple = essentials; Pro = advanced & compact</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button 
              onClick={() => window.location.href = '/properties'} 
              className="bg-gradient-primary hover:shadow-neon"
            >
              Browse Properties
            </Button>
          </div>
        }
      />
      
      <div className={`overflow-hidden ${dashboardMode === 'simple' ? 'p-6' : 'p-4'}`}>
        {dashboardMode === 'simple' ? (
          <div className="space-y-6 overflow-visible">
            {/* Simple KPI Strip */}
            <KPIStrip data={kpiData} mode="simple" range={dashboardRange} />
            
            {/* Simple Performance Chart */}
            <div className="relative z-0 overflow-visible">
              <PerformanceChart mode="simple" range={dashboardRange} />
            </div>
            
            {/* Income & Allocation section */}
            <SimpleIncomeSnapshot
              upcomingPayouts={upcomingPayouts}
              monthlyDistributions={monthlyDistributions}
              totalIncome={totalIncome}
              totalROC={totalROC}
              totalDistributions={totalDistributions}
              range={dashboardRange}
              allocationSlot={
                <AllocationChart
                  assetTypeData={allocationData.assetTypeData}
                  geographyData={allocationData.geographyData}
                  riskBucketData={allocationData.riskBucketData}
                  sponsorData={allocationData.sponsorData}
                  mode="simple"
                />
              }
            />
            
            {/* Activity (lite) */}
            <ActivityTimeline activities={activities} mode="simple" />
            
            {/* Helpful CTAs */}
            <PageGrid className="grid-cols-1 md:grid-cols-2" minCardWidth={280}>
              <ResponsiveCard className="text-center">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Ready to Invest?</h3>
                  <Button 
                    onClick={() => window.location.href = '/properties'}
                    className="bg-gradient-primary hover:shadow-neon w-full"
                  >
                    Browse Properties
                  </Button>
                </div>
              </ResponsiveCard>
              
              {shouldShowOnboarding && (
                <ResponsiveCard>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Complete Your Setup</h3>
                      <p className="text-muted-foreground text-sm">
                        Finish setting up your account to unlock all features
                      </p>
                    </div>
                    <Button variant="outline" className="w-full">
                      Complete Setup
                    </Button>
                  </div>
                </ResponsiveCard>
              )}
            </PageGrid>
          </div>
        ) : (
          <div className="space-y-6 overflow-visible">
            {/* Pro Mode Layout */}
            <KPIStrip data={kpiData} mode="pro" range={dashboardRange} />

            <PerformanceChart mode="pro" range={dashboardRange} />

            <div className="grid gap-6 2xl:grid-cols-12">
              <div className="space-y-6 2xl:col-span-7 min-w-0">
                <IncomeDistributions
                  upcomingPayouts={upcomingPayouts}
                  monthlyDistributions={monthlyDistributions}
                  totalIncome={totalIncome}
                  totalROC={totalROC}
                  totalDistributions={totalDistributions}
                  mode="pro"
                  range={dashboardRange}
                />
                <AllocationChart
                  assetTypeData={allocationData.assetTypeData}
                  geographyData={allocationData.geographyData}
                  riskBucketData={allocationData.riskBucketData}
                  sponsorData={allocationData.sponsorData}
                  mode="pro"
                />
              </div>
              <div className="space-y-6 2xl:col-span-5 min-w-0">
                <CommitmentsPipeline
                  commitments={commitments}
                  watchlist={watchlist}
                  mode="pro"
                />
                <ActivityTimeline activities={activities} mode="pro" />
              </div>
            </div>
            
            {shouldShowOnboarding && (
              <OnboardingChecklist
                items={[]}
                completedCount={0}
                totalCount={5}
                isVisible={shouldShowOnboarding}
              />
            )}
          </div>
        )}
      </div>
    </section>
  );
}

