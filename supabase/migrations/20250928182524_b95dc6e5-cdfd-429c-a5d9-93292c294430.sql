-- Update storage policies for offering-media bucket with correct path convention
-- Drop existing policies to recreate them with the correct structure
DROP POLICY IF EXISTS "Users can upload media for their organization offerings" ON storage.objects;
DROP POLICY IF EXISTS "Users can view media from their organization offerings" ON storage.objects;
DROP POLICY IF EXISTS "Users can update media from their organization offerings" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete media from their organization offerings" ON storage.objects;

-- Create new storage policies with the path convention: offering-media/{orgId}/{offeringId}/{filename}
-- Allow public reads for covers (anyone can view uploaded media)
CREATE POLICY "Public can view offering media"
ON storage.objects
FOR SELECT
USING (bucket_id = 'offering-media');

-- Allow authenticated users to upload files to their organization's offerings
CREATE POLICY "Users can upload to their organization offerings"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'offering-media' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.developer_organization_members
    WHERE user_id = auth.uid() 
    AND organization_id::text = (storage.foldername(name))[1]
  )
);

-- Allow users to update/replace files in their organization's offerings
CREATE POLICY "Users can update their organization offering media"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'offering-media' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.developer_organization_members
    WHERE user_id = auth.uid() 
    AND organization_id::text = (storage.foldername(name))[1]
  )
);

-- Allow users to delete files from their organization's offerings
CREATE POLICY "Users can delete their organization offering media"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'offering-media' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.developer_organization_members
    WHERE user_id = auth.uid() 
    AND organization_id::text = (storage.foldername(name))[1]
  )
);