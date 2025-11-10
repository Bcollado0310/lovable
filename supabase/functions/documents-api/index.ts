import { 
  buildDocumentStoragePath, 
  downloadWithFallback, 
  deleteWithFallback, 
  createSignedUrlWithFallback,
  isLegacyPath,
  migrateLegacyPath,
  STORAGE_CONFIG
} from '../_shared/documentStorage.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-dev-bypass-token',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
};

// File validation constants - PDF ONLY
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
const ALLOWED_MIME_TYPES = ['application/pdf'];
const ALLOWED_EXTENSIONS = ['pdf'];
const PDF_MAGIC_HEADER = [0x25, 0x50, 0x44, 0x46]; // %PDF-

// Development authentication bypass middleware
interface BypassUser {
  id: string;
  role: string;
}

interface AuthResult {
  user: any;
  isBypass: boolean;
}

async function devAuthBypass(req: Request, supabase: any): Promise<AuthResult> {
  const nodeEnv = Deno.env.get('NODE_ENV') || 'development';
  const url = new URL(req.url);
  const method = req.method;
  const route = url.pathname;
  
  // CRITICAL: Never enable bypass in production - hard stop
  if (nodeEnv === 'production') {
    console.log('🔒 Production mode detected - dev auth bypass permanently disabled');
    return await normalAuth(req, supabase);
  }

  // Get all bypass configuration
  const devAuthBypass = Deno.env.get('DEV_AUTH_BYPASS');
  const devBypassToken = Deno.env.get('DEV_BYPASS_TOKEN');
  const devBypassUserId = Deno.env.get('DEV_BYPASS_USER_ID');
  const devBypassUserRole = Deno.env.get('DEV_BYPASS_USER_ROLE');
  const requestBypassToken = req.headers.get('x-dev-bypass-token');

  // Diagnostic logging (noisy in dev - that's intentional!)
  console.log('🔍 Dev Auth Bypass Check:');
  console.log(`  Route: ${method} ${route}`);
  console.log(`  NODE_ENV: ${nodeEnv}`);
  console.log(`  DEV_AUTH_BYPASS: ${devAuthBypass || '(not set)'}`);
  console.log(`  DEV_BYPASS_TOKEN: ${devBypassToken ? '(set)' : '(not set)'}`);
  console.log(`  DEV_BYPASS_USER_ID: ${devBypassUserId || '(not set)'}`);
  console.log(`  DEV_BYPASS_USER_ROLE: ${devBypassUserRole || '(not set)'}`);
  console.log(`  x-dev-bypass-token header: ${requestBypassToken ? '(present)' : '(missing)'}`);

  // Determine if bypass is enabled (supports common truthy values)
  const v = (devAuthBypass || '').toLowerCase().trim();
  const truthy = v === 'true' || v === '1' || v === 'yes' || v === 'on';
  const misconfiguredEqualsToken = !!(devAuthBypass && devBypassToken && devAuthBypass === devBypassToken);
  const bypassEnabled = truthy || misconfiguredEqualsToken;

  if (!bypassEnabled) {
    console.warn(`⚠️  DEV_AUTH_BYPASS is "${devAuthBypass}" (enabled=${bypassEnabled}). To enable, set to "true".`);
    console.log('🔒 Falling back to normal auth');
    return await normalAuth(req, supabase);
  }

  if (misconfiguredEqualsToken) {
    console.warn('⚠️  DEV_AUTH_BYPASS appears to be misconfigured (set to the token value). Proceeding in dev, but please set DEV_AUTH_BYPASS="true".');
  }

  if (!devBypassUserId) {
    console.warn('⚠️  DEV_BYPASS_USER_ID is not set');
    console.log('🔒 Falling back to normal auth');
    return await normalAuth(req, supabase);
  }

  if (!devBypassUserRole) {
    console.warn('⚠️  DEV_BYPASS_USER_ROLE is not set');
    console.log('🔒 Falling back to normal auth');
    return await normalAuth(req, supabase);
  }

  // Check for bypass token in request headers (lenient in dev)
  const headerMatchesMisconfigured = !!(requestBypassToken && devAuthBypass && requestBypassToken === devAuthBypass);
  const headerMatchesToken = !!(requestBypassToken && devBypassToken && requestBypassToken === devBypassToken);
  const hasAnyHeader = !!requestBypassToken;
  const hasValidHeader = headerMatchesToken || headerMatchesMisconfigured;

  if (!hasAnyHeader) {
    console.log('🔒 No x-dev-bypass-token header in request - using normal auth');
    return await normalAuth(req, supabase);
  }

  if (!hasValidHeader) {
    console.warn('⚠️  x-dev-bypass-token does not match configured token, but proceeding in DEV mode');
  }

  // SUCCESS: All checks passed - use bypass
  const timestamp = new Date().toISOString();
  
  console.warn('═'.repeat(60));
  console.warn('🚨 DEV AUTH BYPASS ACTIVE 🚨');
  console.warn(`  Timestamp: ${timestamp}`);
  console.warn(`  User ID: ${devBypassUserId}`);
  console.warn(`  Route: ${method} ${route}`);
  console.warn(`  Role: ${devBypassUserRole}`);
  console.warn(`  Environment: ${nodeEnv}`);
  console.warn('⚠️  This should NEVER appear in production logs!');
  console.warn('═'.repeat(60));
  
  // Dev middleware logging
  console.warn(`[DEV_BYPASS] ${method} ${route}`);
  
  // Create bypass user object
  const bypassUser = {
    id: devBypassUserId,
    role: devBypassUserRole,
    email: 'dev@bypass.local',
  };

  return {
    user: bypassUser,
    isBypass: true
  };
}

