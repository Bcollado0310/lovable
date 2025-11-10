-- Create developer organizations table
CREATE TABLE public.developer_organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  website TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create enum for developer roles
CREATE TYPE public.developer_role AS ENUM ('owner', 'manager', 'editor', 'viewer');

-- Create developer organization members table
CREATE TABLE public.developer_organization_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  organization_id UUID NOT NULL REFERENCES public.developer_organizations(id) ON DELETE CASCADE,
  role developer_role NOT NULL DEFAULT 'viewer',
  invited_by UUID,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, organization_id)
);

-- Enable RLS on both tables
ALTER TABLE public.developer_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developer_organization_members ENABLE ROW LEVEL SECURITY;

-- Create function to check if user has developer role in organization
CREATE OR REPLACE FUNCTION public.has_developer_role(_user_id UUID, _org_id UUID, _role developer_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.developer_organization_members
    WHERE user_id = _user_id
      AND organization_id = _org_id
      AND role = _role
  )
$$;

-- Create function to check if user belongs to organization
CREATE OR REPLACE FUNCTION public.belongs_to_organization(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.developer_organization_members
    WHERE user_id = _user_id
      AND organization_id = _org_id
  )
$$;

-- Create function to get user's role in organization
CREATE OR REPLACE FUNCTION public.get_user_org_role(_user_id UUID, _org_id UUID)
RETURNS developer_role
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.developer_organization_members
  WHERE user_id = _user_id
    AND organization_id = _org_id
  LIMIT 1
$$;

-- RLS Policies for developer_organizations
CREATE POLICY "Users can view their organization" 
ON public.developer_organizations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.developer_organization_members 
    WHERE organization_id = id AND user_id = auth.uid()
  )
);

CREATE POLICY "Owners and managers can update organization" 
ON public.developer_organizations 
FOR UPDATE 
USING (
  has_developer_role(auth.uid(), id, 'owner') OR
  has_developer_role(auth.uid(), id, 'manager')
);

CREATE POLICY "Authenticated users can create organizations" 
ON public.developer_organizations 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for developer_organization_members
CREATE POLICY "Users can view members of their organization" 
ON public.developer_organization_members 
FOR SELECT 
USING (belongs_to_organization(auth.uid(), organization_id));

CREATE POLICY "Owners and managers can manage members" 
ON public.developer_organization_members 
FOR ALL 
USING (
  has_developer_role(auth.uid(), organization_id, 'owner') OR
  has_developer_role(auth.uid(), organization_id, 'manager')
)
WITH CHECK (
  has_developer_role(auth.uid(), organization_id, 'owner') OR
  has_developer_role(auth.uid(), organization_id, 'manager')
);

-- Create trigger for updated_at timestamps
CREATE TRIGGER set_developer_organizations_updated_at
  BEFORE UPDATE ON public.developer_organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_developer_organization_members_updated_at
  BEFORE UPDATE ON public.developer_organization_members
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();