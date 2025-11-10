const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-dev-bypass-token',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.55.0?target=deno');
    
    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const authHeader = req.headers.get('Authorization');
    const body = await req.json();
    const { action, organizationId, offeringId, environment = 'production' } = body;

    // Verify authentication
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Extract user from JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Check if PII redaction feature is enabled
    const { data: featureFlag } = await supabase
      .from('feature_flags')
      .select('enabled')
      .eq('flag_name', 'developer_pii_redaction')
      .eq('environment', environment)
      .maybeSingle();

    const piiRedactionEnabled = featureFlag?.enabled || false;

    console.log(`PII Redaction feature flag: ${piiRedactionEnabled} for environment: ${environment}`);

    switch (action) {
      case 'check_feature_flags':
        const { data: flags } = await supabase
          .from('feature_flags')
          .select('*')
          .eq('environment', environment);

        return new Response(
          JSON.stringify({ 
            flags: flags || [],
            pii_redaction_enabled: piiRedactionEnabled
          }),
          { status: 200, headers: corsHeaders }
        );

      case 'toggle_feature_flag':
        const { flagName, enabled } = body;
        
        // Check admin permission
        const { data: adminCheck } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin'
        });

        if (!adminCheck) {
          return new Response(
            JSON.stringify({ error: 'Admin access required' }),
            { status: 403, headers: corsHeaders }
          );
        }

        const { data: updatedFlag, error: updateError } = await supabase
          .from('feature_flags')
          .update({ 
            enabled,
            updated_at: new Date().toISOString()
          })
          .eq('flag_name', flagName)
          .eq('environment', environment)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating feature flag:', updateError);
          return new Response(
            JSON.stringify({ error: 'Failed to update feature flag' }),
            { status: 500, headers: corsHeaders }
          );
        }

        // Auto-purge cache when PII redaction is enabled
        if (flagName === 'developer_pii_redaction' && enabled && organizationId) {
          try {
            const { data: purgeResult } = await supabase.rpc('purge_pii_cache', {
              p_organization_id: organizationId,
              p_offering_id: offeringId || null
            });
            
            console.log(`Purged ${purgeResult} cache entries for organization ${organizationId}`);
          } catch (purgeError) {
            console.error('Cache purge failed:', purgeError);
            // Don't fail the feature flag toggle if cache purge fails
          }
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            flag: updatedFlag,
            cache_purged: enabled && organizationId ? true : false
          }),
          { status: 200, headers: corsHeaders }
        );

      case 'purge_cache':
        if (!organizationId) {
          return new Response(
            JSON.stringify({ error: 'Organization ID required' }),
            { status: 400, headers: corsHeaders }
          );
        }

        const { data: purgeCount, error: purgeError } = await supabase.rpc('purge_pii_cache', {
          p_organization_id: organizationId,
          p_offering_id: offeringId || null
        });

        if (purgeError) {
          console.error('Cache purge error:', purgeError);
          return new Response(
            JSON.stringify({ error: 'Cache purge failed' }),
            { status: 500, headers: corsHeaders }
          );
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            purged_count: purgeCount,
            organization_id: organizationId,
            offering_id: offeringId
          }),
          { status: 200, headers: corsHeaders }
        );

      case 'monitor_access_denials':
        const { data: denials } = await supabase
          .from('admin_audit_log')
          .select('*')
          .ilike('action', '%PII_ACCESS_DENIED%')
          .order('created_at', { ascending: false })
          .limit(50);

        return new Response(
          JSON.stringify({ denials: denials || [] }),
          { status: 200, headers: corsHeaders }
        );

      case 'audit_logs':
        const { data: auditLogs } = await supabase
          .from('admin_audit_log')
          .select('*')
          .in('action', ['PII_ACCESS_DENIED', 'FEATURE_FLAG_ENABLED', 'FEATURE_FLAG_DISABLED', 'cache_purge'])
          .order('created_at', { ascending: false })
          .limit(100);

        return new Response(
          JSON.stringify({ audit_logs: auditLogs || [] }),
          { status: 200, headers: corsHeaders }
        );

      case 'cache_invalidation_logs':
        const { data: cacheLogs } = await supabase
          .from('cache_invalidation_log')
          .select('*')
          .order('invalidated_at', { ascending: false })
          .limit(50);

        return new Response(
          JSON.stringify({ cache_logs: cacheLogs || [] }),
          { status: 200, headers: corsHeaders }
        );

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: corsHeaders }
        );
    }

  } catch (error) {
    console.error('Feature flag management error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: (error as any)?.message || 'unknown'
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});