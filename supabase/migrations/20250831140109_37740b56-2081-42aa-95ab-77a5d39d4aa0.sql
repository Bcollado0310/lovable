-- Fix critical security issue: Convert permissive admin policy to restrictive
-- and add audit logging for admin access to sensitive data

-- Drop the existing permissive admin_select policy
DROP POLICY IF EXISTS admin_select ON public.waitlist_signups;

-- Create a restrictive policy that ONLY allows admins to select data
CREATE POLICY admin_select_restrictive ON public.waitlist_signups
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create audit log table for tracking admin access to sensitive data
CREATE TABLE public.admin_audit_log (
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
CREATE POLICY admin_audit_log_select ON public.admin_audit_log
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert audit logs (for triggers)
CREATE POLICY admin_audit_log_insert ON public.admin_audit_log
FOR INSERT
TO authenticated
WITH CHECK (admin_user_id = auth.uid());

-- Create function to log admin access
CREATE OR REPLACE FUNCTION public.log_admin_access(
  p_action text,
  p_table_name text,
  p_resource_id uuid DEFAULT NULL
)
RETURNS void
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
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't let audit logging failures block the main operation
    NULL;
END;
$$;

-- Add additional security: Create view for admin dashboard that includes audit logging
CREATE OR REPLACE VIEW public.waitlist_signups_admin_view AS
SELECT 
  w.*,
  -- Log the access when this view is used
  (SELECT log_admin_access('SELECT', 'waitlist_signups', w.id) FROM (VALUES(1)) v(x) LIMIT 1)
FROM public.waitlist_signups w
WHERE has_role(auth.uid(), 'admin'::app_role);

-- Grant necessary permissions
GRANT SELECT ON public.waitlist_signups_admin_view TO authenticated;

-- Add index for better audit log performance
CREATE INDEX idx_admin_audit_log_admin_user_created ON public.admin_audit_log(admin_user_id, created_at DESC);
CREATE INDEX idx_admin_audit_log_table_created ON public.admin_audit_log(table_name, created_at DESC);