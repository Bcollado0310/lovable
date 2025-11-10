-- Seed dev organization and member for local development
-- This allows the dev bypass mock user to upload media

-- Insert dev organization if it doesn't exist
INSERT INTO developer_organizations (
  id,
  name,
  description,
  website,
  created_at,
  updated_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Demo Development Company',
  'A demo organization for development purposes',
  'https://demo-dev.com',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Insert dev organization member if it doesn't exist
INSERT INTO developer_organization_members (
  id,
  user_id,
  organization_id,
  role,
  created_at,
  updated_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440000',
  'owner',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;