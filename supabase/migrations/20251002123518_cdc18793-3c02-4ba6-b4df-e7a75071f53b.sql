-- Migration: Update document storage paths to use Documents prefix
-- This migration updates existing storage_key values in the documents table
-- to use the new "Documents" folder structure for better organization.

-- Step 1: Add a function to migrate storage paths
CREATE OR REPLACE FUNCTION public.migrate_document_storage_path(old_path TEXT)
RETURNS TEXT
LANGUAGE plpgsql
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

-- Step 2: Update all existing storage_key values to use Documents prefix
-- This is a dry-run safe operation - you can check the results first
DO $$
DECLARE
  updated_count INTEGER := 0;
  doc_record RECORD;
BEGIN
  -- Update all documents that don't already have the Documents prefix
  FOR doc_record IN 
    SELECT id, storage_key, offering_id
    FROM public.documents
    WHERE storage_key NOT LIKE '%/Documents/%'
  LOOP
    -- Update the storage_key
    UPDATE public.documents
    SET 
      storage_key = migrate_document_storage_path(storage_key),
      updated_at = now()
    WHERE id = doc_record.id;
    
    updated_count := updated_count + 1;
  END LOOP;
  
  RAISE NOTICE 'Migrated % document storage paths to use Documents prefix', updated_count;
END;
$$;

-- Step 3: Add a comment to the function for documentation
COMMENT ON FUNCTION public.migrate_document_storage_path(TEXT) IS 
  'Migrates legacy document storage paths to the new Documents prefix format. 
   Legacy format: offeringId/filename
   New format: offeringId/Documents/filename';

-- Step 4: Create a view to show migration status (optional, for monitoring)
CREATE OR REPLACE VIEW public.document_storage_migration_status AS
SELECT 
  COUNT(*) FILTER (WHERE storage_key LIKE '%/Documents/%') AS migrated_paths,
  COUNT(*) FILTER (WHERE storage_key NOT LIKE '%/Documents/%') AS legacy_paths,
  COUNT(*) AS total_documents
FROM public.documents;

COMMENT ON VIEW public.document_storage_migration_status IS 
  'Shows the migration status of document storage paths';

-- Note: After running this migration, you should manually move the files in Supabase Storage
-- from the old paths to the new paths, or use the storage helper functions which include
-- fallback logic to access files at both old and new paths.