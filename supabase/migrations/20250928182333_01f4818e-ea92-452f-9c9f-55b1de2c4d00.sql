-- Create offerings table with relaxed constraints for development
CREATE TABLE public.offerings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.developer_organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT,
  description TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  lat DECIMAL,
  lng DECIMAL,
  type TEXT DEFAULT 'residential',
  tags TEXT[] DEFAULT '{}',
  goal DECIMAL,
  soft_cap DECIMAL,
  hard_cap DECIMAL,
  min_invest DECIMAL DEFAULT 1000,
  step_invest DECIMAL DEFAULT 1000,
  max_invest DECIMAL,
  valuation DECIMAL,
  target_irr DECIMAL,
  equity_multiple DECIMAL,
  hold_years INTEGER,
  distribution_freq TEXT,
  close_date TIMESTAMP WITH TIME ZONE,
  risk_bucket TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_private BOOLEAN DEFAULT false,
  cover_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create offering_media table
CREATE TABLE public.offering_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offering_id UUID NOT NULL REFERENCES public.offerings(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('image', 'video')),
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.offerings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offering_media ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for offerings table
CREATE POLICY "Users can view offerings from their organization"
ON public.offerings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.developer_organization_members
    WHERE user_id = auth.uid() AND organization_id = org_id
  )
);

CREATE POLICY "Users can insert offerings for their organization"
ON public.offerings
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.developer_organization_members
    WHERE user_id = auth.uid() AND organization_id = org_id
  )
);

CREATE POLICY "Users can update offerings from their organization"
ON public.offerings
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.developer_organization_members
    WHERE user_id = auth.uid() AND organization_id = org_id
  )
);

-- Create RLS policies for offering_media table
CREATE POLICY "Users can view media from their organization offerings"
ON public.offering_media
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.offerings o
    JOIN public.developer_organization_members m ON m.organization_id = o.org_id
    WHERE o.id = offering_id AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert media for their organization offerings"
ON public.offering_media
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.offerings o
    JOIN public.developer_organization_members m ON m.organization_id = o.org_id
    WHERE o.id = offering_id AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update media from their organization offerings"
ON public.offering_media
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.offerings o
    JOIN public.developer_organization_members m ON m.organization_id = o.org_id
    WHERE o.id = offering_id AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete media from their organization offerings"
ON public.offering_media
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.offerings o
    JOIN public.developer_organization_members m ON m.organization_id = o.org_id
    WHERE o.id = offering_id AND m.user_id = auth.uid()
  )
);

-- Create storage bucket for offering media
INSERT INTO storage.buckets (id, name, public) 
VALUES ('offering-media', 'offering-media', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Users can upload media for their organization offerings"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'offering-media' AND
  EXISTS (
    SELECT 1 FROM public.developer_organization_members
    WHERE user_id = auth.uid() AND organization_id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Users can view media from their organization offerings"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'offering-media' AND
  EXISTS (
    SELECT 1 FROM public.developer_organization_members
    WHERE user_id = auth.uid() AND organization_id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Users can update media from their organization offerings"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'offering-media' AND
  EXISTS (
    SELECT 1 FROM public.developer_organization_members
    WHERE user_id = auth.uid() AND organization_id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Users can delete media from their organization offerings"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'offering-media' AND
  EXISTS (
    SELECT 1 FROM public.developer_organization_members
    WHERE user_id = auth.uid() AND organization_id::text = (storage.foldername(name))[1]
  )
);

-- Create updated_at trigger for offerings
CREATE TRIGGER update_offerings_updated_at
  BEFORE UPDATE ON public.offerings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Create updated_at trigger for offering_media
CREATE TRIGGER update_offering_media_updated_at
  BEFORE UPDATE ON public.offering_media
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Seed demo organization and membership for development
-- First, create a demo organization
INSERT INTO public.developer_organizations (id, name, description)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Demo Real Estate Co',
  'A demo organization for development and testing'
) ON CONFLICT (id) DO NOTHING;

-- Add current authenticated user to the demo organization as owner
-- This will work when a user is authenticated
INSERT INTO public.developer_organization_members (
  user_id,
  organization_id,
  role
)
SELECT 
  auth.uid(),
  '00000000-0000-0000-0000-000000000001',
  'owner'::developer_role
WHERE auth.uid() IS NOT NULL
ON CONFLICT (user_id, organization_id) DO NOTHING;