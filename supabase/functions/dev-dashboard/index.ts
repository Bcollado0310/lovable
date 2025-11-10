const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-dev-bypass-token',
  'Content-Type': 'application/json',
};

interface DashboardResponse {
  metrics: {
    totalRaised: number;
    totalInvestors: number;
    activeOfferings: number;
    completedOfferings: number;
    totalDistributions: number;
    avgInvestmentSize: number;
  };
  offerings: any[];
  investors: any[];
  activity: any[];
  organization: any;
  error?: string;
}

const DEMO_ORG_ID = '550e8400-e29b-41d4-a716-446655440000';

Deno.serve(async (req) => {
  const startTime = Date.now();
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let requestBody: any = {};
  let orgId = DEMO_ORG_ID;
  let userId: string | null = null;

  try {
    // Parse request body
    try {
      requestBody = await req.json();
      if (requestBody.orgId) {
        orgId = requestBody.orgId;
      }
    } catch (e) {
      console.log('dev-dashboard: No JSON body provided, using demo orgId');
    }

    // Extract user from auth header if present
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.sub;
      } catch (e) {
        console.log('dev-dashboard: Could not extract user from token');
      }
    }

    console.log(`dev-dashboard: Starting request - orgId: ${orgId}, userId: ${userId}, method: ${req.method}`);

    // Create service role client (bypasses RLS)
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.55.0?target=deno');
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // If no orgId provided and we have a user, try to get their org
    if (!requestBody.orgId && userId) {
      try {
        const { data: membershipData } = await supabaseAdmin
          .from('developer_organization_members')
          .select('organization_id')
          .eq('user_id', userId)
          .limit(1);
        
        if (membershipData && membershipData.length > 0) {
          orgId = membershipData[0].organization_id;
          console.log(`dev-dashboard: Found user org: ${orgId}`);
        }
      } catch (e) {
        console.log('dev-dashboard: Could not fetch user org membership');
      }
    }

    // Ensure user is member of org (add if missing)
    if (userId && orgId) {
      try {
        await supabaseAdmin
          .from('developer_organization_members')
          .upsert({
            user_id: userId,
            organization_id: orgId,
            role: 'owner'
          }, { onConflict: 'user_id,organization_id' });
      } catch (e) {
        console.log('dev-dashboard: Could not ensure user membership');
      }
    }

    const response: DashboardResponse = {
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

    // Fetch organization
    try {
      const orgStart = Date.now();
      const { data: orgData, error: orgError } = await supabaseAdmin
        .from('developer_organizations')
        .select('*')
        .eq('id', orgId)
        .maybeSingle();
      
      const orgDuration = Date.now() - orgStart;
      console.log(`dev-dashboard: Organization query took ${orgDuration}ms`);
      
      if (orgError) {
        console.error('dev-dashboard: Organization error:', orgError);
      } else if (orgData) {
        response.organization = orgData;
      } else {
        console.log('dev-dashboard: No organization found for orgId:', orgId);
      }
    } catch (e) {
      console.error('dev-dashboard: Organization fetch failed:', e);
    }

    // Fetch offerings
    try {
      const offeringsStart = Date.now();
      const { data: offeringsData, error: offeringsError } = await supabaseAdmin
        .from('developer_offerings')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
      
      const offeringsDuration = Date.now() - offeringsStart;
      console.log(`dev-dashboard: Offerings query took ${offeringsDuration}ms, found ${offeringsData?.length || 0} offerings`);
      
      if (offeringsError) {
        console.error('dev-dashboard: Offerings error:', offeringsError);
      } else if (offeringsData) {
        response.offerings = offeringsData;
        
        // Calculate metrics from offerings
        response.metrics.totalRaised = offeringsData.reduce((sum: number, off: any) => sum + (off.raised_amount || 0), 0);
        response.metrics.activeOfferings = offeringsData.filter((off: any) => off.status === 'active').length;
        response.metrics.completedOfferings = offeringsData.filter((off: any) => off.status === 'funded').length;
      }
    } catch (e) {
      console.error('dev-dashboard: Offerings fetch failed:', e);
    }

    // Fetch investors
    try {
      const investorsStart = Date.now();
      const { data: investorsData, error: investorsError } = await supabaseAdmin
        .from('developer_investors')
        .select('*')
        .eq('organization_id', orgId)
        .order('total_invested', { ascending: false });
      
      const investorsDuration = Date.now() - investorsStart;
      console.log(`dev-dashboard: Investors query took ${investorsDuration}ms, found ${investorsData?.length || 0} investors`);
      
      if (investorsError) {
        console.error('dev-dashboard: Investors error:', investorsError);
      } else if (investorsData) {
        response.investors = investorsData;
        response.metrics.totalInvestors = investorsData.length;
        
        if (investorsData.length > 0 && response.metrics.totalRaised > 0) {
          response.metrics.avgInvestmentSize = response.metrics.totalRaised / investorsData.length;
        }
      }
    } catch (e) {
      console.error('dev-dashboard: Investors fetch failed:', e);
    }

    // Fetch recent activity
    try {
      const activityStart = Date.now();
      const { data: activityData, error: activityError } = await supabaseAdmin
        .from('developer_contribution_events')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      const activityDuration = Date.now() - activityStart;
      console.log(`dev-dashboard: Activity query took ${activityDuration}ms, found ${activityData?.length || 0} events`);
      
      if (activityError) {
        console.error('dev-dashboard: Activity error:', activityError);
      } else if (activityData) {
        response.activity = activityData;
        
        // Calculate distributions from activity
        response.metrics.totalDistributions = activityData
          .filter((event: any) => event.event_type === 'distribution')
          .reduce((sum: number, event: any) => sum + (event.amount || 0), 0);
      }
    } catch (e) {
      console.error('dev-dashboard: Activity fetch failed:', e);
    }

    const totalDuration = Date.now() - startTime;
    console.log(`dev-dashboard: Total request took ${totalDuration}ms for orgId: ${orgId}`);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: corsHeaders,
    });

  } catch (error) {
    const totalDuration = Date.now() - startTime;
    console.error(`dev-dashboard: Unexpected error after ${totalDuration}ms:`, error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    const errorResponse: DashboardResponse = {
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
      error: `Dashboard fetch failed: ${errorMessage}`,
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 200,
      headers: corsHeaders,
    });
  }
});