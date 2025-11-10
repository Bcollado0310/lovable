import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDeveloperAuth } from '@/contexts/DeveloperAuthContext';
import type { DateRange } from '@/components/ui/range-selector';
import { FALLBACK_DASHBOARD_DATA } from './useDeveloperDashboard';

interface AnalyticsSummary {
  capitalInflows: number;
  distributionsPaid: number;
  netCashFlow: number;
  activeInvestors: number;
  averageTicketSize: number;
  contributionVelocity: number;
}

export interface TimelinePoint {
  date: string;
  investments: number;
  distributions: number;
  cumulative: number;
}

export interface PropertyPerformance {
  id: string;
  title: string;
  status: string;
  location: string;
  targetAmount: number;
  raisedAmount: number;
  investorCount: number;
  periodInvestors: number;
  expectedAnnualReturn: number | null;
  distributionsPaid: number;
  netCashFlow: number;
  fundingProgress: number;
  lastActivity: string | null;
}

export interface InvestorSegment {
  type: string;
  count: number;
  totalDeployed: number;
}

export interface DeveloperPropertyAnalytics {
  summary: AnalyticsSummary;
  propertyPerformance: PropertyPerformance[];
  investorSegments: InvestorSegment[];
  timeline: TimelinePoint[];
  filters: {
    offerings: { id: string; title: string; status: string; location: string }[];
  };
  range: {
    label: string;
    start: string;
    end: string;
    days: number;
  };
  selectedOfferingId: string;
  generatedAt: string;
  sampleSize: number;
}

export function useDeveloperPropertyAnalytics(range: DateRange, offeringId: string) {
  const { organization } = useDeveloperAuth();
  const [data, setData] = useState<DeveloperPropertyAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const orgId = organization?.id || '550e8400-e29b-41d4-a716-446655440000';
      const normalizedOffering = offeringId && offeringId !== 'all' ? offeringId : null;

      const headers = import.meta.env.DEV
        ? { 'x-dev-bypass-token': 'local-dev-only-choose-a-long-random-string' }
        : undefined;

      const { data: responseData, error: functionError } = await supabase.functions.invoke(
        'developer-api/analytics',
        {
          body: {
            orgId,
            range,
            offeringId: normalizedOffering,
          },
          headers,
        }
      );

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (!responseData || responseData.error) {
        throw new Error(responseData?.error || 'Analytics payload missing');
      }

      setData(responseData as DeveloperPropertyAnalytics);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load analytics';
      console.error('useDeveloperPropertyAnalytics:', err);
      const isEdgeUnavailable = /Failed to send a request to the Edge Function|fetch failed|non-2xx status code/i.test(message);
      const fallback = buildFallbackAnalytics(range, offeringId);

      if (isEdgeUnavailable) {
        console.warn('useDeveloperPropertyAnalytics: Edge function unavailable, using fallback dataset.');
        setError(null);
      } else {
        setError(message);
      }

      setData(fallback);
    } finally {
      setLoading(false);
    }
  }, [organization?.id, range, offeringId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    data,
    loading,
    error,
    refetch: fetchAnalytics,
  };
}

function buildFallbackAnalytics(range: DateRange, offeringId: string): DeveloperPropertyAnalytics {
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - 30);
  const offerings = FALLBACK_DASHBOARD_DATA.offerings || [];

  const propertyPerformance: PropertyPerformance[] = offerings.map((offering, index) => {
    const target = offering.target_amount || 1;
    const raised = offering.raised_amount || 0;
    const fundingProgress = Math.min(100, (raised / target) * 100);

    return {
      id: offering.id || `fallback-${index}`,
      title: offering.title || `Project ${index + 1}`,
      status: offering.status || 'active',
      location: offering.location || 'Multi-market',
      targetAmount: target,
      raisedAmount: raised,
      investorCount: offering.investor_count || Math.max(10, 20 + index * 5),
      periodInvestors: Math.max(5, 12 + index * 3),
      expectedAnnualReturn: offering.expected_annual_return ?? 0.13,
      distributionsPaid: Math.round(raised * 0.04),
      netCashFlow: Math.round(raised * 0.08),
      fundingProgress,
      lastActivity: today.toISOString(),
    };
  });

  const timeline = generateSyntheticTimeline();
  const totalInvestments = timeline.reduce((sum, point) => sum + point.investments, 0);
  const totalDistributions = timeline.reduce((sum, point) => sum + point.distributions, 0);

  return {
    summary: {
      capitalInflows: totalInvestments,
      distributionsPaid: totalDistributions,
      netCashFlow: totalInvestments - totalDistributions,
      activeInvestors: 36,
      averageTicketSize: totalInvestments / Math.max(1, timeline.length * 0.65),
      contributionVelocity: totalInvestments / 30,
    },
    propertyPerformance,
    investorSegments: [
      { type: 'institutional', count: 8, totalDeployed: totalInvestments * 0.55 },
      { type: 'accredited', count: 18, totalDeployed: totalInvestments * 0.35 },
      { type: 'individual', count: 10, totalDeployed: totalInvestments * 0.1 },
    ],
    timeline,
    filters: {
      offerings: propertyPerformance.map((property) => ({
        id: property.id,
        title: property.title,
        status: property.status,
        location: property.location,
      })),
    },
    range: {
      label: `Synthetic ${range.toUpperCase()} window`,
      start: start.toISOString(),
      end: today.toISOString(),
      days: 30,
    },
    selectedOfferingId: offeringId || 'all',
    generatedAt: today.toISOString(),
    sampleSize: timeline.length,
  };
}

function generateSyntheticTimeline(): TimelinePoint[] {
  const points: TimelinePoint[] = [];
  const today = new Date();
  let cumulative = 0;

  for (let i = 14; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);
    const investments = Math.round(50000 + Math.random() * 75000);
    const distributions = Math.round(10000 + Math.random() * 15000);
    cumulative += investments - distributions;

    points.push({
      date: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      investments,
      distributions,
      cumulative,
    });
  }

  return points;
}
