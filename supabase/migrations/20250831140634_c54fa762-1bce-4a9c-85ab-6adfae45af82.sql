-- Fix critical security issue: Properly secure waitlist_signups table
-- Drop the existing permissive admin_select policy that allows any authenticated user access
DROP POLICY IF EXISTS admin_select ON public.waitlist_signups;

-- Create a truly restrictive policy that ONLY allows admin users to select data
CREATE POLICY admin_select_restrictive ON public.waitlist_signups
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create audit log table for tracking admin access to sensitive data
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id uuid NOT NULL,
  action text NOT NULL,
  table_name text NOT NULL,
  resource_id uuid,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on audit log table
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
DROP POLICY IF EXISTS admin_audit_log_select ON public.admin_audit_log;
CREATE POLICY admin_audit_log_select ON public.admin_audit_log
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can insert audit logs
DROP POLICY IF EXISTS admin_audit_log_insert ON public.admin_audit_log;
CREATE POLICY admin_audit_log_insert ON public.admin_audit_log
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND admin_user_id = auth.uid());

-- Create function to log admin access (returns boolean for success tracking)
CREATE OR REPLACE FUNCTION public.log_admin_access(
  p_action text,
  p_table_name text,
  p_resource_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log if user is actually an admin
  IF has_role(auth.uid(), 'admin'::app_role) THEN
    INSERT INTO public.admin_audit_log (
      admin_user_id,
      action,
      table_name,
      resource_id,
      ip_address,
      user_agent
    ) VALUES (
      auth.uid(),
      p_action,
      p_table_name,
      p_resource_id,
      inet_client_addr(),
      current_setting('request.headers', true)::json->>'user-agent'
    );
    RETURN true;
  END IF;
  RETURN false;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't let audit logging failures block the main operation
    RETURN false;
END;
$$;

-- Add indexes for better audit log performance
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_user_created ON public.admin_audit_log(admin_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_table_created ON public.admin_audit_log(table_name, created_at DESC);

-- Add rate limiting table for authentication attempts
CREATE TABLE IF NOT EXISTS public.auth_rate_limit (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address inet NOT NULL,
  attempt_count integer NOT NULL DEFAULT 1,
  last_attempt timestamp with time zone NOT NULL DEFAULT now(),
  blocked_until timestamp with time zone
);

-- Enable RLS on rate limit table
ALTER TABLE public.auth_rate_limit ENABLE ROW LEVEL SECURITY;

-- Only system can access rate limit data
CREATE POLICY auth_rate_limit_system_only ON public.auth_rate_limit
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- Add index for rate limiting performance
CREATE INDEX IF NOT EXISTS idx_auth_rate_limit_ip_attempt ON public.auth_rate_limit(ip_address, last_attempt DESC);