-- Seed org, offerings, investors, events for org 550e8400-e29b-41d4-a716-446655440000 using valid UUIDs

-- Organization
INSERT INTO public.developer_organizations (id, name, description, website, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Demo Development Company',
  'Development/testing organization used in the dev console',
  'https://demo-dev.com',
  NOW() - INTERVAL '120 days',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Offerings
INSERT INTO public.developer_offerings (id, organization_id, title, description, location, target_amount, raised_amount, status, created_at, updated_at)
VALUES
('7e4f8b72-3c2a-4a61-bb6c-3b2a1e6f9a10', '550e8400-e29b-41d4-a716-446655440000', 'Urban Loft Apartments', 'Renovation of historic loft building into 40 modern units', 'Chicago, IL', 2000000.00, 950000.00, 'active', NOW() - INTERVAL '35 days', NOW()),
('9a2d5c14-8f6e-4d3b-9d77-1b2c3d4e5f60', '550e8400-e29b-41d4-a716-446655440000', 'Tech Park Offices', 'Grade-A office space near innovation district', 'Seattle, WA', 3000000.00, 600000.00, 'coming_soon', NOW() - INTERVAL '10 days', NOW()),
('3f1a2b3c-4d5e-678f-9012-3456789abcde', '550e8400-e29b-41d4-a716-446655440000', 'Harborfront Retail', 'Prime retail units along the waterfront', 'Boston, MA', 1500000.00, 1500000.00, 'funded', NOW() - INTERVAL '75 days', NOW() - INTERVAL '5 days')
ON CONFLICT (id) DO NOTHING;

-- Investors
INSERT INTO public.developer_investors (id, organization_id, email, first_name, last_name, total_invested, investment_count, created_at)
VALUES
('0c9a2d1e-5b6f-4a3c-8d7e-9f0a1b2c3d4e', '550e8400-e29b-41d4-a716-446655440000', 'pat.morgan@example.com', 'Pat', 'Morgan', 80000.00, 2, NOW() - INTERVAL '90 days'),
('1a2b3c4d-5e6f-7081-92a3-b4c5d6e7f809', '550e8400-e29b-41d4-a716-446655440000', 'casey.lee@example.com', 'Casey', 'Lee', 120000.00, 3, NOW() - INTERVAL '60 days'),
('2b3c4d5e-6f70-8192-a3b4-c5d6e7f8091a', '550e8400-e29b-41d4-a716-446655440000', 'jamie.taylor@example.com', 'Jamie', 'Taylor', 45000.00, 1, NOW() - INTERVAL '30 days')
ON CONFLICT (id) DO NOTHING;

-- Contribution events
INSERT INTO public.developer_contribution_events (organization_id, offering_id, investor_id, amount, event_type, status, created_at)
VALUES
('550e8400-e29b-41d4-a716-446655440000', '7e4f8b72-3c2a-4a61-bb6c-3b2a1e6f9a10', '0c9a2d1e-5b6f-4a3c-8d7e-9f0a1b2c3d4e', 25000.00, 'investment', 'completed', NOW() - INTERVAL '2 days'),
('550e8400-e29b-41d4-a716-446655440000', '7e4f8b72-3c2a-4a61-bb6c-3b2a1e6f9a10', '1a2b3c4d-5e6f-7081-92a3-b4c5d6e7f809', 50000.00, 'investment', 'completed', NOW() - INTERVAL '4 days'),
('550e8400-e29b-41d4-a716-446655440000', '3f1a2b3c-4d5e-678f-9012-3456789abcde', '1a2b3c4d-5e6f-7081-92a3-b4c5d6e7f809', 30000.00, 'distribution', 'completed', NOW() - INTERVAL '7 days')
ON CONFLICT DO NOTHING;