async function normalAuth(req: Request, supabase: any): Promise<AuthResult> {
  const authHeader = req.headers.get('Authorization');
  
  console.log('🔐 Using normal authentication');
  
  if (!authHeader) {
    console.error('❌ Missing Authorization header');
    throw new Error('Missing authorization header');
  }

  const token = authHeader.replace('Bearer ', '');
  console.log(`🔑 Validating JWT token (length: ${token.length})`);

  const { data: { user }, error: userError } = await supabase.auth.getUser(token);

  if (userError) {
    console.error('❌ Auth error:', userError.message);
    throw new Error(`Authentication failed: ${userError.message}`);
  }

  if (!user) {
    console.error('❌ No user returned from auth');
    throw new Error('Invalid authentication');
  }

  console.log(`✅ Authenticated user: ${user.id}`);

  return {
    user,
    isBypass: false
  };
}

// Sanitize filename and add short hash suffix to prevent collisions
function sanitizeFilename(filename: string, addHashSuffix = true): string {
  // Remove any path separators and dangerous characters
  let name = filename.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
    .replace(/\.\./g, '_') // Remove path traversal attempts
    .replace(/^\.+/, '') // Remove leading dots
    .trim();
  
  // Split into base name and extension
  const lastDot = name.lastIndexOf('.');
  const baseName = lastDot > 0 ? name.substring(0, lastDot) : name;
  const extension = lastDot > 0 ? name.substring(lastDot) : '';
  
  // Add short hash suffix to avoid collisions (if requested)
  if (addHashSuffix) {
    const hash = Math.random().toString(36).substring(2, 8); // 6 char hash
    name = `${baseName}_${hash}${extension}`;
  } else {
    name = `${baseName}${extension}`;
  }
  
  // Ensure filename isn't too long (max 255 chars)
  const maxLength = 255;
  if (name.length > maxLength) {
    const truncatedBase = baseName.substring(0, maxLength - extension.length - 10);
    const hash = Math.random().toString(36).substring(2, 8);
    name = `${truncatedBase}_${hash}${extension}`;
  }
  
  return name;
}

// Audit logging function
async function logDocumentAction(
  supabase: any, 
  action: string, 
  userId: string, 
  documentId: string | null, 
  offeringId: string | null,
  metadata: any = {}
) {
  try {
    await supabase
      .from('admin_audit_log')
      .insert({
        admin_user_id: userId,
        action: `DOCUMENT_${action}`,
        table_name: 'documents',
        resource_id: documentId || offeringId,
        ip_address: null, // Would need request context for real IP
        user_agent: null // Would need request headers for real user agent
      });
    
    console.log(`Document action logged: ${action} by ${userId} for document ${documentId}`);
  } catch (error) {
    console.warn('Failed to log document action:', error);
    // Don't fail the main operation if logging fails
  }
}

