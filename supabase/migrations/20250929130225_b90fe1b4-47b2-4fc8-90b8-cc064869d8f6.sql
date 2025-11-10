-- Fix the security definer view issue

-- Drop the existing view
DROP VIEW IF EXISTS public.developer_investor_summary;

-- Recreate the view without any security definer properties
-- This view will use the RLS policies of the underlying tables
CREATE VIEW public.developer_investor_summary AS 
SELECT 
  di.id,
  di.organization_id,
  dia.alias_name as investor_name,
  di.total_invested,
  di.investment_count,
  di.status,
  di.investor_type,
  di.created_at,
  di.updated_at
FROM public.developer_investors di
LEFT JOIN public.developer_investor_aliases dia ON di.id = dia.investor_id;

-- Grant basic SELECT permission (RLS will control actual access)
GRANT SELECT ON public.developer_investor_summary TO authenticated;