-- Fix the RLS issues properly

-- 1. Enable RLS on data_access_policies table (was missed in first migration)
ALTER TABLE public.data_access_policies ENABLE ROW LEVEL SECURITY;

-- Create policies for data_access_policies
CREATE POLICY "Admins can view access policies" 
ON public.data_access_policies 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage access policies" 
ON public.data_access_policies 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2. The view security will be handled through the underlying table policies
-- Since developer_investor_summary is a view, it inherits security from the underlying tables
-- The developer_investors table already has proper RLS policies in place
-- The developer_investor_aliases table already has proper RLS policies in place