// Compute SHA256 checksum
async function computeChecksum(arrayBuffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Enhanced file validation with MIME type and magic header verification (PDF ONLY)
function validateFile(filename: string, mimeType: string, size: number, fileBuffer?: ArrayBuffer) {
  // Validate file size - Return 413 error
  if (size > MAX_FILE_SIZE) {
    const error = new Error('PDF exceeds 25 MB limit.');
    (error as any).statusCode = 413;
    (error as any).errorCode = 'FILE_TOO_LARGE';
    throw error;
  }

  // Validate MIME type - Return 415 error for non-PDF
  if (mimeType !== 'application/pdf') {
    const error = new Error('Only PDF files are allowed.');
    (error as any).statusCode = 415;
    (error as any).errorCode = 'ONLY_PDF_ALLOWED';
    throw error;
  }

  // Validate file extension
  const extension = filename.split('.').pop()?.toLowerCase();
  if (extension !== 'pdf') {
    const error = new Error('Only PDF files are allowed.');
    (error as any).statusCode = 415;
    (error as any).errorCode = 'ONLY_PDF_ALLOWED';
    throw error;
  }

  // Validate PDF magic header (%PDF-) from file buffer
  if (fileBuffer) {
    const bytes = new Uint8Array(fileBuffer.slice(0, 5));
    const isPDF = PDF_MAGIC_HEADER.every((byte, index) => bytes[index] === byte);
    
    if (!isPDF) {
      const error = new Error('Only PDF files are allowed.');
      (error as any).statusCode = 415;
      (error as any).errorCode = 'ONLY_PDF_ALLOWED';
      throw error;
    }
  }
}

// Validate offering ownership for developer (bypass-friendly)
async function validateOfferingOwnership(supabase: any, userId: string, offeringId: string, bypass = false) {
  if (bypass) {
    // In dev bypass, pretend the user owns the offering
    return { offering: { id: offeringId, organization_id: null }, userRole: 'owner' };
  }

  const { data: offering, error } = await supabase
    .from('developer_offerings')
    .select(`
      id,
      organization_id,
      developer_organization_members!inner(
        user_id,
        role
      )
    `)
    .eq('id', offeringId)
    .eq('developer_organization_members.user_id', userId)
    .single();

  if (error || !offering) {
    throw new Error('Access denied: Cannot access this offering');
  }

  const userRole = offering.developer_organization_members[0]?.role;
  return { offering, userRole };
}

// Validate document ownership for developer (bypass-friendly)
async function validateDocumentOwnership(supabase: any, userId: string, documentId: string, bypass = false) {
  if (bypass) {
    const { data: document, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (error || !document) {
      throw new Error('Document not found');
    }

    return { document, userRole: 'owner' };
  }

  const { data: document, error } = await supabase
    .from('documents')
    .select(`
      *,
      developer_offerings!inner(
        organization_id,
        developer_organization_members!inner(
          user_id,
          role
        )
      )
    `)
    .eq('id', documentId)
    .eq('developer_offerings.developer_organization_members.user_id', userId)
    .single();

  if (error || !document) {
    throw new Error('Document not found or access denied');
  }

  const userRole = document.developer_offerings.developer_organization_members[0]?.role;
  return { document, userRole };
}

// Server startup logging for development
const nodeEnv = Deno.env.get('NODE_ENV') || 'development';
const devAuthBypassEnabled = Deno.env.get('DEV_AUTH_BYPASS');

if (nodeEnv !== 'production') {
  console.log('🚀 Documents API Server Starting...');
  console.log(`📊 Environment: NODE_ENV=${nodeEnv}`);
  console.log(`🔧 DEV_AUTH_BYPASS=${devAuthBypassEnabled}`);
  console.log('📍 Routes with bypass middleware mounted:');
  console.log('  - GET /offerings/:offeringId/documents');
  console.log('  - POST /offerings/:offeringId/documents');
  console.log('  - PATCH /documents/:id');
  console.log('  - DELETE /documents/:id');
  console.log('  - GET /documents/:id/download');
  console.log('  - GET /dev/echo (temporary)');
  console.log('─'.repeat(50));
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.55.0?target=deno');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    let pathParts = url.pathname.split('/').filter(Boolean);
    
    // Remove function name from path if present (e.g., 'documents-api')
    if (pathParts[0] === 'documents-api') {
      pathParts = pathParts.slice(1);
    }

    // Temporary echo route for environment debugging (dev only)
    if (req.method === 'GET' && pathParts[0] === 'dev' && pathParts[1] === 'echo') {
      const nodeEnv = Deno.env.get('NODE_ENV') || 'development';
      const devBypass = Deno.env.get('DEV_AUTH_BYPASS');
      const hasToken = !!Deno.env.get('DEV_BYPASS_TOKEN');
      const hasUserId = !!Deno.env.get('DEV_BYPASS_USER_ID');
      const hasUserRole = !!Deno.env.get('DEV_BYPASS_USER_ROLE');
      const requestToken = req.headers.get('x-dev-bypass-token');
      
      return new Response(
        JSON.stringify({ 
          nodeEnv, 
          devBypass,
          hasToken,
          hasUserId,
          hasUserRole,
          requestTokenPresent: !!requestToken,
          timestamp: new Date().toISOString(),
          url: req.url,
          headers: Object.fromEntries(req.headers.entries())
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Use development auth bypass middleware
    const { user, isBypass } = await devAuthBypass(req, supabase);
    
    if (isBypass) {
      console.log('📋 Using dev bypass user for documents API');
    }

    // Route: GET /offerings/:offeringId/documents
    if (req.method === 'GET' && pathParts[0] === 'offerings' && pathParts[2] === 'documents') {
      const offeringId = pathParts[1];
      const category = url.searchParams.get('category');
      const visibility = url.searchParams.get('visibility');
      const search = url.searchParams.get('q');

      // Validate offering ownership
      await validateOfferingOwnership(supabase, user.id, offeringId, isBypass);

      // Build query
      let query = supabase
        .from('documents')
        .select(`
          id,
          offering_id,
          title,
          filename,
          mime_type,
          size_bytes,
          category,
          visibility,
          download_count,
          uploaded_at,
          updated_at,
          checksum_sha256
        `)
        .eq('offering_id', offeringId)
        .order('uploaded_at', { ascending: false });

      // Apply filters
      if (category) {
        // Normalize case for category comparison
        const normalizedCategory = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
        if (['Financial', 'Appraisal', 'Legal', 'Technical', 'Other'].includes(normalizedCategory)) {
          query = query.eq('category', normalizedCategory);
        }
      }
      if (visibility) {
        // Normalize case for visibility comparison
        const normalizedVisibility = visibility.charAt(0).toUpperCase() + visibility.slice(1).toLowerCase();
        if (['Public', 'Private'].includes(normalizedVisibility)) {
          query = query.eq('visibility', normalizedVisibility);
        }
      }
      if (search) {
        query = query.or(`title.ilike.%${search}%,filename.ilike.%${search}%`);
      }

      const { data: documents, error } = await query;

      if (error) throw error;

      // Log document access
      await logDocumentAction(supabase, 'LIST', user.id, null, offeringId, { count: documents?.length || 0 });

      return new Response(
        JSON.stringify({
          success: true,
          documents: documents || [],
          count: documents?.length || 0
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Route: POST /offerings/:offeringId/documents/presign
    // Generate presigned URL for direct client upload
    if (req.method === 'POST' && pathParts[0] === 'offerings' && pathParts[2] === 'documents' && pathParts[3] === 'presign') {
      const offeringId = pathParts[1];

      // Validate offering ownership and permissions
      const { userRole } = await validateOfferingOwnership(supabase, user.id, offeringId, isBypass);
      if (!['owner', 'manager', 'editor'].includes(userRole)) {
        return new Response(
          JSON.stringify({ error: 'ACCESS_DENIED' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const body = await req.json();
      const { filename, mimeType, size, category, visibility, title } = body;

      // Validate required fields
      if (!filename || !mimeType || !size) {
        return new Response(
          JSON.stringify({ error: 'NO_FILE' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!category || !['Financial', 'Appraisal', 'Legal', 'Technical', 'Other'].includes(category)) {
        return new Response(
          JSON.stringify({ error: 'INVALID_CATEGORY' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!visibility || !['Public', 'Private'].includes(visibility)) {
        return new Response(
          JSON.stringify({ error: 'INVALID_VISIBILITY' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate file (no buffer check at this stage)
      try {
        validateFile(filename, mimeType, size);
      } catch (error: any) {
        return new Response(
          JSON.stringify({ error: error.errorCode || 'VALIDATION_FAILED' }),
          { status: error.statusCode || 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate unique storage path with hash suffix in filename
      const sanitizedFilename = sanitizeFilename(filename, true);
      const timestampedFilename = `${Date.now()}_${sanitizedFilename}`;
      const storagePath = buildDocumentStoragePath(offeringId, timestampedFilename, true);

      // Generate presigned URL for upload (valid for 10 minutes)
      const { data: signedUrlData, error: signedUrlError } = await supabase
        .storage
        .from(STORAGE_CONFIG.BUCKET_NAME)
        .createSignedUploadUrl(storagePath);

      if (signedUrlError) {
        console.error('Error creating signed upload URL:', signedUrlError);
        return new Response(
          JSON.stringify({ error: 'PRESIGN_FAILED' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Return presigned URL and metadata for client to use
      return new Response(
        JSON.stringify({
          success: true,
          uploadUrl: signedUrlData.signedUrl,
          token: signedUrlData.token,
          path: signedUrlData.path,
          metadata: {
            offeringId,
            title: title || filename.replace(/\.[^/.]+$/, ''),
            filename: sanitizedFilename,
            category,
            visibility,
            mimeType,
            size
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Route: POST /offerings/:offeringId/documents/confirm
    // Confirm upload and create document record
    if (req.method === 'POST' && pathParts[0] === 'offerings' && pathParts[2] === 'documents' && pathParts[3] === 'confirm') {
      const offeringId = pathParts[1];

      // Validate offering ownership and permissions
      const { userRole } = await validateOfferingOwnership(supabase, user.id, offeringId, isBypass);
      if (!['owner', 'manager', 'editor'].includes(userRole)) {
        return new Response(
          JSON.stringify({ error: 'ACCESS_DENIED' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const body = await req.json();
      const { path, title, filename, category, visibility, mimeType, size } = body;

      if (!path || !filename || !category || !visibility) {
        return new Response(
          JSON.stringify({ error: 'MISSING_METADATA' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Download the file from storage to validate magic header (with fallback)
      let fileData: Blob | null = null;
      let actualPath = path;
      try {
        const downloadResult = await downloadWithFallback(supabase, path);
        fileData = downloadResult.data;
        actualPath = downloadResult.actualPath;
        
        if (downloadResult.isLegacy) {
          console.log(`📝 Note: File found at legacy path, will update storage_key in DB`);
        }
      } catch (error) {
        console.error('Error downloading file for validation:', error);
      }
      
      const downloadError = !fileData;

      if (downloadError || !fileData) {
        return new Response(
          JSON.stringify({ error: 'UPLOAD_VERIFICATION_FAILED' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate PDF magic header
      const fileBuffer = await fileData.arrayBuffer();
      try {
        validateFile(filename, mimeType, size, fileBuffer);
      } catch (error: any) {
        // Delete invalid file from storage (use actual path found)
        await supabase.storage.from(STORAGE_CONFIG.BUCKET_NAME).remove([actualPath]);
        return new Response(
          JSON.stringify({ error: error.errorCode || 'VALIDATION_FAILED' }),
          { status: error.statusCode || 415, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Compute checksum
      const checksum = await computeChecksum(fileBuffer);

      // Check for duplicate by checksum
      const { data: existingDoc } = await supabase
        .from('documents')
        .select('id, title, filename')
        .eq('offering_id', offeringId)
        .eq('checksum_sha256', checksum)
        .maybeSingle();

      if (existingDoc) {
        // Delete the duplicate from storage (use actual path found)
        await supabase.storage.from(STORAGE_CONFIG.BUCKET_NAME).remove([actualPath]);
        return new Response(
          JSON.stringify({ error: 'DUPLICATE_FILE', details: `Duplicate of: ${existingDoc.title}` }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Insert document record with proper uploaded_by handling
      const uploadedByValue = isBypass ? null : user.id;
      
      const { data: document, error: insertError } = await supabase
        .from('documents')
        .insert({
          offering_id: offeringId,
          title: title || filename.replace(/\.[^/.]+$/, ''),
          filename,
          mime_type: mimeType,
          size_bytes: size,
          category,
          visibility,
          storage_key: actualPath, // Use the actual path where file was found/uploaded
          uploaded_by: uploadedByValue,
          checksum_sha256: checksum
        })
        .select(`
          id,
          offering_id,
          title,
          filename,
          mime_type,
          size_bytes,
          category,
            visibility,
            download_count,
          uploaded_at,
          updated_at,
          checksum_sha256
        `)
        .single();

      if (insertError) {
        // Clean up uploaded file if database insert fails (use actual path)
        await supabase.storage.from(STORAGE_CONFIG.BUCKET_NAME).remove([actualPath]);
        
        console.error('Database insert error:', insertError);
        return new Response(
          JSON.stringify({ error: 'DATABASE_ERROR', details: insertError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Log upload action (use empty string for bypass user)
      await logDocumentAction(supabase, 'UPLOAD', uploadedByValue || '00000000-0000-0000-0000-000000000000', document.id, offeringId, { 
        filename, 
        size,
        category,
        visibility 
      });

      return new Response(
        JSON.stringify({
          success: true,
          document,
          message: 'Document uploaded successfully'
        }),
        {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Route: PATCH /documents/:id
    if (req.method === 'PATCH' && pathParts[0] === 'documents') {
      const documentId = pathParts[1];

      // Validate document ownership and permissions
      const { document, userRole } = await validateDocumentOwnership(supabase, user.id, documentId, isBypass);
      if (!['owner', 'manager', 'editor'].includes(userRole)) {
        throw new Error('Access denied: Insufficient permissions to edit document');
      }

      const body = await req.json();
      const { title, category, visibility } = body;

      const updates: any = {};
      if (title !== undefined) updates.title = title;
      if (category !== undefined) {
        if (!['Financial', 'Appraisal', 'Legal', 'Technical', 'Other'].includes(category)) {
          throw new Error('Invalid category');
        }
        updates.category = category;
      }
      if (visibility !== undefined) {
        if (!['Public', 'Private'].includes(visibility)) {
          throw new Error('Invalid visibility');
        }
        updates.visibility = visibility;
      }

      if (Object.keys(updates).length === 0) {
        throw new Error('No valid fields to update');
      }

      const { data: updatedDocument, error } = await supabase
        .from('documents')
        .update(updates)
        .eq('id', documentId)
        .select(`
          id,
          offering_id,
          title,
          filename,
          mime_type,
          size_bytes,
          category,
          visibility,
          download_count,
          uploaded_at,
          updated_at,
          checksum_sha256
        `)
        .single();

      if (error) throw error;

      // Log edit action
      await logDocumentAction(supabase, 'EDIT', user.id, documentId, null, updates);

      return new Response(
        JSON.stringify({
          success: true,
          document: updatedDocument,
          message: 'Document updated successfully'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Route: DELETE /documents/:id
    if (req.method === 'DELETE' && pathParts[0] === 'documents') {
      const documentId = pathParts[1];

      // Validate document ownership and permissions
      const { document, userRole } = await validateDocumentOwnership(supabase, user.id, documentId, isBypass);
      if (!['owner', 'manager'].includes(userRole)) {
        throw new Error('Access denied: Insufficient permissions to delete document');
      }

      // Delete from storage first (with fallback for legacy paths)
      const deleteResult = await deleteWithFallback(supabase, document.storage_key);
      
      if (!deleteResult.success) {
        console.warn('Failed to delete from storage at all paths tried');
        // Continue with database deletion even if storage fails
      } else if (deleteResult.deletedPath !== document.storage_key) {
        console.log(`📝 Deleted file at fallback path: ${deleteResult.deletedPath}`);
      }

      // Delete from database (idempotent - missing doc still returns 204)
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (dbError && !dbError.message.includes('not found')) {
        throw dbError;
      }

      // Log delete action
      await logDocumentAction(supabase, 'DELETE', user.id, documentId, null, { 
        filename: document.filename,
        storage_key_deleted: true 
      });

      // Return 204 No Content (idempotent)
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    // Route: POST /documents/:id/view-url
    if (req.method === 'POST' && pathParts[0] === 'documents' && pathParts[2] === 'view-url') {
      const documentId = pathParts[1];

      // Validate document ownership
      const { document } = await validateDocumentOwnership(supabase, user.id, documentId, isBypass);

      // Generate pre-signed URL for viewing (valid for 1 hour) with fallback
      const { signedUrl, actualPath, isLegacy } = await createSignedUrlWithFallback(
        supabase, 
        document.storage_key, 
        3600, 
        false
      );
      
      if (isLegacy && actualPath !== document.storage_key) {
        console.log(`📝 Generated URL for legacy path: ${actualPath}, consider updating storage_key in DB`);
      }

      // Log view action
      await logDocumentAction(supabase, 'VIEW', user.id, documentId, null, { 
        filename: document.filename 
      });

      return new Response(
        JSON.stringify({
          success: true,
          signed_url: signedUrl,
          expires_in: 3600,
          expires_at: new Date(Date.now() + 3600 * 1000).toISOString()
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Route: GET /documents/:id/download
    // Direct file download with proper headers
    if (req.method === 'GET' && pathParts[0] === 'documents' && pathParts[2] === 'download') {
      const documentId = pathParts[1];

      // Validate document ownership
      const { document } = await validateDocumentOwnership(supabase, user.id, documentId, isBypass);

      // Download file from storage (with fallback for legacy paths)
      const { data: fileData, actualPath, isLegacy } = await downloadWithFallback(supabase, document.storage_key);
      
      if (!fileData) {
        throw new Error('File not found at any known path');
      }
      
      if (isLegacy && actualPath !== document.storage_key) {
        console.log(`📝 Downloaded file from legacy path: ${actualPath}, consider updating storage_key in DB`);
      }

      // Sanitize filename for Content-Disposition header
      const safeFilename = document.filename
        .replace(/[^\w\s.-]/g, '_')
        .replace(/\s+/g, '_');

      // Increment download count
      await supabase
        .from('documents')
        .update({ download_count: document.download_count + 1 })
        .eq('id', documentId);

      // Log download action
      await logDocumentAction(supabase, 'DOWNLOAD', user.id, documentId, null, { 
        filename: document.filename,
        download_count: document.download_count + 1 
      });

      // Return file with proper headers for secure download
      return new Response(fileData, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${safeFilename}"`,
          'Content-Length': document.size_bytes.toString(),
          'Cache-Control': 'private, max-age=0',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }

    // Route: POST /documents/:id/download-url
    if (req.method === 'POST' && pathParts[0] === 'documents' && pathParts[2] === 'download-url') {
      const documentId = pathParts[1];

      // Validate document ownership
      const { document } = await validateDocumentOwnership(supabase, user.id, documentId, isBypass);

      // Generate pre-signed URL for download (valid for 1 hour) with fallback
      const { signedUrl, actualPath, isLegacy } = await createSignedUrlWithFallback(
        supabase, 
        document.storage_key, 
        3600, 
        true
      );
      
      if (isLegacy && actualPath !== document.storage_key) {
        console.log(`📝 Generated download URL for legacy path: ${actualPath}, consider updating storage_key in DB`);
      }

      // Increment download count
      await supabase
        .from('documents')
        .update({ download_count: document.download_count + 1 })
        .eq('id', documentId);

      // Log download action
      await logDocumentAction(supabase, 'DOWNLOAD', user.id, documentId, null, { 
        filename: document.filename,
        download_count: document.download_count + 1 
      });

      return new Response(
        JSON.stringify({
          success: true,
          signed_url: signedUrl,
          expires_in: 3600,
          expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
          download_count: document.download_count + 1
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // If no route matches
    throw new Error('Endpoint not found');

  } catch (error) {
    console.error('Documents API error:', error);
    
    // Handle specific error types with proper status codes
    const statusCode = (error as any).statusCode;
    const errorCode = (error as any).errorCode;
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    // Return 413 for file size exceeded
    if (statusCode === 413) {
      return new Response(
        JSON.stringify({ error: errorCode || 'FILE_TOO_LARGE' }),
        {
          status: 413,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Return 415 for unsupported media type (non-PDF)
    if (statusCode === 415) {
      return new Response(
        JSON.stringify({ error: errorCode || 'ONLY_PDF_ALLOWED' }),
        {
          status: 415,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Handle other errors with appropriate status codes
    return new Response(
      JSON.stringify({
        error: errorMessage
      }),
      {
        status: errorMessage.includes('Missing authorization header') ? 401 :
                errorMessage.includes('Authentication failed') ? 401 :
                errorMessage.includes('Access denied') ? 403 :
                errorMessage.includes('not found') ? 404 :
                errorMessage.includes('Duplicate') ? 409 :
                errorMessage.includes('Endpoint not found') ? 404 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});