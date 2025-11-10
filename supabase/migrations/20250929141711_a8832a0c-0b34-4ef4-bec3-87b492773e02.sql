-- Create feature flags table for controlling PII redaction rollout
CREATE TABLE public.feature_flags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flag_name TEXT NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  environment TEXT NOT NULL DEFAULT 'staging',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on feature flags
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Only admins can manage feature flags
CREATE POLICY "Admins can manage feature flags"
ON public.feature_flags
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create cache invalidation tracking table
CREATE TABLE public.cache_invalidation_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT NOT NULL,
  invalidation_reason TEXT NOT NULL,
  invalidated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  invalidated_by UUID REFERENCES auth.users(id),
  organization_id UUID,
  offering_id UUID
);

-- Enable RLS on cache invalidation log
ALTER TABLE public.cache_invalidation_log ENABLE ROW LEVEL SECURITY;

-- Admins can view all cache invalidation logs
CREATE POLICY "Admins can view cache invalidation logs"
ON public.cache_invalidation_log
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can view logs for their organization
CREATE POLICY "Users can view their org cache logs"
ON public.cache_invalidation_log
FOR SELECT
TO authenticated
USING (
  organization_id IS NOT NULL AND 
  belongs_to_organization(auth.uid(), organization_id)
);

-- Insert initial feature flags
INSERT INTO public.feature_flags (flag_name, enabled, environment, description) VALUES
('developer_pii_redaction', false, 'staging', 'Enable PII redaction for developer roles'),
('enhanced_search_aliases', false, 'staging', 'Enable alias-based search functionality'),
('cache_purge_on_pii_access', false, 'staging', 'Auto-purge caches when PII is accessed');

-- Create function to check if feature flag is enabled
CREATE OR REPLACE FUNCTION public.is_feature_enabled(flag_name TEXT, env TEXT DEFAULT 'production')
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT enabled
  FROM public.feature_flags
  WHERE feature_flags.flag_name = is_feature_enabled.flag_name
    AND environment = env
  LIMIT 1;
$$;

-- Backfill existing investor aliases
SELECT public.backfill_offering_investor_aliases();

-- Create search index for aliases and enhanced search
CREATE INDEX IF NOT EXISTS idx_offering_investor_aliases_search 
ON public.developer_offering_investor_aliases 
USING gin(to_tsvector('english', alias_code));

CREATE INDEX IF NOT EXISTS idx_contribution_events_search 
ON public.developer_contribution_events (offering_id, investor_id, amount, created_at);

-- Function to purge cache entries
CREATE OR REPLACE FUNCTION public.purge_pii_cache(p_organization_id UUID, p_offering_id UUID DEFAULT NULL)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  purged_count INTEGER := 0;
  cache_keys TEXT[];
BEGIN
  -- Verify admin access or organization membership
  IF NOT (has_role(auth.uid(), 'admin'::app_role) OR belongs_to_organization(auth.uid(), p_organization_id)) THEN
    RAISE EXCEPTION 'Access denied: Insufficient permissions to purge cache';
  END IF;

  -- Build cache key patterns to purge
  cache_keys := ARRAY[
    'investors:' || p_organization_id::text,
    'investor_details:' || p_organization_id::text || ':*',
    'offering_investors:' || COALESCE(p_offering_id::text, '*'),
    'investor_search:' || p_organization_id::text || ':*',
    'investor_export:' || p_organization_id::text || ':*'
  ];

  -- Log cache invalidation (simulate purging - real implementation would use Redis/Memcached)
  FOR i IN 1..array_length(cache_keys, 1) LOOP
    INSERT INTO public.cache_invalidation_log (
      cache_key,
      invalidation_reason,
      invalidated_by,
      organization_id,
      offering_id
    ) VALUES (
      cache_keys[i],
      'PII redaction rollout - preventive purge',
      auth.uid(),
      p_organization_id,
      p_offering_id
    );
    purged_count := purged_count + 1;
  END LOOP;

  -- Audit the cache purge operation
  PERFORM log_admin_access('cache_purge', 'cache_invalidation_log', p_organization_id);

  RETURN purged_count;
END;
$$;

-- Function to monitor PII access denials
CREATE OR REPLACE FUNCTION public.log_pii_access_denial(
  p_user_id UUID,
  p_resource_type TEXT,
  p_resource_id UUID,
  p_denial_reason TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_audit_log (
    admin_user_id,
    action,
    table_name,
    resource_id,
    ip_address,
    user_agent
  ) VALUES (
    COALESCE(p_user_id, auth.uid()),
    'PII_ACCESS_DENIED: ' || p_denial_reason,
    p_resource_type,
    p_resource_id,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't let audit logging failures block the denial
    RETURN false;
END;
$$;

-- Trigger to automatically update feature flag timestamps
CREATE OR REPLACE FUNCTION public.update_feature_flag_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  
  -- Log feature flag changes
  IF NEW.enabled != OLD.enabled THEN
    PERFORM log_admin_access(
      'FEATURE_FLAG_' || CASE WHEN NEW.enabled THEN 'ENABLED' ELSE 'DISABLED' END,
      'feature_flags',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER feature_flags_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION public.update_feature_flag_timestamp();