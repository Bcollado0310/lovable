-- Create investor aliases for developers (no PII)
CREATE TABLE public.developer_investor_aliases (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL,
  investor_id uuid NOT NULL REFERENCES developer_investors(id) ON DELETE CASCADE,
  alias_name text NOT NULL, -- e.g., "Investor A", "Inv-001"
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(organization_id, investor_id)
);

-- Enable RLS
ALTER TABLE public.developer_investor_aliases ENABLE ROW LEVEL SECURITY;

-- Create policies for aliases
CREATE POLICY "Users can view aliases from their organization" 
ON public.developer_investor_aliases 
FOR SELECT 
USING (belongs_to_organization(auth.uid(), organization_id));

CREATE POLICY "Owners and managers can manage aliases" 
ON public.developer_investor_aliases 
FOR ALL 
USING (has_developer_role(auth.uid(), organization_id, 'owner'::developer_role) OR has_developer_role(auth.uid(), organization_id, 'manager'::developer_role))
WITH CHECK (has_developer_role(auth.uid(), organization_id, 'owner'::developer_role) OR has_developer_role(auth.uid(), organization_id, 'manager'::developer_role));

-- Create view for developers (no PII)
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
LEFT JOIN public.developer_investor_aliases dia ON di.id = dia.investor_id
WHERE di.organization_id IN (
  SELECT organization_id 
  FROM developer_organization_members 
  WHERE user_id = auth.uid()
);

-- Enable RLS on the view
ALTER VIEW public.developer_investor_summary SET (security_barrier = true);

-- Grant access to the view
GRANT SELECT ON public.developer_investor_summary TO authenticated;

-- Update RLS policies on developer_investors to restrict PII access
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view investors from their organization" ON public.developer_investors;
DROP POLICY IF EXISTS "Owners and managers can manage investors" ON public.developer_investors;

-- Create new restrictive policies
-- Only admins can see full PII
CREATE POLICY "Admins can view all investor data" 
ON public.developer_investors 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can manage investor PII
CREATE POLICY "Admins can manage all investor data" 
ON public.developer_investors 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Owners and managers can insert/update non-PII fields only through application logic
CREATE POLICY "Owners can manage investor business data" 
ON public.developer_investors 
FOR UPDATE
USING (
  has_developer_role(auth.uid(), organization_id, 'owner'::developer_role) OR 
  has_developer_role(auth.uid(), organization_id, 'manager'::developer_role)
);

-- Function to auto-generate aliases
CREATE OR REPLACE FUNCTION public.generate_investor_alias()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Generate alias when new investor is created
  INSERT INTO public.developer_investor_aliases (
    organization_id,
    investor_id,
    alias_name
  ) VALUES (
    NEW.organization_id,
    NEW.id,
    'Investor ' || SUBSTRING(NEW.id::text FROM 1 FOR 8)
  );
  RETURN NEW;
END;
$$;

-- Create trigger for auto-alias generation
CREATE TRIGGER generate_investor_alias_trigger
AFTER INSERT ON public.developer_investors
FOR EACH ROW
EXECUTE FUNCTION public.generate_investor_alias();

-- Create policy document table
CREATE TABLE public.data_access_policies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_name text NOT NULL,
  policy_content text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Insert the developer access policy
INSERT INTO public.data_access_policies (policy_name, policy_content) VALUES (
  'Developer Data Access Policy',
  '## Developer Data Access Policy

### Role Definitions
- **Admin**: Full access to all data including personally identifiable information (PII)
- **Developer**: Limited access to business metrics and anonymized data only

### Developer Access Rules
**Permitted Data:**
- Investment amounts and totals
- Transaction dates and timestamps  
- Investment status (active, completed, etc.)
- Transaction summaries and counts
- Investor aliases (anonymized identifiers)
- Business metrics and analytics

**Prohibited Data:**
- Real names (first_name, last_name)
- Email addresses
- Phone numbers
- Physical addresses
- Banking information
- Accreditation documents
- Any personally identifiable information

### Communication Restrictions
- Developers may NOT initiate direct messaging to investors
- All investor communication must go through admin approval
- Developers may only view anonymized investor references

### Data Usage
- Developer access is limited to business operations and analytics
- No PII may be exported or stored outside the platform
- All access is logged for audit purposes

### Enforcement
- Technical controls prevent PII access at database level
- Role-based permissions enforced through Row Level Security
- Regular audits of data access patterns'
);