/**
 * Document Storage Path Helper
 * 
 * Centralized utility for building document storage paths with configurable
 * prefix and backward compatibility for legacy paths.
 */

// Storage configuration with defaults
export const STORAGE_CONFIG = {
  BUCKET_NAME: 'offering-media',
  // Current prefix for new documents (can be configured via env)
  DOCUMENTS_PREFIX: import.meta.env.VITE_OFFERING_DOCS_PREFIX || 'Documents',
  // Legacy prefix for backward compatibility
  OLD_DOCUMENTS_PREFIX: import.meta.env.VITE_OLD_OFFERING_DOCS_PREFIX || '',
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
 * Extract offering ID from storage path
 * @param storagePath - The full storage path
 * @returns Offering ID or null if not found
 */
export function extractOfferingIdFromPath(storagePath: string): string | null {
  const match = storagePath.match(/^([a-f0-9-]+)\//);
  return match ? match[1] : null;
}

/**
 * Check if a path uses the legacy format (no Documents prefix)
 * @param storagePath - The full storage path
 * @returns True if path is in legacy format
 */
export function isLegacyPath(storagePath: string): boolean {
  const parts = storagePath.split('/');
  // Legacy format: offeringId/filename (2 parts)
  // New format: offeringId/Documents/filename (3 parts)
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
 * Get display name for document (extracted from storage path)
 * @param storagePath - The full storage path
 * @returns Filename without path
 */
export function getFilenameFromPath(storagePath: string): string {
  const parts = storagePath.split('/');
  return parts[parts.length - 1];
}

/**
 * List documents with fallback to legacy paths
 * @param supabase - Supabase client
 * @param offeringId - The offering UUID
 * @param prefix - Optional prefix filter
 * @returns Array of storage paths
 */
export async function listDocumentsWithFallback(
  supabase: any,
  offeringId: string,
  prefix?: string
): Promise<{ name: string; isLegacy: boolean }[]> {
  const { BUCKET_NAME, DOCUMENTS_PREFIX } = STORAGE_CONFIG;
  
  // Try new path first
  const newPath = prefix ? `${offeringId}/${DOCUMENTS_PREFIX}/${prefix}` : `${offeringId}/${DOCUMENTS_PREFIX}`;
  const { data: newFiles, error: newError } = await supabase.storage
    .from(BUCKET_NAME)
    .list(newPath);
  
  const results: { name: string; isLegacy: boolean }[] = [];
  
  if (!newError && newFiles) {
    results.push(...newFiles.map((f: any) => ({ name: `${newPath}/${f.name}`, isLegacy: false })));
  }
  
  // Try legacy path as fallback
  const legacyPath = prefix ? `${offeringId}/${prefix}` : offeringId;
  const { data: legacyFiles, error: legacyError } = await supabase.storage
    .from(BUCKET_NAME)
    .list(legacyPath);
  
  if (!legacyError && legacyFiles) {
    const legacyResults = legacyFiles
      .filter((f: any) => {
        // Exclude directories that match our prefix (avoid duplicates)
        return f.name !== DOCUMENTS_PREFIX;
      })
      .map((f: any) => ({ name: `${legacyPath}/${f.name}`, isLegacy: true }));
    
    results.push(...legacyResults);
  }
  
  return results;
}

/**
 * Check if file exists at storage path (with fallback)
 * @param supabase - Supabase client
 * @param storagePath - The storage path to check
 * @param offeringId - The offering UUID (for fallback)
 * @param filename - The filename (for fallback)
 * @returns Object with exists flag and actual path
 */
export async function checkFileExists(
  supabase: any,
  storagePath: string,
  offeringId?: string,
  filename?: string
): Promise<{ exists: boolean; actualPath: string | null; isLegacy: boolean }> {
  const { BUCKET_NAME } = STORAGE_CONFIG;
  
  // Try the provided path first
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .download(storagePath);
  
  if (!error && data) {
    return { exists: true, actualPath: storagePath, isLegacy: isLegacyPath(storagePath) };
  }
  
  // If offering ID and filename provided, try fallback paths
  if (offeringId && filename) {
    const variants = getDocumentPathVariants(offeringId, filename);
    
    for (const variantPath of variants) {
      if (variantPath === storagePath) continue; // Already tried
      
      const { data: variantData, error: variantError } = await supabase.storage
        .from(BUCKET_NAME)
        .download(variantPath);
      
      if (!variantError && variantData) {
        return { exists: true, actualPath: variantPath, isLegacy: isLegacyPath(variantPath) };
      }
    }
  }
  
  return { exists: false, actualPath: null, isLegacy: false };
}
