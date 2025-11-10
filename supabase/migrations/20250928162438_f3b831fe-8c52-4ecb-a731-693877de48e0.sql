-- Create offerings table for the developer portal
CREATE TABLE public.developer_offerings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.developer_organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  property_type TEXT NOT NULL DEFAULT 'residential',
  target_amount NUMERIC NOT NULL,
  raised_amount NUMERIC NOT NULL DEFAULT 0,
  minimum_investment NUMERIC NOT NULL DEFAULT 1000,
  expected_annual_return NUMERIC,
  status TEXT NOT NULL DEFAULT 'coming_soon' CHECK (status IN ('coming_soon', 'active', 'funded', 'closed')),
  funding_deadline TIMESTAMP WITH TIME ZONE,
  images TEXT[] DEFAULT '{}',
  documents TEXT[] DEFAULT '{}',
  investor_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create developer investors table
CREATE TABLE public.developer_investors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.developer_organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  total_invested NUMERIC NOT NULL DEFAULT 0,
  investment_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  investor_type TEXT NOT NULL DEFAULT 'individual' CHECK (investor_type IN ('individual', 'institutional', 'accredited')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contribution events table
CREATE TABLE public.developer_contribution_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.developer_organizations(id) ON DELETE CASCADE,
  offering_id UUID NOT NULL REFERENCES public.developer_offerings(id) ON DELETE CASCADE,
  investor_id UUID NOT NULL REFERENCES public.developer_investors(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'investment' CHECK (event_type IN ('investment', 'distribution', 'refund')),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.developer_offerings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developer_investors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developer_contribution_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for developer_offerings
CREATE POLICY "Users can view offerings from their organization"
ON public.developer_offerings
FOR SELECT
USING (belongs_to_organization(auth.uid(), organization_id));

CREATE POLICY "Owners and managers can manage offerings"
ON public.developer_offerings
FOR ALL
USING (
  has_developer_role(auth.uid(), organization_id, 'owner'::developer_role) OR
  has_developer_role(auth.uid(), organization_id, 'manager'::developer_role) OR
  has_developer_role(auth.uid(), organization_id, 'editor'::developer_role)
)
WITH CHECK (
  has_developer_role(auth.uid(), organization_id, 'owner'::developer_role) OR
  has_developer_role(auth.uid(), organization_id, 'manager'::developer_role) OR
  has_developer_role(auth.uid(), organization_id, 'editor'::developer_role)
);

-- Create RLS policies for developer_investors
CREATE POLICY "Users can view investors from their organization"
ON public.developer_investors
FOR SELECT
USING (belongs_to_organization(auth.uid(), organization_id));

CREATE POLICY "Owners and managers can manage investors"
ON public.developer_investors
FOR ALL
USING (
  has_developer_role(auth.uid(), organization_id, 'owner'::developer_role) OR
  has_developer_role(auth.uid(), organization_id, 'manager'::developer_role) OR
  has_developer_role(auth.uid(), organization_id, 'editor'::developer_role)
)
WITH CHECK (
  has_developer_role(auth.uid(), organization_id, 'owner'::developer_role) OR
  has_developer_role(auth.uid(), organization_id, 'manager'::developer_role) OR
  has_developer_role(auth.uid(), organization_id, 'editor'::developer_role)
);

-- Create RLS policies for developer_contribution_events
CREATE POLICY "Users can view contribution events from their organization"
ON public.developer_contribution_events
FOR SELECT
USING (belongs_to_organization(auth.uid(), organization_id));

CREATE POLICY "Owners and managers can manage contribution events"
ON public.developer_contribution_events
FOR ALL
USING (
  has_developer_role(auth.uid(), organization_id, 'owner'::developer_role) OR
  has_developer_role(auth.uid(), organization_id, 'manager'::developer_role) OR
  has_developer_role(auth.uid(), organization_id, 'editor'::developer_role)
)
WITH CHECK (
  has_developer_role(auth.uid(), organization_id, 'owner'::developer_role) OR
  has_developer_role(auth.uid(), organization_id, 'manager'::developer_role) OR
  has_developer_role(auth.uid(), organization_id, 'editor'::developer_role)
);

-- Create triggers for updated_at
CREATE TRIGGER update_developer_offerings_updated_at
  BEFORE UPDATE ON public.developer_offerings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_developer_investors_updated_at
  BEFORE UPDATE ON public.developer_investors
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Insert the demo organization first with a proper UUID
INSERT INTO public.developer_organizations (id, name, description, website)
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'Demo Development Company', 'A demo organization for development purposes', 'https://demo-dev.com')
ON CONFLICT (id) DO NOTHING;

-- Insert demo data with proper UUID
INSERT INTO public.developer_offerings (
  organization_id, title, description, location, property_type, target_amount, raised_amount, 
  minimum_investment, expected_annual_return, status, funding_deadline, investor_count
) VALUES
  -- Active offering
  ('550e8400-e29b-41d4-a716-446655440000', 'Sunset Gardens Residences', 'Luxury residential complex with 120 units in prime downtown location. Features modern amenities, rooftop garden, and sustainable design elements.', 'Downtown San Francisco, CA', 'residential', 15000000, 8500000, 5000, 8.5, 'active', now() + interval '45 days', 47),
  
  -- Fully funded offering
  ('550e8400-e29b-41d4-a716-446655440000', 'Marina Bay Commercial Center', 'Premium office complex with ground-floor retail space. Fully leased to Fortune 500 companies with 15-year agreements.', 'Marina District, San Francisco, CA', 'commercial', 25000000, 25000000, 10000, 9.2, 'funded', now() - interval '30 days', 89),
  
  -- Coming soon offering
  ('550e8400-e29b-41d4-a716-446655440000', 'Green Valley Eco Homes', 'Sustainable residential development featuring 80 eco-friendly homes with solar panels, smart home technology, and community gardens.', 'Palo Alto, CA', 'residential', 12000000, 0, 2500, 7.8, 'coming_soon', now() + interval '90 days', 0);

-- Insert demo investors with proper organization UUID
INSERT INTO public.developer_investors (
  organization_id, first_name, last_name, email, phone, total_invested, investment_count, status, investor_type
) 
SELECT 
  '550e8400-e29b-41d4-a716-446655440000',
  first_names.name,
  last_names.name,
  lower(first_names.name || '.' || last_names.name || '@email.com'),
  '+1-555-' || lpad((random() * 9999)::text, 4, '0'),
  (random() * 500000 + 10000)::numeric(10,2),
  (random() * 5 + 1)::integer,
  (ARRAY['active', 'active', 'active', 'inactive'])[floor(random() * 4 + 1)],
  (ARRAY['individual', 'individual', 'accredited', 'institutional'])[floor(random() * 4 + 1)]
FROM 
  (VALUES 
    ('James'), ('Sarah'), ('Michael'), ('Emily'), ('David'), ('Jessica'), ('Robert'), ('Ashley'),
    ('John'), ('Michelle'), ('William'), ('Amanda'), ('Richard'), ('Stephanie'), ('Thomas'), ('Jennifer'),
    ('Christopher'), ('Lisa'), ('Daniel'), ('Nicole'), ('Matthew'), ('Elizabeth'), ('Anthony'), ('Helen'),
    ('Mark'), ('Sharon'), ('Donald'), ('Donna'), ('Steven'), ('Carol'), ('Paul'), ('Ruth'), ('Andrew'), ('Sandra'),
    ('Joshua'), ('Maria'), ('Kenneth'), ('Susan'), ('Kevin'), ('Karen'), ('Brian'), ('Nancy'), ('George'), ('Betty'),
    ('Edward'), ('Dorothy'), ('Ronald'), ('Kimberly'), ('Timothy'), ('Linda'), ('Jason'), ('Margaret'), ('Jeffrey'), ('Patricia')
  ) AS first_names(name)
CROSS JOIN
  (VALUES 
    ('Smith'), ('Johnson'), ('Williams'), ('Brown'), ('Jones'), ('Garcia'), ('Miller'), ('Davis'),
    ('Rodriguez'), ('Martinez'), ('Hernandez'), ('Lopez'), ('Gonzalez'), ('Wilson'), ('Anderson'), ('Thomas'),
    ('Taylor'), ('Moore'), ('Jackson'), ('Martin'), ('Lee'), ('Perez'), ('Thompson'), ('White'),
    ('Harris'), ('Sanchez'), ('Clark'), ('Ramirez'), ('Lewis'), ('Robinson'), ('Walker'), ('Young'),
    ('Allen'), ('King'), ('Wright'), ('Scott'), ('Torres'), ('Nguyen'), ('Hill'), ('Flores'),
    ('Green'), ('Adams'), ('Nelson'), ('Baker'), ('Hall'), ('Rivera'), ('Campbell'), ('Mitchell'),
    ('Carter'), ('Roberts'), ('Gomez'), ('Phillips'), ('Evans'), ('Turner'), ('Diaz'), ('Parker')
  ) AS last_names(name)
ORDER BY random()
LIMIT 45;

-- Insert demo contribution events using the proper organization UUID
DO $$
DECLARE
    org_id UUID := '550e8400-e29b-41d4-a716-446655440000';
    offering_ids UUID[];
    investor_ids UUID[];
    i INT;
BEGIN
    -- Get offering IDs
    SELECT ARRAY(SELECT id FROM public.developer_offerings WHERE organization_id = org_id) INTO offering_ids;
    
    -- Get investor IDs  
    SELECT ARRAY(SELECT id FROM public.developer_investors WHERE organization_id = org_id) INTO investor_ids;
    
    -- Insert 350 contribution events
    FOR i IN 1..350 LOOP
        INSERT INTO public.developer_contribution_events (
            organization_id, 
            offering_id, 
            investor_id, 
            amount, 
            event_type, 
            status
        ) VALUES (
            org_id,
            offering_ids[1 + (random() * (array_length(offering_ids, 1) - 1))::int],
            investor_ids[1 + (random() * (array_length(investor_ids, 1) - 1))::int],
            (random() * 75000 + 2500)::numeric(10,2),
            (ARRAY['investment', 'distribution'])[1 + (random() * 1)::int],
            'completed'
        );
    END LOOP;
END $$;