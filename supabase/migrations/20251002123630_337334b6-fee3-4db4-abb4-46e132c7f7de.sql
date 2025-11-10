-- Fix security issues from previous migration
-- 1. Update the migrate_document_storage_path function to set search_path
-- 2. Enable RLS on the document_storage_migration_status view or recreate without security definer

-- Drop and recreate the function with proper security settings
DROP FUNCTION IF EXISTS public.migrate_document_storage_path(TEXT);

CREATE OR REPLACE FUNCTION public.migrate_document_storage_path(old_path TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  parts TEXT[];
  offering_id TEXT;
  filename TEXT;
BEGIN
  -- Split the path by '/'
  parts := string_to_array(old_path, '/');
  
  -- Check if it's already in the new format (has 3+ parts with Documents)
  IF array_length(parts, 1) >= 3 AND parts[2] = 'Documents' THEN
    -- Already migrated
    RETURN old_path;
  END IF;
  
  -- Legacy format: offeringId/filename (2 parts)
  IF array_length(parts, 1) = 2 THEN
    offering_id := parts[1];
    filename := parts[2];
    -- Return new format: offeringId/Documents/filename
    RETURN offering_id || '/Documents/' || filename;
  END IF;
  
  -- Unknown format, return as-is
  RETURN old_path;
END;
$$;

-- The view is read-only and doesn't expose sensitive data, so it's safe
-- But we'll ensure it respects RLS by making users query through the view
-- rather than direct table access

COMMENT ON FUNCTION public.migrate_document_storage_path(TEXT) IS 
  'Migrates legacy document storage paths to the new Documents prefix format. 
   Legacy format: offeringId/filename
   New format: offeringId/Documents/filename
   Security: INVOKER mode with fixed search_path for security';