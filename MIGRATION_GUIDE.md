# Document Storage Migration Guide

This guide explains how to migrate from the old document storage structure to the new "Documents" folder structure.

## What Changed?

Previously, documents were stored directly under the offering ID:
```
offering-media/
  └── {offeringId}/
      ├── document1.pdf
      ├── document2.pdf
      └── ...
```

Now, documents are organized in a "Documents" subfolder:
```
offering-media/
  └── {offeringId}/
      └── Documents/
          ├── document1.pdf
          ├── document2.pdf
          └── ...
```

## Migration Steps

### 1. Database Migration (Completed Automatically)

The database migration has already updated the `storage_key` values in the `documents` table to use the new path structure.

To verify the migration status:
```sql
SELECT * FROM public.document_storage_migration_status;
```

This will show you:
- `migrated_paths`: Documents using the new "Documents" prefix
- `legacy_paths`: Documents still using the old structure
- `total_documents`: Total number of documents

### 2. Storage Files Migration

You have two options:

#### Option A: Manual Move (Recommended if you've already done this)

If you've already renamed/moved the folder in Supabase Storage UI:
1. ✅ You're done! The code now includes fallback logic to access files at both old and new paths.
2. The system will automatically find files at their actual location.

#### Option B: Programmatic Move (If needed)

If files are still at the old paths, you can use the Supabase Storage UI to:
1. Navigate to the `offering-media` bucket
2. For each offering folder:
   - Create a new "Documents" subfolder
   - Move all PDF files into the "Documents" subfolder
   - Delete the old files after confirming the move

### 3. Verification

To verify the migration:

1. Check that documents load correctly in the UI
2. Try uploading a new document - it should go to the new path
3. Try viewing/downloading existing documents - they should work with fallback logic
4. Check the console logs for any "legacy path" messages

## Environment Variables

You can configure the document storage behavior using environment variables:

```env
# Prefix for new document uploads (default: "Documents")
VITE_OFFERING_DOCS_PREFIX=Documents

# Legacy prefix for backward compatibility (default: empty string)
VITE_OLD_OFFERING_DOCS_PREFIX=
```

For edge functions, set these as Supabase secrets:
- `OFFERING_DOCS_PREFIX=Documents`
- `OLD_OFFERING_DOCS_PREFIX=` (empty for legacy root-level storage)

## Rollback Plan

If you need to rollback:

1. **Rollback Database:**
   ```sql
   -- Revert storage_key values to legacy format
   UPDATE public.documents
   SET storage_key = regexp_replace(storage_key, '([^/]+)/Documents/', '\1/')
   WHERE storage_key LIKE '%/Documents/%';
   ```

2. **Rollback Storage:** Move files back to the root level of each offering folder

3. **Rollback Environment Variables:**
   ```env
   VITE_OFFERING_DOCS_PREFIX=
   VITE_OLD_OFFERING_DOCS_PREFIX=Documents
   ```

## Backward Compatibility

The system includes automatic fallback logic that:
- ✅ Tries the new path first (with "Documents" prefix)
- ✅ Falls back to legacy path if not found
- ✅ Logs when fallback is used (visible in edge function logs)
- ✅ Works for all operations: list, download, view, delete

This means:
- Old documents remain accessible even if not moved yet
- New documents use the new structure automatically
- No immediate breaking changes

## Testing

Test the following scenarios:
1. ✅ Upload a new document → Should go to `{offeringId}/Documents/{filename}`
2. ✅ View an old document → Should work with fallback logic
3. ✅ Download an old document → Should work with fallback logic
4. ✅ Delete an old document → Should work with fallback logic
5. ✅ Search/filter documents → Should show all documents regardless of path

## Monitoring

Check the edge function logs for messages like:
- `📝 Note: File found at legacy path, will update storage_key in DB`
- `🔄 Trying fallback path: ...`
- `✅ Found file at fallback path: ...`

These indicate the fallback logic is working and which files still need to be migrated.

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Check the edge function logs in Supabase Dashboard
3. Verify the `storage_key` values in the database
4. Confirm files exist in Supabase Storage at the expected paths
