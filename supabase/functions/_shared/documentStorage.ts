/**
 * Document Storage Path Helper for Edge Functions
 * 
 * Centralized utility for building document storage paths with configurable
 * prefix and backward compatibility for legacy paths.
 */

// Storage configuration with defaults
export const STORAGE_CONFIG = {
  BUCKET_NAME: 'offering-media',
  // Current prefix for new documents (can be configured via env)
  DOCUMENTS_PREFIX: Deno.env.get('OFFERING_DOCS_PREFIX') || 'Documents',
  // Legacy prefix for backward compatibility
  OLD_DOCUMENTS_PREFIX: Deno.env.get('OLD_OFFERING_DOCS_PREFIX') || '',
} as const;

/**
 * Build storage path for a document
 * @param offeringId - The offering UUID
 * @param filename - The sanitized filename
 * @param usePrefix - Whether to include the Documents prefix (default: true)
 * @returns Full storage path (e.g., "offeringId/Documents/filename")
 */
export function buildDocumentStoragePath(
  offeringId: string,
  filename: string,
  usePrefix: boolean = true
): string {
  const prefix = usePrefix ? STORAGE_CONFIG.DOCUMENTS_PREFIX : STORAGE_CONFIG.OLD_DOCUMENTS_PREFIX;
  
  if (prefix) {
    return `${offeringId}/${prefix}/${filename}`;
  }
  
  // Legacy format without prefix
  return `${offeringId}/${filename}`;
}

/**
 * Build legacy storage path (for backward compatibility)
 * @param offeringId - The offering UUID
 * @param filename - The sanitized filename
 * @returns Legacy storage path without prefix
 */
export function buildLegacyDocumentPath(
  offeringId: string,
  filename: string
): string {
  return buildDocumentStoragePath(offeringId, filename, false);
}

/**
 * Get all possible storage paths for a document (for fallback checking)
 * @param offeringId - The offering UUID
 * @param filename - The sanitized filename
 * @returns Array of possible paths [newest, ..., oldest]
 */
export function getDocumentPathVariants(
  offeringId: string,
  filename: string
): string[] {
  const paths: string[] = [];
  
  // Current path with configured prefix
  paths.push(buildDocumentStoragePath(offeringId, filename, true));
  
  // Legacy path without prefix (if different from current)
  const legacyPath = buildLegacyDocumentPath(offeringId, filename);
  if (legacyPath !== paths[0]) {
    paths.push(legacyPath);
  }
  
  return paths;
}

/**
 * Check if a path uses the legacy format (no Documents prefix)
 * @param storagePath - The full storage path
 * @returns True if path is in legacy format
 */
export function isLegacyPath(storagePath: string): boolean {
  const parts = storagePath.split('/');
  // Legacy format: offeringId/filename (2 parts)
  // New format: offeringId/Documents/filename (3+ parts)
  return parts.length === 2;
}

/**
 * Migrate a legacy path to the new format
 * @param legacyPath - The old storage path
 * @returns New storage path with Documents prefix
 */
export function migrateLegacyPath(legacyPath: string): string {
  const parts = legacyPath.split('/');
  
  if (parts.length === 2) {
    // Legacy format: offeringId/filename
    const [offeringId, filename] = parts;
    return buildDocumentStoragePath(offeringId, filename, true);
  }
  
  // Already in new format or invalid
  return legacyPath;
}

/**
 * Download file with fallback to legacy path
 * @param supabase - Supabase client
 * @param storagePath - The storage path
 * @returns File data and actual path used
 */
