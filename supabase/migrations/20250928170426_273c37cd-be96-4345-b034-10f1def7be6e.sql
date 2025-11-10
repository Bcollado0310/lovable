-- First, create the demo developer organization
INSERT INTO public.developer_organizations (id, name, description, website, created_at, updated_at) 
VALUES (
  '00000000-0000-0000-0000-000000000001', 
  'Aurora Equity Demo', 
  'Demo organization for Aurora Equity platform development and testing', 
  'https://aurora-equity.com',
  NOW() - INTERVAL '90 days',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Add mock developer organization member to connect user to demo organization
INSERT INTO public.developer_organization_members (user_id, organization_id, role)
VALUES (
  '00000000-0000-0000-0000-000000000000', 
  '00000000-0000-0000-0000-000000000001', 
  'owner'
) ON CONFLICT (user_id, organization_id) DO NOTHING;

-- Insert mock offerings data for the demo organization with valid status values
INSERT INTO public.developer_offerings (id, organization_id, title, description, location, target_amount, raised_amount, status, created_at, updated_at) VALUES
('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'Luxury Apartments Downtown', 'Premium residential complex in the heart of the city with 50 luxury units', 'New York, NY', 2500000.00, 1875000.00, 'active', NOW() - INTERVAL '45 days', NOW()),
('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', 'Green Office Complex', 'Sustainable office building with LEED certification and modern amenities', 'San Francisco, CA', 3200000.00, 960000.00, 'active', NOW() - INTERVAL '30 days', NOW()),
('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001', 'Retail Shopping Center', 'Mixed-use retail and entertainment complex in growing suburban area', 'Austin, TX', 1800000.00, 1800000.00, 'closed', NOW() - INTERVAL '90 days', NOW() - INTERVAL '10 days'),
('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000001', 'Waterfront Condos', 'Exclusive waterfront condominium development with marina access', 'Miami, FL', 4500000.00, 675000.00, 'coming_soon', NOW() - INTERVAL '15 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert mock investor data  
INSERT INTO public.developer_investors (id, organization_id, email, first_name, last_name, total_invested, investment_count, created_at) VALUES
('55555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000001', 'john.smith@example.com', 'John', 'Smith', 125000.00, 3, NOW() - INTERVAL '60 days'),
('66666666-6666-6666-6666-666666666666', '00000000-0000-0000-0000-000000000001', 'sarah.johnson@example.com', 'Sarah', 'Johnson', 250000.00, 2, NOW() - INTERVAL '45 days'),
('77777777-7777-7777-7777-777777777777', '00000000-0000-0000-0000-000000000001', 'mike.wilson@example.com', 'Mike', 'Wilson', 75000.00, 1, NOW() - INTERVAL '30 days'),
('88888888-8888-8888-8888-888888888888', '00000000-0000-0000-0000-000000000001', 'emma.davis@example.com', 'Emma', 'Davis', 180000.00, 4, NOW() - INTERVAL '75 days'),
('99999999-9999-9999-9999-999999999999', '00000000-0000-0000-0000-000000000001', 'alex.brown@example.com', 'Alex', 'Brown', 95000.00, 2, NOW() - INTERVAL '20 days')
ON CONFLICT (id) DO NOTHING;

-- Create daily contribution events table for tracking contributions over time (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'developer_daily_contributions') THEN
        CREATE TABLE public.developer_daily_contributions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          organization_id UUID NOT NULL,
          offering_id UUID NOT NULL,
          contribution_date DATE NOT NULL,
          daily_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Enable RLS on the daily contributions table
        ALTER TABLE public.developer_daily_contributions ENABLE ROW LEVEL SECURITY;

        -- Create policies for daily contributions
        CREATE POLICY "Users can view daily contributions from their organization" ON public.developer_daily_contributions
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM public.developer_organization_members 
            WHERE user_id = auth.uid() AND organization_id = developer_daily_contributions.organization_id
          )
        );
    END IF;
END $$;

-- Insert daily contribution data for charts (last 30 days for the first offering)
INSERT INTO public.developer_daily_contributions (organization_id, offering_id, contribution_date, daily_amount) 
SELECT 
  '00000000-0000-0000-0000-000000000001', 
  '11111111-1111-1111-1111-111111111111',
  (CURRENT_DATE - INTERVAL '1 day' * i)::DATE,
  (10000 + (RANDOM() * 25000))::DECIMAL(15,2)
FROM generate_series(1, 30) AS i
WHERE NOT EXISTS (
  SELECT 1 FROM public.developer_daily_contributions 
  WHERE offering_id = '11111111-1111-1111-1111-111111111111' 
  AND contribution_date = (CURRENT_DATE - INTERVAL '1 day' * i)::DATE
);