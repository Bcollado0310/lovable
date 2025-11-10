-- Update storage RLS policies to allow dev organization uploads
-- This fixes the issue where auth.uid() is NULL in dev mode

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Users can upload to their organization offerings" ON storage.objects;

-- Create new INSERT policy that allows dev org uploads
CREATE POLICY "Users can upload to their organization offerings"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'offering-media' 
  AND (
    -- Allow authenticated users who belong to the organization
    (
      auth.uid() IS NOT NULL 
      AND EXISTS (
        SELECT 1
        FROM developer_organization_members
        WHERE developer_organization_members.user_id = auth.uid()
          AND developer_organization_members.organization_id::text = (storage.foldername(objects.name))[1]
      )
    )
    -- OR allow uploads for the dev organization (for development)
    OR (storage.foldername(objects.name))[1] = '550e8400-e29b-41d4-a716-446655440000'
  )
);