export async function downloadWithFallback(
  supabase: any,
  storagePath: string
): Promise<{ data: Blob | null; actualPath: string; isLegacy: boolean }> {
  const { BUCKET_NAME } = STORAGE_CONFIG;
  
  // Try the provided path first
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .download(storagePath);
  
  if (!error && data) {
    return { data, actualPath: storagePath, isLegacy: isLegacyPath(storagePath) };
  }
  
  console.warn(`⚠️  File not found at path: ${storagePath}, trying fallback...`);
  
  // Extract offering ID and filename for fallback
  const parts = storagePath.split('/');
  if (parts.length >= 2) {
    const offeringId = parts[0];
    const filename = parts[parts.length - 1];
    const variants = getDocumentPathVariants(offeringId, filename);
    
    for (const variantPath of variants) {
      if (variantPath === storagePath) continue; // Already tried
      
      console.log(`🔄 Trying fallback path: ${variantPath}`);
      const { data: variantData, error: variantError } = await supabase.storage
        .from(BUCKET_NAME)
        .download(variantPath);
      
      if (!variantError && variantData) {
        console.log(`✅ Found file at fallback path: ${variantPath}`);
        return { data: variantData, actualPath: variantPath, isLegacy: isLegacyPath(variantPath) };
      }
    }
  }
  
  // No fallback worked
  throw new Error(`File not found at path: ${storagePath} (tried fallbacks)`);
}

/**
 * Delete file with fallback to legacy path
 * @param supabase - Supabase client
 * @param storagePath - The storage path
 * @returns Success status
 */
export async function deleteWithFallback(
  supabase: any,
  storagePath: string
): Promise<{ success: boolean; deletedPath: string | null }> {
  const { BUCKET_NAME } = STORAGE_CONFIG;
  
  // Try the provided path first
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([storagePath]);
  
  if (!error) {
    return { success: true, deletedPath: storagePath };
  }
  
  console.warn(`⚠️  Failed to delete file at path: ${storagePath}, trying fallback...`);
  
  // Extract offering ID and filename for fallback
  const parts = storagePath.split('/');
  if (parts.length >= 2) {
    const offeringId = parts[0];
    const filename = parts[parts.length - 1];
    const variants = getDocumentPathVariants(offeringId, filename);
    
    for (const variantPath of variants) {
      if (variantPath === storagePath) continue; // Already tried
      
      console.log(`🔄 Trying to delete at fallback path: ${variantPath}`);
      const { error: variantError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([variantPath]);
      
      if (!variantError) {
        console.log(`✅ Deleted file at fallback path: ${variantPath}`);
        return { success: true, deletedPath: variantPath };
      }
    }
  }
  
  return { success: false, deletedPath: null };
}

/**
 * Create signed URL with fallback to legacy path
 * @param supabase - Supabase client
 * @param storagePath - The storage path
 * @param expiresIn - Expiry time in seconds
 * @param download - Whether URL is for download
 * @returns Signed URL and actual path used
 */
export async function createSignedUrlWithFallback(
  supabase: any,
  storagePath: string,
  expiresIn: number,
  download: boolean = false
): Promise<{ signedUrl: string; actualPath: string; isLegacy: boolean }> {
  const { BUCKET_NAME } = STORAGE_CONFIG;
  
  // Try the provided path first
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(storagePath, expiresIn, { download });
  
  if (!error && data?.signedUrl) {
    return { signedUrl: data.signedUrl, actualPath: storagePath, isLegacy: isLegacyPath(storagePath) };
  }
  
  console.warn(`⚠️  Failed to create signed URL for path: ${storagePath}, trying fallback...`);
  
  // Extract offering ID and filename for fallback
  const parts = storagePath.split('/');
  if (parts.length >= 2) {
    const offeringId = parts[0];
    const filename = parts[parts.length - 1];
    const variants = getDocumentPathVariants(offeringId, filename);
    
    for (const variantPath of variants) {
      if (variantPath === storagePath) continue; // Already tried
      
      console.log(`🔄 Trying to create signed URL for fallback path: ${variantPath}`);
      const { data: variantData, error: variantError } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(variantPath, expiresIn, { download });
      
      if (!variantError && variantData?.signedUrl) {
        console.log(`✅ Created signed URL for fallback path: ${variantPath}`);
        return { signedUrl: variantData.signedUrl, actualPath: variantPath, isLegacy: isLegacyPath(variantPath) };
      }
    }
  }
  
  throw new Error(`Failed to create signed URL for path: ${storagePath} (tried fallbacks)`);
}
