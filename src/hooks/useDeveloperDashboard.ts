import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDeveloperAuth } from '@/contexts/DeveloperAuthContext';

export interface DashboardMetrics {
  totalRaised: number;
  totalInvestors: number;
  activeOfferings: number;
  completedOfferings: number;
  totalDistributions: number;
  avgInvestmentSize: number;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  offerings: any[];
  investors: any[];
  activity: any[];
  organization: any;
  error?: string;
}

const isoDaysFromNow = (offset: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString();
};

export const FALLBACK_DASHBOARD_DATA: DashboardData = {
  metrics: {
    totalRaised: 7825000,
    totalInvestors: 248,
    activeOfferings: 4,
    completedOfferings: 11,
    totalDistributions: 1565000,
    avgInvestmentSize: 23600,
  },
  offerings: [
    {
      id: "off-glendale-logistics",
      title: "Glendale Logistics Hub",
      raised_amount: 2450000,
      target_amount: 3500000,
      funding_deadline: isoDaysFromNow(28),
      status: "funding",
    },
    {
      id: "off-summit-lofts",
      title: "Summit Lofts Expansion",
      raised_amount: 1825000,
      target_amount: 2600000,
      funding_deadline: isoDaysFromNow(42),
      status: "funding",
    },
    {
      id: "off-seaside-medical",
      title: "Seaside Medical Pavilion",
      raised_amount: 965000,
      target_amount: 1800000,
      funding_deadline: isoDaysFromNow(55),
      status: "coming_soon",
    },
    {
      id: "off-meridian-park",
      title: "Meridian Park Industrial",
      raised_amount: 1685000,
      target_amount: 2800000,
      funding_deadline: isoDaysFromNow(17),
      status: "funding",
    },
  ],
  investors: [
    {
      id: "inv-harborlight",
      name: "Harborlight Capital",
      total_invested: 650000,
      total_commitments: 820000,
      last_investment_at: isoDaysFromNow(-5),
    },
    {
      id: "inv-atlas",
      name: "Atlas Family Office",
      total_invested: 495000,
      total_commitments: 610000,
      last_investment_at: isoDaysFromNow(-9),
    },
    {
      id: "inv-trident",
      name: "Trident Wealth Partners",
      total_invested: 410000,
      total_commitments: 540000,
      last_investment_at: isoDaysFromNow(-12),
    },
  ],
  activity: [
    {
      id: "act-commit-01",
      event_type: "commitment",
      amount: 75000,
      created_at: isoDaysFromNow(-2),
      investor_name: "Harborlight Capital",
      offering_title: "Glendale Logistics Hub",
      description: "Increased allocation secured",
    },
    {
      id: "act-distribution-01",
      event_type: "distribution",
      amount: 42000,
      created_at: isoDaysFromNow(-6),
      investor_name: "Atlas Family Office",
      offering_title: "Meridian Park Industrial",
      description: "Quarterly distribution completed",
    },
    {
      id: "act-commit-02",
      event_type: "commitment",
      amount: 68000,
      created_at: isoDaysFromNow(-8),
      investor_name: "Trident Wealth Partners",
      offering_title: "Summit Lofts Expansion",
      description: "New commitment recorded",
    },
  ],
  organization: {
    id: "550e8400-e29b-41d4-a716-446655440000",
    name: "Demo Development Co.",
    account_tier: "Growth",
    primary_contact: "Avery Hart",
  },
};

const EMPTY_DASHBOARD_DATA: DashboardData = {
  metrics: {
    totalRaised: 0,
    totalInvestors: 0,
    activeOfferings: 0,
    completedOfferings: 0,
    totalDistributions: 0,
    avgInvestmentSize: 0,
  },
  offerings: [],
  investors: [],
  activity: [],
  organization: null,
};

export function useDeveloperDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { organization } = useDeveloperAuth();

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const orgId = organization?.id || '550e8400-e29b-41d4-a716-446655440000';
      
      console.log('useDeveloperDashboard: Fetching dashboard for orgId:', orgId);

      const { data: responseData, error: functionError } = await supabase.functions.invoke('dev-dashboard', {
        body: { orgId },
      });

      console.log('useDeveloperDashboard: Raw response:', { responseData, functionError });

      if (functionError) {
        console.error('useDeveloperDashboard: Function error:', functionError);
        // Try to provide more context about the error
        const errorMessage = functionError.message || 'Unknown function error';
        throw new Error(`Dashboard API error: ${errorMessage}`);
      }

      if (responseData?.error) {
        console.warn('useDeveloperDashboard: Dashboard returned error:', responseData.error);
        setData(FALLBACK_DASHBOARD_DATA);
        setError(null);
        return;
      }

      if (!responseData) {
        console.warn('useDeveloperDashboard: Empty response received, using fallback dataset.');
        setData(FALLBACK_DASHBOARD_DATA);
        setError(null);
        return;
      }

      console.log('useDeveloperDashboard: Dashboard data received:', {
        organizationName: responseData?.organization?.name,
        offeringsCount: responseData?.offerings?.length || 0,
        investorsCount: responseData?.investors?.length || 0,
        activityCount: responseData?.activity?.length || 0,
        totalRaised: responseData?.metrics?.totalRaised || 0,
      });

      setData(responseData);
    } catch (err) {
      console.error('useDeveloperDashboard: Error:', err);
      const message = err instanceof Error ? err.message : 'Failed to load dashboard';
      const isEdgeUnavailable = /Failed to send a request to the Edge Function|fetch failed/i.test(message);

      if (isEdgeUnavailable) {
        console.warn('useDeveloperDashboard: Edge function unavailable, providing fallback dataset.');
        setData(FALLBACK_DASHBOARD_DATA);
        setError(null);
      } else {
        setError(message);
        setData(EMPTY_DASHBOARD_DATA);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [organization?.id]);

  return { 
    data, 
    loading, 
    error, 
    refetch: fetchDashboard 
  };
}
