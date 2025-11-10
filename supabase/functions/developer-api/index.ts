const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-dev-bypass-token',
};

// Development authentication bypass middleware
interface AuthResult {
  user: any;
  isBypass: boolean;
}

async function devAuthBypass(req: Request): Promise<AuthResult> {
  const nodeEnv = Deno.env.get('NODE_ENV') || 'development';
  
  // CRITICAL: Never enable bypass in production - hard stop
  if (nodeEnv === 'production') {
    return await normalAuth(req);
  }

  const devAuthBypass = Deno.env.get('DEV_AUTH_BYPASS');
  const devBypassToken = Deno.env.get('DEV_BYPASS_TOKEN');
  const devBypassUserId = Deno.env.get('DEV_BYPASS_USER_ID');
  const devBypassUserRole = Deno.env.get('DEV_BYPASS_USER_ROLE');

  // Check if bypass is enabled and configured
  if (devAuthBypass !== 'true' || !devBypassToken || !devBypassUserId || !devBypassUserRole) {
    return await normalAuth(req);
  }

  // Check for bypass token in request headers
  const requestBypassToken = req.headers.get('x-dev-bypass-token');
  
  if (requestBypassToken === devBypassToken) {
    // SECURITY WARNING: Log bypass usage in development
    const timestamp = new Date().toISOString();
    const url = new URL(req.url);
    const route = url.pathname;
    const method = req.method;
    
    console.warn(`🚨 DEV AUTH BYPASS ACTIVE 🚨`);
    console.warn(`  Timestamp: ${timestamp}`);
    console.warn(`  User ID: ${devBypassUserId}`);
    console.warn(`  Route: ${method} ${route}`);
    console.warn(`  Role: ${devBypassUserRole}`);
    console.warn(`  Environment: ${nodeEnv}`);
    
    // Create bypass user object
    const bypassUser = {
      id: devBypassUserId,
      role: devBypassUserRole,
      email: 'dev@bypass.local',
    };

    return {
      user: bypassUser,
      isBypass: true
    };
  }

  // No bypass token or token mismatch - use normal auth
  return await normalAuth(req);
}

async function normalAuth(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader) {
    // For developer-api, we allow some endpoints without auth
    return {
      user: null,
      isBypass: false
    };
  }

  try {
    const userId = extractUserIdFromJWT(authHeader);
    return {
      user: userId ? { id: userId } : null,
      isBypass: false
    };
  } catch (error) {
    return {
      user: null,
      isBypass: false
    };
  }
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Sanitized DTOs for developer access (no PII)
interface SanitizedInvestorDTO {
  id: string;
  offering_alias: string; // Per-offering alias like INV-0001
  total_invested: number;
  investment_count: number;
  status: string;
  investor_type: string;
  joined_date: string;
  last_activity_date: string;
}

interface SanitizedContributionEventDTO {
  id: string;
  transaction_id: string; // Contribution event ID for search
  investor_alias: string; // Per-offering alias
  amount: number;
  event_type: string;
  status: string;
  created_at: string;
}

// Full DTOs for admin access (includes PII)
interface FullInvestorDTO {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  total_invested: number;
  investment_count: number;
  status: string;
  investor_type: string;
  created_at: string;
  updated_at: string;
}

// Helper function to check user role
async function getUserRole(supabaseClient: any, userId: string): Promise<'admin' | 'developer' | null> {
  try {
    // Check if user is admin
    const { data: adminRole } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
    
    if (adminRole) {
      return 'admin';
    }
    
    // Check if user belongs to any developer organization
    const { data: devRole } = await supabaseClient
      .from('developer_organization_members')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (devRole) {
      return 'developer';
    }
    
    return null;
  } catch (error) {
    console.error('Error checking user role:', error);
    return null;
  }
}

// Extract user ID from JWT token
function extractUserIdFromJWT(authHeader: string): string | null {
  try {
    if (!authHeader.startsWith('Bearer ')) return null;
    
    const token = authHeader.substring(7);
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub || null;
  } catch (error) {
    console.error('Error extracting user ID from JWT:', error);
    return null;
  }
}

