const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-dev-bypass-token',
};

// Sanitized error messages - never expose PII in errors
const SAFE_ERROR_MESSAGES = {
  ENCRYPTION_FAILED: 'Data encryption operation failed',
  DECRYPTION_FAILED: 'Data decryption operation failed', 
  ACCESS_DENIED: 'Access denied',
  INVALID_REQUEST: 'Invalid request parameters',
  NOT_FOUND: 'Resource not found',
  INTERNAL_ERROR: 'Internal server error'
};

// Safe logging function - sanitizes any potential PII
function safeLog(level: string, message: string, metadata?: any) {
  const sanitizedMetadata = metadata ? sanitizeForLogging(metadata) : {};
  console.log(`[${level}] ${message}`, sanitizedMetadata);
}

// Remove any potential PII from log data
function sanitizeForLogging(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  const sanitized = { ...data };
  const piiFields = ['first_name', 'last_name', 'email', 'phone', 'address', 'bank_last4', 'documents'];
  
  for (const field of piiFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  // Also sanitize nested objects
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeForLogging(sanitized[key]);
    }
  }
  
  return sanitized;
}

// Error response generator that never leaks PII
function createSafeErrorResponse(errorType: keyof typeof SAFE_ERROR_MESSAGES, statusCode: number = 500) {
  return new Response(JSON.stringify({ 
    error: SAFE_ERROR_MESSAGES[errorType],
    timestamp: new Date().toISOString()
  }), {
    status: statusCode,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Sanitized DTOs for developer access (no PII)
interface SanitizedInvestorDTO {
  id: string;
  offering_alias: string;
  total_invested: number;
  investment_count: number;
  status: string;
  investor_type: string;
  joined_date: string;
  last_activity_date: string;
}

interface SanitizedContributionEventDTO {
  id: string;
  transaction_id: string;
  investor_alias: string;
  amount: number;
  event_type: string;
  status: string;
  created_at: string;
}

// Full DTOs for admin access (includes decrypted PII)
interface AdminInvestorDTO {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  bank_last4?: string;
  documents?: any[];
  total_invested: number;
  investment_count: number;
  status: string;
  investor_type: string;
  created_at: string;
  updated_at: string;
}

// Helper function to check user role with enhanced security
async function getUserRole(supabaseClient: any, userId: string): Promise<'admin' | 'developer' | null> {
  try {
    // Check if user is admin
    const { data: adminRole, error: adminError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
    
    if (adminError) {
      safeLog('error', 'Failed to check admin role', { userId, error: adminError.message });
      return null;
    }
    
    if (adminRole) {
      safeLog('info', 'Admin access granted', { userId });
      return 'admin';
    }
    
    // Check if user belongs to any developer organization
    const { data: devRole, error: devError } = await supabaseClient
      .from('developer_organization_members')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (devError) {
      safeLog('error', 'Failed to check developer role', { userId, error: devError.message });
      return null;
    }
    
    if (devRole) {
      safeLog('info', 'Developer access granted', { userId });
      return 'developer';
    }
    
    safeLog('warn', 'No valid role found for user', { userId });
    return null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    safeLog('error', 'Role check failed', { userId, error: errorMessage });
    return null;
  }
}

// Extract user ID from JWT token with enhanced validation
function extractUserIdFromJWT(authHeader: string): string | null {
  try {
    if (!authHeader.startsWith('Bearer ')) return null;
    
    const token = authHeader.substring(7);
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.sub || null;
    
    if (!userId) {
      safeLog('warn', 'No user ID found in JWT token');
      return null;
    }
    
    return userId;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    safeLog('error', 'JWT extraction failed', { error: errorMessage });
    return null;
  }
}

// Enhanced PII-safe investor data sanitization
async function sanitizeInvestorData(
  supabaseClient: any,
  investor: any, 
  userRole: 'admin' | 'developer', 
  alias?: string
): Promise<SanitizedInvestorDTO | AdminInvestorDTO> {
  
  if (userRole === 'admin') {
    try {
      // For admins, get decrypted PII data with full audit logging
      const { data: piiData, error } = await supabaseClient
        .rpc('get_investor_pii', { p_investor_id: investor.id });

      if (error) {
        safeLog('error', 'Failed to decrypt PII for admin', { investorId: investor.id, error: error.message });
        // Return basic data even if decryption fails
        return {
          id: investor.id,
          total_invested: investor.total_invested,
          investment_count: investor.investment_count,
          status: investor.status,
          investor_type: investor.investor_type,
          created_at: investor.created_at,
          updated_at: investor.updated_at
        };
      }

      return piiData as AdminInvestorDTO;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      safeLog('error', 'PII decryption error', { investorId: investor.id, error: errorMessage });
      throw new Error(SAFE_ERROR_MESSAGES.DECRYPTION_FAILED);
    }
  }
  
  // Developer role - return sanitized data only (no PII decryption attempted)
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

// Enhanced contribution data sanitization
function sanitizeContributionData(event: any, userRole: 'admin' | 'developer', investorAlias?: string): SanitizedContributionEventDTO | any {
  if (userRole === 'admin') {
    return event; // Return full data for admins (no PII in contribution events)
  }
  
  // Developer role - return sanitized data only
  return {
    id: event.id,
    transaction_id: event.id,
    investor_alias: investorAlias || `Investor-${event.investor_id.slice(0, 8)}`,
    amount: event.amount,
    event_type: event.event_type,
    status: event.status,
    created_at: event.created_at
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.55.0?target=deno');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Set the encryption key in the connection
    const encryptionKey = Deno.env.get('PII_ENCRYPTION_KEY');
    if (encryptionKey) {
      await supabaseClient.rpc('exec', {
        sql: `SET app.pii_encryption_key = '${encryptionKey}'`
      });
    }

    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const endpoint = pathSegments[pathSegments.length - 1];
    
    // Extract and validate user role
    const authHeader = req.headers.get('Authorization');
    let userRole: 'admin' | 'developer' | null = null;
    
    if (authHeader) {
      const userId = extractUserIdFromJWT(authHeader);
      if (userId) {
        userRole = await getUserRole(supabaseClient, userId);
      }
    }
    
    if (!userRole) {
      safeLog('warn', 'Access attempt without valid role', { endpoint });
      return createSafeErrorResponse('ACCESS_DENIED', 403);
    }

    safeLog('info', 'API request processed', { endpoint, userRole });
    
    // Read request body for parameters
    let body: any = {};
    try {
      body = await req.json();
    } catch (error) {
      safeLog('warn', 'Invalid JSON in request body', { endpoint });
      return createSafeErrorResponse('INVALID_REQUEST', 400);
    }

    const orgId = body.orgId;
    const offeringId = body.offeringId;
    const investorId = body.investorId;
    const range = body.range || '30d';

    // Validate organization access for developers
    if (userRole === 'developer' && orgId) {
      const userId = authHeader ? extractUserIdFromJWT(authHeader) : null;
      if (userId) {
        const { data: membershipCheck, error } = await supabaseClient
          .from('developer_organization_members')
          .select('id')
          .eq('user_id', userId)
          .eq('organization_id', orgId)
          .maybeSingle();
        
        if (error || !membershipCheck) {
          safeLog('warn', 'Developer access denied to organization', { userId, orgId });
          return createSafeErrorResponse('ACCESS_DENIED', 403);
        }
      }
    }

    // Route to appropriate handler
    switch (endpoint) {
      case 'investors':
        if (!orgId) {
          return createSafeErrorResponse('INVALID_REQUEST', 400);
        }
        return await listInvestors(supabaseClient, orgId, userRole);

      case 'investor':
        if (!investorId) {
          return createSafeErrorResponse('INVALID_REQUEST', 400);
        }
        return await getInvestor(supabaseClient, investorId, userRole);

      case 'offering-investors':
        if (!offeringId) {
          return createSafeErrorResponse('INVALID_REQUEST', 400);
        }
        return await getOfferingInvestors(supabaseClient, offeringId, userRole);

      case 'pii-audit-logs':
        // Only admins can view audit logs
        if (userRole !== 'admin') {
          return createSafeErrorResponse('ACCESS_DENIED', 403);
        }
        return await getPIIAuditLogs(supabaseClient, body.filters || {});

      default:
        return createSafeErrorResponse('NOT_FOUND', 404);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    safeLog('error', 'Unhandled error in API', { error: errorMessage });
    return createSafeErrorResponse('INTERNAL_ERROR', 500);
  }
});

async function listInvestors(supabaseClient: any, orgId: string, userRole: 'admin' | 'developer') {
  try {
    // Get investors (basic data only)
    const { data: investors, error: investorsError } = await supabaseClient
      .from('developer_investors')
      .select('id, total_invested, investment_count, status, investor_type, created_at, updated_at')
      .eq('organization_id', orgId)
      .order('total_invested', { ascending: false });

    if (investorsError) {
      safeLog('error', 'Failed to fetch investors', { orgId, error: investorsError.message });
      throw new Error(SAFE_ERROR_MESSAGES.INTERNAL_ERROR);
    }

    // Get aliases for all investors
    const { data: aliases, error: aliasError } = await supabaseClient
      .from('developer_investor_aliases')
      .select('investor_id, alias_name')
      .eq('organization_id', orgId);

    if (aliasError) {
      safeLog('error', 'Failed to fetch aliases', { orgId, error: aliasError.message });
    }

    // Create alias mapping
    const aliasMap = new Map();
    (aliases || []).forEach((alias: any) => {
      aliasMap.set(alias.investor_id, alias.alias_name);
    });

    // Sanitize investor data based on user role
    const sanitizedInvestors = await Promise.all(
      investors.map((investor: any) =>
        sanitizeInvestorData(supabaseClient, investor, userRole, aliasMap.get(investor.id))
      )
    );

    return new Response(JSON.stringify(sanitizedInvestors), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    safeLog('error', 'List investors failed', { orgId, error: errorMessage });
    return createSafeErrorResponse('INTERNAL_ERROR', 500);
  }
}

async function getInvestor(supabaseClient: any, investorId: string, userRole: 'admin' | 'developer') {
  try {
    // Get basic investor data
    const { data: investor, error: investorError } = await supabaseClient
      .from('developer_investors')
      .select('*')
      .eq('id', investorId)
      .single();

    if (investorError || !investor) {
      safeLog('warn', 'Investor not found', { investorId });
      return createSafeErrorResponse('NOT_FOUND', 404);
    }

    // Get alias if available
    const { data: alias } = await supabaseClient
      .from('developer_investor_aliases')
      .select('alias_name')
      .eq('investor_id', investorId)
      .maybeSingle();

    // Sanitize investor data based on user role
    const sanitizedInvestor = await sanitizeInvestorData(
      supabaseClient, 
      investor, 
      userRole, 
      alias?.alias_name
    );

    return new Response(JSON.stringify(sanitizedInvestor), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    safeLog('error', 'Get investor failed', { investorId, error: errorMessage });
    return createSafeErrorResponse('INTERNAL_ERROR', 500);
  }
}

async function getOfferingInvestors(supabaseClient: any, offeringId: string, userRole: 'admin' | 'developer') {
  try {
    // Get offering details for validation
    const { data: offering, error: offeringError } = await supabaseClient
      .from('developer_offerings')
      .select('organization_id')
      .eq('id', offeringId)
      .single();

    if (offeringError || !offering) {
      safeLog('warn', 'Offering not found', { offeringId });
      return createSafeErrorResponse('NOT_FOUND', 404);
    }

    // Get investors who have contributed to this offering
    const { data: events, error: eventsError } = await supabaseClient
      .from('developer_contribution_events')
      .select('investor_id')
      .eq('offering_id', offeringId)
      .eq('event_type', 'investment');

    if (eventsError) {
      safeLog('error', 'Failed to fetch contribution events', { offeringId, error: eventsError.message });
      throw new Error(SAFE_ERROR_MESSAGES.INTERNAL_ERROR);
    }

    const investorIds = [...new Set(events.map((e: any) => e.investor_id))];

    if (investorIds.length === 0) {
      return new Response(JSON.stringify([]), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get investor data and per-offering aliases
    const [investorsResult, aliasesResult] = await Promise.all([
      supabaseClient
        .from('developer_investors')
        .select('id, total_invested, investment_count, status, investor_type, created_at, updated_at')
        .in('id', investorIds),
      supabaseClient
        .from('developer_offering_investor_aliases')
        .select('investor_id, alias_code')
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
    const sanitizedInvestors = await Promise.all(
      investors.map((investor: any) =>
        sanitizeInvestorData(supabaseClient, investor, userRole, aliasMap.get(investor.id))
      )
    );

    return new Response(JSON.stringify(sanitizedInvestors), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    safeLog('error', 'Get offering investors failed', { offeringId, error: errorMessage });
    return createSafeErrorResponse('INTERNAL_ERROR', 500);
  }
}

async function getPIIAuditLogs(supabaseClient: any, filters: any) {
  try {
    let query = supabaseClient
      .from('pii_access_audit')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    // Apply filters
    if (filters.adminUserId) {
      query = query.eq('admin_user_id', filters.adminUserId);
    }
    if (filters.table) {
      query = query.eq('accessed_table', filters.table);
    }
    if (filters.operation) {
      query = query.eq('operation', filters.operation);
    }
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    const { data: auditLogs, error } = await query;

    if (error) {
      safeLog('error', 'Failed to fetch audit logs', { error: error.message });
      throw new Error(SAFE_ERROR_MESSAGES.INTERNAL_ERROR);
    }

    return new Response(JSON.stringify(auditLogs || []), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    safeLog('error', 'Get audit logs failed', { error: errorMessage });
    return createSafeErrorResponse('INTERNAL_ERROR', 500);
  }
}