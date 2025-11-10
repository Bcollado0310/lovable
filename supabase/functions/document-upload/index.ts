const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-dev-bypass-token',
};

// Development authentication bypass middleware
interface AuthResult {
  user: any;
  isBypass: boolean;
}

async function devAuthBypass(req: Request, supabase: any): Promise<AuthResult> {
  const nodeEnv = Deno.env.get('NODE_ENV') || 'development';
  
  // CRITICAL: Never enable bypass in production - hard stop
  if (nodeEnv === 'production') {
    return await normalAuth(req, supabase);
  }

  const devAuthBypass = Deno.env.get('DEV_AUTH_BYPASS');
  const devBypassToken = Deno.env.get('DEV_BYPASS_TOKEN');
  const devBypassUserId = Deno.env.get('DEV_BYPASS_USER_ID');
  const devBypassUserRole = Deno.env.get('DEV_BYPASS_USER_ROLE');

  // Check if bypass is enabled and configured
  if (devAuthBypass !== 'true' || !devBypassToken || !devBypassUserId || !devBypassUserRole) {
    return await normalAuth(req, supabase);
  }

  // Check for bypass token in request headers
  const requestBypassToken = req.headers.get('x-dev-bypass-token');
  
  if (requestBypassToken === devBypassToken) {
    // SECURITY WARNING: Log bypass usage in development
    const timestamp = new Date().toISOString();
    const url = new URL(req.url);
    const route = url.pathname;
    const method = req.method;
    
    console.warn(`🚨 DEV AUTH BYPASS ACTIVE 🚨`);
    console.warn(`  Timestamp: ${timestamp}`);
    console.warn(`  User ID: ${devBypassUserId}`);
    console.warn(`  Route: ${method} ${route}`);
    console.warn(`  Role: ${devBypassUserRole}`);
    console.warn(`  Environment: ${nodeEnv}`);
    
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

  // No bypass token or token mismatch - use normal auth
  return await normalAuth(req, supabase);
}

async function normalAuth(req: Request, supabase: any): Promise<AuthResult> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    throw new Error('Authorization header required');
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  );

  if (userError || !user) {
    throw new Error('Invalid authentication');
  }

  return {
    user,
    isBypass: false
  };
}

// File validation constants
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
  'text/csv',
  'image/png',
  'image/jpeg'
];

const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'xlsx', 'csv', 'png', 'jpg', 'jpeg'];

// Compute SHA256 checksum
async function computeChecksum(arrayBuffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Validate file
function validateFile(filename: string, mimeType: string, size: number) {
  // Check file size
  if (size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds limit of ${MAX_FILE_SIZE / 1024 / 1024} MB`);
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new Error(`File type ${mimeType} is not allowed`);
  }

  // Check file extension
  const extension = filename.split('.').pop()?.toLowerCase();
  if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
    throw new Error(`File extension .${extension} is not allowed`);
  }
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

    // Use development auth bypass middleware FIRST
    const { user, isBypass } = await devAuthBypass(req, supabase);
    
    if (isBypass) {
      console.log('📋 Using dev bypass user for document-upload');
    }

    if (req.method === 'POST') {
      const formData = await req.formData();
      const file = formData.get('file') as File;
      const offeringId = formData.get('offering_id') as string;
      const title = formData.get('title') as string;
      const category = formData.get('category') as string;
      const visibility = formData.get('visibility') as string;

      if (!file || !offeringId || !title || !category || !visibility) {
        throw new Error('Missing required fields');
      }

      // Validate file
      validateFile(file.name, file.type, file.size);

      // Check user permissions for this offering
      const { data: offering, error: offeringError } = await supabase
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
        .eq('developer_organization_members.user_id', user.id)
        .single();

      if (offeringError || !offering) {
        throw new Error('Access denied: Cannot upload to this offering');
      }

      // Check if user has write permissions
      const userRole = offering.developer_organization_members[0]?.role;
      if (!['owner', 'manager', 'editor'].includes(userRole)) {
        throw new Error('Access denied: Insufficient permissions');
      }

      // Convert file to ArrayBuffer and compute checksum
      const fileBuffer = await file.arrayBuffer();
      const checksum = await computeChecksum(fileBuffer);
      const fileArray = new Uint8Array(fileBuffer);

      // Check for duplicate files by checksum
      const { data: existingDoc, error: duplicateError } = await supabase
        .from('documents')
        .select('id, title, filename')
        .eq('offering_id', offeringId)
        .eq('checksum_sha256', checksum)
        .single();

      if (!duplicateError && existingDoc) {
        return new Response(
          JSON.stringify({
            error: 'Duplicate file detected',
            existing_document: existingDoc
          }),
          {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Generate unique filename with timestamp
      const timestamp = Date.now();
      const extension = file.name.split('.').pop();
      const cleanFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storageKey = `offerings/${offeringId}/${timestamp}_${cleanFilename}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('offering-media')
        .upload(storageKey, fileArray, {
          contentType: file.type,
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Insert document record
      const { data: document, error: insertError } = await supabase
        .from('documents')
        .insert({
          offering_id: offeringId,
          title,
          filename: file.name,
          mime_type: file.type,
          size_bytes: file.size,
          category,
          visibility,
          storage_key: storageKey,
          uploaded_by: user.id,
          checksum_sha256: checksum
        })
        .select()
        .single();

      if (insertError) {
        // Clean up uploaded file if database insert fails
        await supabase.storage
          .from('offering-media')
          .remove([storageKey]);
        
        throw new Error(`Database error: ${insertError.message}`);
      }

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

    } else if (req.method === 'GET') {
      // Generate pre-signed URL for download/view
      const url = new URL(req.url);
      const documentId = url.searchParams.get('document_id');
      const action = url.searchParams.get('action'); // 'view' or 'download'

      if (!documentId) {
        throw new Error('Document ID required');
      }

      // Get document and verify access
      const { data: document, error: docError } = await supabase
        .from('documents')
        .select(`
          *,
          developer_offerings!inner(
            organization_id,
            developer_organization_members!inner(
              user_id
            )
          )
        `)
        .eq('id', documentId)
        .eq('developer_offerings.developer_organization_members.user_id', user.id)
        .single();

      if (docError || !document) {
        throw new Error('Document not found or access denied');
      }

      // Generate pre-signed URL (valid for 1 hour)
      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from('offering-media')
        .createSignedUrl(document.storage_key, 3600, {
          download: action === 'download'
        });

      if (urlError) {
        throw new Error(`Failed to generate URL: ${urlError.message}`);
      }

      // Update download count if it's a download action
      if (action === 'download') {
        await supabase
          .from('documents')
          .update({ download_count: document.download_count + 1 })
          .eq('id', documentId);
      }

      return new Response(
        JSON.stringify({
          success: true,
          signed_url: signedUrlData.signedUrl,
          expires_in: 3600
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );

    } else {
      throw new Error('Method not allowed');
    }

  } catch (error) {
    console.error('Document upload/download error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    return new Response(
      JSON.stringify({
        error: errorMessage
      }),
      {
        status: errorMessage.includes('Access denied') ? 403 :
                errorMessage.includes('not found') ? 404 :
                errorMessage.includes('Duplicate') ? 409 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});