// Sanitize investor data based on user role
function sanitizeInvestorData(investor: any, userRole: 'admin' | 'developer', alias?: string): SanitizedInvestorDTO | FullInvestorDTO {
  if (userRole === 'admin') {
    return {
      id: investor.id,
      first_name: investor.first_name,
      last_name: investor.last_name,
      email: investor.email,
      phone: investor.phone,
      total_invested: investor.total_invested,
      investment_count: investor.investment_count,
      status: investor.status,
      investor_type: investor.investor_type,
      created_at: investor.created_at,
      updated_at: investor.updated_at
    };
  }
  
  // Developer role - return sanitized data only
  return {
    id: investor.id,
    offering_alias: alias || `Investor-${investor.id.slice(0, 8)}`,
    total_invested: investor.total_invested,
    investment_count: investor.investment_count,
    status: investor.status,
    investor_type: investor.investor_type,
    joined_date: investor.created_at,
    last_activity_date: investor.updated_at
  };
}

// Sanitize contribution event data
function sanitizeContributionData(event: any, userRole: 'admin' | 'developer', investorAlias?: string): SanitizedContributionEventDTO | any {
  if (userRole === 'admin') {
    return event; // Return full data for admins
  }
  
  // Developer role - return sanitized data only
  return {
    id: event.id,
    transaction_id: event.id, // Use event ID as transaction ID for search
    investor_alias: investorAlias || `Investor-${event.investor_id.slice(0, 8)}`,
    amount: event.amount,
    event_type: event.event_type,
    status: event.status,
    created_at: event.created_at
  };
}

