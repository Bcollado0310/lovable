-- Ensure user membership for the demo organization used in DeveloperAuthContext
-- Add a placeholder user membership (user_id = '00000000-0000-0000-0000-000000000000') for dev testing

INSERT INTO public.developer_organization_members (user_id, organization_id, role, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  '550e8400-e29b-41d4-a716-446655440000', 
  'owner',
  NOW(),
  NOW()
) ON CONFLICT (user_id, organization_id) DO NOTHING;