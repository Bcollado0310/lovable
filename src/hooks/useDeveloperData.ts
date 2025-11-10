import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  DeveloperOffering, 
  DeveloperInvestor, 
  DeveloperOverview, 
  DeveloperMetrics 
} from '@/utils/developerHelpers';

const DEVELOPER_API_BASE = 'https://wntvimopezffjtcwnobb.supabase.co/functions/v1/developer-api';

export function useDeveloperOverview(orgId: string | null) {
  const [data, setData] = useState<DeveloperOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) {
      setLoading(false);
      return;
    }

    const fetchOverview = async () => {
      try {
        setLoading(true);
        setError(null);

        const headers = import.meta.env.DEV ? { 
          'x-dev-bypass-token': 'local-dev-only-choose-a-long-random-string' 
        } : undefined;

        const { data: responseData, error } = await supabase.functions.invoke('developer-api/overview', {
          body: { orgId },
          headers,
        });

        if (error) {
          console.error('Developer API overview error:', error);
          throw error;
        }

        setData(responseData);
      } catch (err) {
        console.error('Error fetching developer overview:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch overview');
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, [orgId]);

  return { data, loading, error, refetch: () => {
    if (orgId) {
      setLoading(true);
      // Re-run the effect
    }
  }};
}

export function useDeveloperOfferings(orgId: string | null) {
  const [data, setData] = useState<DeveloperOffering[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const addOffering = (newOffering: DeveloperOffering) => {
    setData(prev => [newOffering, ...prev]);
  };

  useEffect(() => {
    if (!orgId) {
      setLoading(false);
      return;
    }

    const fetchOfferings = async () => {
      try {
        setLoading(true);
        setError(null);

        const headers = import.meta.env.DEV ? { 
          'x-dev-bypass-token': 'local-dev-only-choose-a-long-random-string' 
        } : undefined;

        const { data: responseData, error } = await supabase.functions.invoke('developer-api/offerings', {
          body: { orgId },
          headers,
        });

        if (error) {
          console.error('Developer API offerings error:', error);
          throw error;
        }
        
        setData(responseData || []);
      } catch (err) {
        console.error('Error fetching offerings:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch offerings');
      } finally {
        setLoading(false);
      }
    };

    fetchOfferings();
  }, [orgId]);

  return { data, loading, error, addOffering };
}

export function useDeveloperOffering(offeringId: string | null) {
  const [data, setData] = useState<DeveloperOffering | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!offeringId) {
      setLoading(false);
      return;
    }

    const fetchOffering = async () => {
      try {
        setLoading(true);
        setError(null);

        const headers = import.meta.env.DEV ? { 
          'x-dev-bypass-token': 'local-dev-only-choose-a-long-random-string' 
        } : undefined;

        const { data: responseData, error } = await supabase.functions.invoke('developer-api/offering', {
          body: { offeringId },
          headers,
        });

        if (error) {
          console.error('Developer API offering error:', error);
          throw error;
        }
        
        setData(responseData);
      } catch (err) {
        console.error('Error fetching offering:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch offering');
      } finally {
        setLoading(false);
      }
    };

    fetchOffering();
  }, [offeringId]);

  return { data, loading, error };
}

export function useDeveloperInvestors(orgId: string | null) {
  const [data, setData] = useState<DeveloperInvestor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) {
      setLoading(false);
      return;
    }

    const fetchInvestors = async () => {
      try {
        setLoading(true);
        setError(null);

        const headers = import.meta.env.DEV ? { 
          'x-dev-bypass-token': 'local-dev-only-choose-a-long-random-string' 
        } : undefined;

        const { data: responseData, error } = await supabase.functions.invoke('developer-api/investors', {
          body: { orgId },
          headers,
        });

        if (error) {
          console.error('Developer API investors error:', error);
          throw error;
        }
        
        const normalized = (responseData || []).map((inv: any) => ({
          id: inv.id,
          organization_id: inv.organization_id || orgId!,
          user_id: inv.user_id,
          first_name: inv.first_name || inv.offering_alias || 'Investor',
          last_name: inv.last_name || '',
          email: inv.email || '',
          phone: inv.phone,
          total_invested: inv.total_invested,
          investment_count: inv.investment_count,
          status: inv.status,
          investor_type: inv.investor_type,
          created_at: inv.created_at || inv.joined_date || new Date().toISOString(),
          updated_at: inv.updated_at || inv.last_activity_date || new Date().toISOString(),
        }));
        setData(normalized);
      } catch (err) {
        console.error('Error fetching investors:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch investors');
      } finally {
        setLoading(false);
      }
    };

    fetchInvestors();
  }, [orgId]);

  return { data, loading, error };
}

export function useDeveloperMetrics(orgId: string | null, range: string = '30d') {
  const [data, setData] = useState<DeveloperMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) {
      setLoading(false);
      return;
    }

    const fetchMetrics = async () => {
      try {
        setLoading(true);
        setError(null);

        const headers = import.meta.env.DEV ? { 
          'x-dev-bypass-token': 'local-dev-only-choose-a-long-random-string' 
        } : undefined;

        const { data: responseData, error } = await supabase.functions.invoke('developer-api/metrics', {
          body: { orgId, range },
          headers,
        });

        if (error) {
          console.error('Developer API metrics error:', error);
          throw error;
        }
        
        setData(responseData);
      } catch (err) {
        console.error('Error fetching metrics:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [orgId, range]);

  return { data, loading, error };
}