interface Database {
  public: {
    Tables: {
      developer_organizations: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          website: string | null;
          logo_url: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      developer_offerings: {
        Row: {
          id: string;
          organization_id: string;
          title: string;
          description: string;
          location: string;
          property_type: string;
          target_amount: number;
          raised_amount: number;
          minimum_investment: number;
          expected_annual_return: number | null;
          status: string;
          funding_deadline: string | null;
          images: string[] | null;
          documents: string[] | null;
          investor_count: number;
          created_at: string;
          updated_at: string;
        };
      };
      developer_investors: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string | null;
          first_name: string;
          last_name: string;
          email: string;
          phone: string | null;
          total_invested: number;
          investment_count: number;
          status: string;
          investor_type: string;
          created_at: string;
          updated_at: string;
        };
      };
      developer_contribution_events: {
        Row: {
          id: string;
          organization_id: string;
          offering_id: string;
          investor_id: string;
          amount: number;
          event_type: string;
          status: string;
          created_at: string;
        };
      };
    };
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.55.0?target=deno');
    
    // Use service role for database operations to bypass RLS, but still validate permissions
    const supabaseClient = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const endpoint = pathSegments[pathSegments.length - 1];
    
    // Use development auth bypass middleware FIRST
    const { user: authUser, isBypass } = await devAuthBypass(req);
    
    if (isBypass) {
      console.log('📋 Using dev bypass user for developer-api');
    }
    
    // Extract user role from authorization header or use bypass user
    let userRole: 'admin' | 'developer' | null = null;
    let userId = authUser?.id || null;
    
    if (userId) {
      userRole = await getUserRole(supabaseClient, userId);
    }
    
    // Default to developer role if not determined
    if (!userRole) {
      userRole = 'developer';
    }

    console.log(`Developer API called: ${endpoint}, userRole: ${userRole}`);
    
    // Read request body for parameters
    const body = await req.json();
    const orgId = body.orgId;
    const offeringId = body.offeringId;
    const investorId = body.investorId;
    const range = body.range || '30d';

    // Validate organization access for developers (skip in dev bypass mode)
    if (userRole === 'developer' && orgId && userId && !isBypass) {
      const { data: membershipCheck } = await supabaseClient
        .from('developer_organization_members')
        .select('id')
        .eq('user_id', userId)
        .eq('organization_id', orgId)
        .maybeSingle();
      
      if (!membershipCheck) {
        return new Response(JSON.stringify({ error: 'Access denied to organization' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    switch (endpoint) {
      case 'overview':
        if (!orgId) {
          return new Response(JSON.stringify({ error: 'Organization ID required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        return await getDeveloperOverview(supabaseClient, orgId, userRole);

      case 'offerings':
        if (!orgId) {
          return new Response(JSON.stringify({ error: 'Organization ID required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        return await listOfferings(supabaseClient, orgId);

      case 'offering':
        if (!offeringId) {
          return new Response(JSON.stringify({ error: 'Offering ID required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        return await getOffering(supabaseClient, offeringId);

      case 'investors':
        if (!orgId) {
          return new Response(JSON.stringify({ error: 'Organization ID required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        return await listInvestors(supabaseClient, orgId, userRole);

      case 'search-offering-investors':
        if (!offeringId) {
          return new Response(JSON.stringify({ error: 'Offering ID required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        return await searchOfferingInvestors(supabaseClient, offeringId, body.searchTerm || '', userRole);

      case 'investor':
        if (!investorId) {
          return new Response(JSON.stringify({ error: 'Investor ID required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        return await getInvestor(supabaseClient, investorId, userRole);

      case 'offering-investors':
        if (!offeringId) {
          return new Response(JSON.stringify({ error: 'Offering ID required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        return await getOfferingInvestors(supabaseClient, offeringId, userRole);

      case 'export-investors':
        if (!orgId) {
          return new Response(JSON.stringify({ error: 'Organization ID required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        return await exportInvestors(supabaseClient, orgId, userRole);

      case 'investor-details':
        if (!investorId) {
          return new Response(JSON.stringify({ error: 'Investor ID required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        return await getInvestorDetails(supabaseClient, investorId, userRole, body.offeringId);

      case 'metrics':
        if (!orgId) {
          return new Response(JSON.stringify({ error: 'Organization ID required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        return await getMetrics(supabaseClient, orgId, range, userRole);

      case 'analytics':
        if (!orgId) {
          return new Response(JSON.stringify({ error: 'Organization ID required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        return await getAnalytics(supabaseClient, orgId, range, offeringId);

      default:
        return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Developer API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function getDeveloperOverview(supabaseClient: any, orgId: string, userRole: 'admin' | 'developer') {
  try {
    // Get organization details
    const { data: organization, error: orgError } = await supabaseClient
      .from('developer_organizations')
      .select('*')
      .eq('id', orgId)
      .single();

    if (orgError) throw orgError;

    // Get metrics
    const [offeringsResult, investorsResult, eventsResult, aliasesResult] = await Promise.all([
      supabaseClient.from('developer_offerings').select('*').eq('organization_id', orgId),
      supabaseClient.from('developer_investors').select('*').eq('organization_id', orgId),
      supabaseClient.from('developer_contribution_events').select('*').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(10),
      supabaseClient.from('developer_investor_aliases').select('*').eq('organization_id', orgId)
    ]);

    const offerings = offeringsResult.data || [];
    const investors = investorsResult.data || [];
    const events = eventsResult.data || [];
    const aliases = aliasesResult.data || [];

    // Create alias mapping
    const aliasMap = new Map();
    aliases.forEach((alias: any) => {
      aliasMap.set(alias.investor_id, alias.alias_name);
    });

    const totalRaised = offerings.reduce((sum: number, off: any) => sum + (off.raised_amount || 0), 0);
    const totalDistributions = events
      .filter((event: any) => event.event_type === 'distribution')
      .reduce((sum: number, event: any) => sum + event.amount, 0);

    const activeOfferings = offerings.filter((off: any) => off.status === 'active').length;
    const completedOfferings = offerings.filter((off: any) => off.status === 'funded').length;
    const totalInvestors = investors.length;
    const avgInvestmentSize = totalInvestors > 0 ? totalRaised / totalInvestors : 0;

    // Sanitize recent activity based on user role
    const sanitizedActivity = events.map((event: any) => 
      sanitizeContributionData(event, userRole, aliasMap.get(event.investor_id))
    );

    const overview = {
      organization,
      metrics: {
        totalRaised,
        totalInvestors,
        activeOfferings,
        completedOfferings,
        totalDistributions,
        avgInvestmentSize,
      },
      recentActivity: sanitizedActivity,
    };

    return new Response(JSON.stringify(overview), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching developer overview:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch overview' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function listOfferings(supabaseClient: any, orgId: string) {
  try {
    const { data, error } = await supabaseClient
      .from('developer_offerings')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return new Response(JSON.stringify(data || []), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching offerings:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch offerings' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function getOffering(supabaseClient: any, offeringId: string) {
  try {
    const { data, error } = await supabaseClient
      .from('developer_offerings')
      .select('*')
      .eq('id', offeringId)
      .single();

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching offering:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch offering' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function listInvestors(supabaseClient: any, orgId: string, userRole: 'admin' | 'developer') {
  try {
    const [investorsResult, aliasesResult] = await Promise.all([
      supabaseClient
        .from('developer_investors')
        .select('*')
        .eq('organization_id', orgId)
        .order('total_invested', { ascending: false }),
      supabaseClient
        .from('developer_investor_aliases')
        .select('*')
        .eq('organization_id', orgId)
    ]);

    if (investorsResult.error) throw investorsResult.error;

    const investors = investorsResult.data || [];
    const aliases = aliasesResult.data || [];

    // Create alias mapping
    const aliasMap = new Map();
    aliases.forEach((alias: any) => {
      aliasMap.set(alias.investor_id, alias.alias_name);
    });

    // Sanitize investor data based on user role
    const sanitizedInvestors = investors.map((investor: any) =>
      sanitizeInvestorData(investor, userRole, aliasMap.get(investor.id))
    );

    return new Response(JSON.stringify(sanitizedInvestors), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching investors:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch investors' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function getInvestor(supabaseClient: any, investorId: string, userRole: 'admin' | 'developer') {
  try {
    const [investorResult, aliasResult] = await Promise.all([
      supabaseClient
        .from('developer_investors')
        .select('*')
        .eq('id', investorId)
        .single(),
      supabaseClient
        .from('developer_investor_aliases')
        .select('alias_name')
        .eq('investor_id', investorId)
        .maybeSingle()
    ]);

    if (investorResult.error) throw investorResult.error;

    const investor = investorResult.data;
    const alias = aliasResult.data?.alias_name;

    // Sanitize investor data based on user role
    const sanitizedInvestor = sanitizeInvestorData(investor, userRole, alias);

    return new Response(JSON.stringify(sanitizedInvestor), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching investor:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch investor' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function getOfferingInvestors(supabaseClient: any, offeringId: string, userRole: 'admin' | 'developer') {
  try {
    // Get offering details to find organization
    const { data: offering, error: offeringError } = await supabaseClient
      .from('developer_offerings')
      .select('organization_id')
      .eq('id', offeringId)
      .single();

    if (offeringError) throw offeringError;

    // Get investors who have contributed to this offering
    const { data: events, error: eventsError } = await supabaseClient
      .from('developer_contribution_events')
      .select('investor_id')
      .eq('offering_id', offeringId)
      .eq('event_type', 'investment');

    if (eventsError) throw eventsError;

    const investorIds = [...new Set(events.map((e: any) => e.investor_id))];

    if (investorIds.length === 0) {
      return new Response(JSON.stringify([]), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const [investorsResult, aliasesResult] = await Promise.all([
      supabaseClient
        .from('developer_investors')
        .select('*')
        .in('id', investorIds),
      supabaseClient
        .from('developer_offering_investor_aliases')
        .select('*')
        .eq('offering_id', offeringId)
        .in('investor_id', investorIds)
    ]);

    const investors = investorsResult.data || [];
    const aliases = aliasesResult.data || [];

    // Create alias mapping using per-offering aliases
    const aliasMap = new Map();
    aliases.forEach((alias: any) => {
      aliasMap.set(alias.investor_id, alias.alias_code);
    });

    // Sanitize investor data based on user role
    const sanitizedInvestors = investors.map((investor: any) =>
      sanitizeInvestorData(investor, userRole, aliasMap.get(investor.id))
    );

    return new Response(JSON.stringify(sanitizedInvestors), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching offering investors:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch offering investors' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function exportInvestors(supabaseClient: any, orgId: string, userRole: 'admin' | 'developer') {
  try {
    const [investorsResult, aliasesResult, eventsResult] = await Promise.all([
      supabaseClient
        .from('developer_investors')
        .select('*')
        .eq('organization_id', orgId)
        .order('total_invested', { ascending: false }),
      supabaseClient
        .from('developer_investor_aliases')
        .select('*')
        .eq('organization_id', orgId),
      supabaseClient
        .from('developer_contribution_events')
        .select('*')
        .eq('organization_id', orgId)
    ]);

    if (investorsResult.error) throw investorsResult.error;

    const investors = investorsResult.data || [];
    const aliases = aliasesResult.data || [];
    const events = eventsResult.data || [];

    // Create alias mapping
    const aliasMap = new Map();
    aliases.forEach((alias: any) => {
      aliasMap.set(alias.investor_id, alias.alias_name);
    });

    // Create transaction summaries per investor
    const transactionSummaries = new Map();
    events.forEach((event: any) => {
      const investorId = event.investor_id;
      if (!transactionSummaries.has(investorId)) {
        transactionSummaries.set(investorId, {
          total_transactions: 0,
          investments: 0,
          distributions: 0,
          refunds: 0,
          investment_amount: 0,
          distribution_amount: 0
        });
      }
      
      const summary = transactionSummaries.get(investorId);
      summary.total_transactions++;
      
      if (event.event_type === 'investment') {
        summary.investments++;
        summary.investment_amount += event.amount;
      } else if (event.event_type === 'distribution') {
        summary.distributions++;
        summary.distribution_amount += event.amount;
      } else if (event.event_type === 'refund') {
        summary.refunds++;
      }
    });

    if (userRole === 'developer') {
      // Generate sanitized CSV data for developers
      const csvData = investors.map((investor: any) => {
        const alias = aliasMap.get(investor.id) || `Investor-${investor.id.slice(0, 8)}`;
        const txSummary = transactionSummaries.get(investor.id) || {
          total_transactions: 0,
          investments: 0,
          distributions: 0,
          refunds: 0,
          investment_amount: 0,
          distribution_amount: 0
        };
        
        return {
          alias,
          status: investor.status,
          joined_date: new Date(investor.created_at).toLocaleDateString(),
          total_invested: investor.total_invested,
          investor_type: investor.investor_type,
          total_transactions: txSummary.total_transactions,
          investment_transactions: txSummary.investments,
          distribution_transactions: txSummary.distributions,
          total_distributions_received: txSummary.distribution_amount
        };
      });

      // Generate CSV string
      const headers = [
        'Alias',
        'Status', 
        'Joined Date',
        'Total Invested',
        'Investor Type',
        'Total Transactions',
        'Investment Transactions',
        'Distribution Transactions',
        'Total Distributions Received'
      ];
      
      const csvContent = [
        headers.join(','),
        ...csvData.map((row: any) => [
          row.alias,
          row.status,
          row.joined_date,
          row.total_invested,
          row.investor_type,
          row.total_transactions,
          row.investment_transactions,
          row.distribution_transactions,
          row.total_distributions_received
        ].join(','))
      ].join('\n');

      const response = {
        data: csvContent,
        format: 'sanitized_csv',
        exported_at: new Date().toISOString(),
        user_role: userRole,
        record_count: investors.length
      };

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // For admins, return full data with PII (existing functionality)
      const fullInvestors = investors.map((investor: any) => ({
        ...investor,
        alias: aliasMap.get(investor.id),
        transaction_summary: transactionSummaries.get(investor.id)
      }));

      const response = {
        data: fullInvestors,
        format: 'full_csv',
        exported_at: new Date().toISOString(),
        user_role: userRole,
        record_count: investors.length
      };

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error exporting investors:', error);
    return new Response(JSON.stringify({ error: 'Failed to export investors' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function getMetrics(supabaseClient: any, orgId: string, range: string, userRole: 'admin' | 'developer') {
  try {
    // Calculate date range
    const now = new Date();
    const daysBack = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365;
    const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

    const [offeringsResult, investorsResult, eventsResult] = await Promise.all([
      supabaseClient.from('developer_offerings').select('*').eq('organization_id', orgId),
      supabaseClient.from('developer_investors').select('*').eq('organization_id', orgId),
      supabaseClient
        .from('developer_contribution_events')
        .select('*')
        .eq('organization_id', orgId)
        .gte('created_at', startDate.toISOString())
    ]);

    const offerings = offeringsResult.data || [];
    const investors = investorsResult.data || [];
    const events = eventsResult.data || [];

    const totalRaised = offerings.reduce((sum: number, off: any) => sum + (off.raised_amount || 0), 0);
    const totalDistributions = events
      .filter((event: any) => event.event_type === 'distribution')
      .reduce((sum: number, event: any) => sum + event.amount, 0);

    const metrics = {
      totalRaised,
      totalInvestors: investors.length,
      activeOfferings: offerings.filter((off: any) => off.status === 'active').length,
      completedOfferings: offerings.filter((off: any) => off.status === 'funded').length,
      totalDistributions,
      avgInvestmentSize: investors.length > 0 ? totalRaised / investors.length : 0,
      periodEvents: events.length,
      periodInvestments: events.filter((e: any) => e.event_type === 'investment').length,
      periodDistributions: events.filter((e: any) => e.event_type === 'distribution').length,
      dataAccess: userRole, // Indicate what level of access was used
    };

    return new Response(JSON.stringify(metrics), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch metrics' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function getAnalytics(
  supabaseClient: any, 
  orgId: string, 
  range: string, 
  offeringId?: string | null
) {
  try {
    const normalizedOfferingId = offeringId && offeringId !== 'all' ? offeringId : null;
    const { startISO, label: rangeLabel } = resolveRangeWindow(range);

    const offeringsPromise = supabaseClient
      .from('developer_offerings')
      .select('id, title, status, location, target_amount, raised_amount, investor_count, expected_annual_return')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    const eventsQuery = supabaseClient
      .from('developer_contribution_events')
      .select('id, offering_id, investor_id, amount, event_type, status, created_at')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: true });

    if (startISO) {
      eventsQuery.gte('created_at', startISO);
    }

    const [offeringsResult, eventsResult] = await Promise.all([
      offeringsPromise,
      eventsQuery,
    ]);

    if (offeringsResult.error) throw offeringsResult.error;
    if (eventsResult.error) throw eventsResult.error;

    const offerings = offeringsResult.data || [];
    const events = eventsResult.data || [];
    const selectedEvents = normalizedOfferingId
      ? events.filter((event: any) => event.offering_id === normalizedOfferingId)
      : events;

    const now = new Date();
    const earliestEventDate = events.length ? new Date(events[0].created_at) : null;
    const effectiveStart = startISO
      ? new Date(startISO)
      : earliestEventDate || new Date(now.getFullYear() - 1, 0, 1);
    const daysInRange = Math.max(
      1,
      Math.ceil((now.getTime() - effectiveStart.getTime()) / (24 * 60 * 60 * 1000))
    );

    const investmentEvents = selectedEvents.filter((event: any) => event.event_type === 'investment');
    const distributionEvents = selectedEvents.filter((event: any) => event.event_type === 'distribution');

    const totalInvestments = investmentEvents.reduce((sum: number, event: any) => sum + (event.amount || 0), 0);
    const totalDistributions = distributionEvents.reduce((sum: number, event: any) => sum + (event.amount || 0), 0);
    const activeInvestors = new Set(selectedEvents.map((event: any) => event.investor_id)).size;

    const summary = {
      capitalInflows: totalInvestments,
      distributionsPaid: totalDistributions,
      netCashFlow: totalInvestments - totalDistributions,
      activeInvestors,
      averageTicketSize: investmentEvents.length > 0 ? totalInvestments / investmentEvents.length : 0,
      contributionVelocity: totalInvestments / daysInRange,
    };

    const eventsByOffering = new Map<string, any[]>();
    events.forEach((event: any) => {
      const bucket = eventsByOffering.get(event.offering_id) || [];
      bucket.push(event);
      eventsByOffering.set(event.offering_id, bucket);
    });

    const propertyPerformance = offerings.map((offering: any) => {
      const propertyEvents = eventsByOffering.get(offering.id) || [];
      const propertyInvestments = propertyEvents
        .filter((event: any) => event.event_type === 'investment')
        .reduce((sum: number, event: any) => sum + (event.amount || 0), 0);
      const propertyDistributions = propertyEvents
        .filter((event: any) => event.event_type === 'distribution')
        .reduce((sum: number, event: any) => sum + (event.amount || 0), 0);
      const fundingProgress = offering.target_amount > 0
        ? Math.min(100, (offering.raised_amount / offering.target_amount) * 100)
        : 0;
      const lastActivity = propertyEvents.length
        ? propertyEvents[propertyEvents.length - 1].created_at
        : null;
      const periodInvestors = new Set(propertyEvents.map((event: any) => event.investor_id)).size;

      return {
        id: offering.id,
        title: offering.title,
        status: offering.status,
        location: offering.location,
        targetAmount: offering.target_amount,
        raisedAmount: offering.raised_amount,
        investorCount: offering.investor_count,
        periodInvestors,
        expectedAnnualReturn: offering.expected_annual_return,
        distributionsPaid: propertyDistributions,
        netCashFlow: propertyInvestments - propertyDistributions,
        fundingProgress,
        lastActivity,
      };
    }).sort((a: any, b: any) => b.netCashFlow - a.netCashFlow);

    let investorSegments: { type: string; count: number; totalDeployed: number }[] = [];
    if (selectedEvents.length > 0) {
      const investorIds = Array.from(new Set(selectedEvents.map((event: any) => event.investor_id))).filter(Boolean);
      if (investorIds.length > 0) {
        const { data: investorRows, error: investorError } = await supabaseClient
          .from('developer_investors')
          .select('id, investor_type')
          .in('id', investorIds);
        if (investorError) throw investorError;

        const investorTypeMap = new Map<string, string>();
        (investorRows || []).forEach((row: any) => {
          investorTypeMap.set(row.id, row.investor_type || 'unclassified');
        });

        const segmentMap = new Map<string, { count: number; total: number }>();
        selectedEvents.forEach((event: any) => {
          if (event.event_type !== 'investment') return;
          const type = investorTypeMap.get(event.investor_id) || 'unclassified';
          const current = segmentMap.get(type) || { count: 0, total: 0 };
          current.count += 1;
          current.total += event.amount || 0;
          segmentMap.set(type, current);
        });

        investorSegments = Array.from(segmentMap.entries())
          .map(([type, stats]) => ({
            type,
            count: stats.count,
            totalDeployed: stats.total,
          }))
          .sort((a, b) => b.totalDeployed - a.totalDeployed);
      }
    }

    const timelineBuckets = new Map<string, { investments: number; distributions: number }>();
    selectedEvents.forEach((event: any) => {
      const dateKey = event.created_at.substring(0, 10);
      const bucket = timelineBuckets.get(dateKey) || { investments: 0, distributions: 0 };
      if (event.event_type === 'investment') {
        bucket.investments += event.amount || 0;
      } else if (event.event_type === 'distribution') {
        bucket.distributions += event.amount || 0;
      }
      timelineBuckets.set(dateKey, bucket);
    });

    let cumulative = 0;
    const timeline = Array.from(timelineBuckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateKey, values]) => {
        cumulative += values.investments - values.distributions;
        return {
          date: new Date(dateKey).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          investments: values.investments,
          distributions: values.distributions,
          cumulative,
        };
      });

    const response = {
      summary,
      propertyPerformance,
      investorSegments,
      timeline,
      filters: {
        offerings: offerings.map((offering: any) => ({
          id: offering.id,
          title: offering.title,
          status: offering.status,
          location: offering.location,
        })),
      },
      range: {
        label: rangeLabel,
        start: effectiveStart.toISOString(),
        end: now.toISOString(),
        days: daysInRange,
      },
      selectedOfferingId: normalizedOfferingId || 'all',
      generatedAt: new Date().toISOString(),
      sampleSize: selectedEvents.length,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error compiling developer analytics:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch analytics' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

function resolveRangeWindow(range: string) {
  const now = new Date();
  let start: Date | null = null;
  let label = 'Since inception';

  switch (range) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      label = 'Today';
      break;
    case '1m':
      start = new Date(now);
      start.setMonth(now.getMonth() - 1);
      label = 'Last 30 days';
      break;
    case '3m':
      start = new Date(now);
      start.setMonth(now.getMonth() - 3);
      label = 'Last 90 days';
      break;
    case '6m':
      start = new Date(now);
      start.setMonth(now.getMonth() - 6);
      label = 'Last 6 months';
      break;
    case '1y':
      start = new Date(now);
      start.setFullYear(now.getFullYear() - 1);
      label = 'Last 12 months';
      break;
    case 'ytd':
      start = new Date(now.getFullYear(), 0, 1);
      label = 'Year to date';
      break;
    case 'all':
    default:
      start = null;
      label = 'Since inception';
      break;
  }

  return {
    startISO: start ? start.toISOString() : null,
    label,
  };
}

async function getInvestorDetails(supabaseClient: any, investorId: string, userRole: 'admin' | 'developer', offeringId?: string) {
  try {
    // Get investor basic data
    const { data: investor, error: investorError } = await supabaseClient
      .from('developer_investors')
      .select('*')
      .eq('id', investorId)
      .single();

    if (investorError) throw investorError;

    // Get alias for this investor
    let alias = `Investor-${investorId.slice(0, 8)}`;
    if (offeringId) {
      // Get per-offering alias if available
      const { data: offeringAlias } = await supabaseClient
        .from('developer_offering_investor_aliases')
        .select('alias_code')
        .eq('investor_id', investorId)
        .eq('offering_id', offeringId)
        .maybeSingle();
      
      if (offeringAlias) {
        alias = offeringAlias.alias_code;
      }
    } else {
      // Get general alias if available
      const { data: generalAlias } = await supabaseClient
        .from('developer_investor_aliases')
        .select('alias_name')
        .eq('investor_id', investorId)
        .maybeSingle();
      
      if (generalAlias) {
        alias = generalAlias.alias_name;
      }
    }

    // Get transaction history
    let transactionQuery = supabaseClient
      .from('developer_contribution_events')
      .select('*')
      .eq('investor_id', investorId)
      .order('created_at', { ascending: false });

    // Filter by offering if specified
    if (offeringId) {
      transactionQuery = transactionQuery.eq('offering_id', offeringId);
    }

    const { data: transactions, error: transactionError } = await transactionQuery;
    if (transactionError) throw transactionError;

    // Sanitize transaction data based on user role
    const sanitizedTransactions = transactions.map((tx: any) => {
      if (userRole === 'admin') {
        // Return full transaction data for admins
        return {
          id: tx.id,
          transaction_ref: tx.id.slice(0, 8) + '...' + tx.id.slice(-4),
          date: tx.created_at,
          amount: tx.amount,
          event_type: tx.event_type,
          status: tx.status,
          settlement_status: tx.status === 'completed' ? 'settled' : 'pending',
          payment_method: 'Bank Transfer', // Generic for now
          description: `${tx.event_type} transaction`
        };
      } else {
        // Return sanitized transaction data for developers
        return {
          id: tx.id,
          transaction_ref: tx.id.slice(0, 6) + '***', // Truncated ID
          date: tx.created_at,
          amount: tx.amount,
          event_type: tx.event_type,
          status: tx.status,
          settlement_status: tx.status === 'completed' ? 'settled' : 'pending',
          payment_method: 'Electronic Transfer', // Generic method
          description: `${tx.event_type} transaction`
        };
      }
    });

    // Build response based on user role
    if (userRole === 'admin') {
      // Return full investor details for admins
      const response = {
        id: investor.id,
        alias,
        first_name: investor.first_name,
        last_name: investor.last_name,
        email: investor.email,
        phone: investor.phone,
        status: investor.status,
        investor_type: investor.investor_type,
        joined_date: investor.created_at,
        total_invested: investor.total_invested,
        investment_count: investor.investment_count,
        transactions: sanitizedTransactions,
        // Could add documents here if needed
      };

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // Return sanitized investor details for developers
      const response = {
        id: investor.id,
        alias,
        status: investor.status,
        investor_type: investor.investor_type,
        joined_date: investor.created_at,
        total_invested: investor.total_invested,
        investment_count: investor.investment_count,
        transactions: sanitizedTransactions,
        // Exclude PII fields: first_name, last_name, email, phone
        // Documents would show generic filenames only if implemented
        documents: [] // No documents exposed for developers for now
      };

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error fetching investor details:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch investor details' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function searchOfferingInvestors(supabaseClient: any, offeringId: string, searchTerm: string, userRole: 'admin' | 'developer') {
  try {
    // For developers, only search by alias or transaction ID
    if (userRole === 'developer') {
      // Search by alias code
      const { data: aliasMatches, error: aliasError } = await supabaseClient
        .from('developer_offering_investor_aliases')
        .select('investor_id, alias_code')
        .eq('offering_id', offeringId)
        .ilike('alias_code', `%${searchTerm}%`);

      if (aliasError) throw aliasError;

      // Search by transaction ID (contribution event ID)
      const { data: transactionMatches, error: transactionError } = await supabaseClient
        .from('developer_contribution_events')
        .select('investor_id')
        .eq('offering_id', offeringId)
        .ilike('id', `%${searchTerm}%`);

      if (transactionError) throw transactionError;

      // Combine results
      const investorIds = new Set([
        ...aliasMatches.map((alias: any) => alias.investor_id),
        ...transactionMatches.map((tx: any) => tx.investor_id)
      ]);

      if (investorIds.size === 0) {
        return new Response(JSON.stringify([]), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get investor details
      const [investorsResult, aliasesResult] = await Promise.all([
        supabaseClient
          .from('developer_investors')
          .select('*')
          .in('id', Array.from(investorIds)),
        supabaseClient
          .from('developer_offering_investor_aliases')
          .select('*')
          .eq('offering_id', offeringId)
          .in('investor_id', Array.from(investorIds))
      ]);

      const investors = investorsResult.data || [];
      const aliases = aliasesResult.data || [];

      // Create alias mapping
      const aliasMap = new Map();
      aliases.forEach((alias: any) => {
        aliasMap.set(alias.investor_id, alias.alias_code);
      });

      // Sanitize investor data
      const sanitizedInvestors = investors.map((investor: any) =>
        sanitizeInvestorData(investor, userRole, aliasMap.get(investor.id))
      );

      return new Response(JSON.stringify(sanitizedInvestors), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // Admin can search by name, email, etc.
      const { data: events, error: eventsError } = await supabaseClient
        .from('developer_contribution_events')
        .select('investor_id')
        .eq('offering_id', offeringId)
        .eq('event_type', 'investment');

      if (eventsError) throw eventsError;

      const investorIds = [...new Set(events.map((e: any) => e.investor_id))];

      if (investorIds.length === 0) {
        return new Response(JSON.stringify([]), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Search investors with full text search for admins
      const { data: investors, error: investorsError } = await supabaseClient
        .from('developer_investors')
        .select('*')
        .in('id', investorIds)
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);

      if (investorsError) throw investorsError;

      // Return full data for admins
      const fullInvestors = investors.map((investor: any) =>
        sanitizeInvestorData(investor, userRole)
      );

      return new Response(JSON.stringify(fullInvestors), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error searching offering investors:', error);
    return new Response(JSON.stringify({ error: 'Failed to search investors' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
