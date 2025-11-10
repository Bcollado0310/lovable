import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDeveloperAuth } from "@/contexts/DeveloperAuthContext";
import { useDeveloperDashboard } from "@/hooks/useDeveloperDashboard";
import { useDeveloperAnalytics } from "@/hooks/useDeveloperAnalytics";
import { usePerformanceRange } from "@/hooks/usePerformanceRange";
import { formatCurrency } from "@/utils/developerHelpers";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { RangeSelector } from "@/components/ui/range-selector";
import { EnhancedKPICard } from "@/components/developer/dashboard/EnhancedKPICard";
import { DailyContributionsChart } from "@/components/developer/dashboard/DailyContributionsChart";
import { FundingVelocityChart } from "@/components/developer/dashboard/FundingVelocityChart";
import { ConversionFunnelChart } from "@/components/developer/dashboard/ConversionFunnelChart";
import { TicketDistributionChart } from "@/components/developer/dashboard/TicketDistributionChart";
import { ActiveOfferingsTable } from "@/components/developer/dashboard/ActiveOfferingsTable";
import { 
  Building2, 
  Users, 
  TrendingUp, 
  DollarSign
} from "lucide-react";

export default function DeveloperDashboard() {
  const { organization, userRole } = useDeveloperAuth();
  const { data: overview, loading, error } = useDeveloperDashboard();
  const { range, setRange } = usePerformanceRange();
  const { data: analytics, loading: analyticsLoading } = useDeveloperAnalytics(range);

  // Debug log to ensure formatCurrency is available
  console.log('formatCurrency function:', formatCurrency);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">Error loading dashboard: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const kpiData = [
    {
      title: "Active Offerings",
      value: overview?.metrics.activeOfferings?.toString() || '0',
      description: "Properties currently raising",
      icon: Building2,
      sparklineData: analytics?.kpiSparklines.activeOfferings || [],
      deltaPercentage: analytics?.kpiDeltas.activeOfferings,
      deltaLabel: "vs last period"
    },
    {
      title: "Total Investors",
      value: overview?.metrics.totalInvestors?.toString() || '0',
      description: "Across all offerings",
      icon: Users,
      sparklineData: analytics?.kpiSparklines.totalInvestors || [],
      deltaPercentage: analytics?.kpiDeltas.totalInvestors,
      deltaLabel: "vs last period"
    },
    {
      title: "Capital Raised",
      value: formatCurrency(overview?.metrics.totalRaised || 0),
      description: "Total funds secured",
      icon: DollarSign,
      sparklineData: analytics?.kpiSparklines.capitalRaised || [],
      deltaPercentage: analytics?.kpiDeltas.capitalRaised,
      deltaLabel: "vs last period"
    },
    {
      title: "Distributions",
      value: formatCurrency(overview?.metrics.totalDistributions || 0),
      description: "Paid to investors",
      icon: TrendingUp,
      sparklineData: analytics?.kpiSparklines.distributions || [],
      deltaPercentage: analytics?.kpiDeltas.distributions,
      deltaLabel: "vs last period"
    }
  ];


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back to {organization?.name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <RangeSelector 
            value={range} 
            onValueChange={setRange} 
            className="w-[180px]"
          />
          <Badge variant="secondary" className="text-sm">
            {userRole}
          </Badge>
        </div>
      </div>

      {/* Enhanced KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi) => (
          <EnhancedKPICard
            key={kpi.title}
            {...kpi}
          />
        ))}
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <DailyContributionsChart 
          data={analytics?.dailyContributions || []}
          loading={analyticsLoading}
        />
        <FundingVelocityChart 
          data={analytics?.fundingVelocity || []}
          loading={analyticsLoading}
        />
        <ConversionFunnelChart 
          data={analytics?.conversionFunnel || []}
          loading={analyticsLoading}
        />
        <TicketDistributionChart 
          data={analytics?.ticketDistribution || []}
          median={analytics?.medianTicket || 0}
          loading={analyticsLoading}
        />
      </div>

      {/* Active Offerings Table */}
      <ActiveOfferingsTable 
        offerings={overview?.offerings || []}
        loading={loading}
      />
    </div>
  );
}