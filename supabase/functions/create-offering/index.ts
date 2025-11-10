const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-dev-bypass-token',
  'Content-Type': 'application/json',
};

// Development authentication bypass middleware
interface AuthResult {
  user: any;
  isBypass: boolean;
}

async function devAuthBypass(req: Request): Promise<AuthResult> {
  const nodeEnv = Deno.env.get('NODE_ENV') || 'development';
  
  // CRITICAL: Never enable bypass in production - hard stop
  if (nodeEnv === 'production') {
    return await normalAuth(req);
  }

  const devAuthBypass = Deno.env.get('DEV_AUTH_BYPASS');
  const devBypassToken = Deno.env.get('DEV_BYPASS_TOKEN');
  const devBypassUserId = Deno.env.get('DEV_BYPASS_USER_ID');
  const devBypassUserRole = Deno.env.get('DEV_BYPASS_USER_ROLE');

  // Check if bypass is enabled and configured
  if (devAuthBypass !== 'true' || !devBypassToken || !devBypassUserId || !devBypassUserRole) {
    return await normalAuth(req);
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
  return await normalAuth(req);
}

async function normalAuth(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    throw new Error('Authorization header required');
  }

  let userId: string;
  try {
    const token = authHeader.replace('Bearer ', '');
    const payload = JSON.parse(atob(token.split('.')[1]));
    userId = payload.sub;
  } catch (e) {
    throw new Error('Invalid authentication token');
  }

  return {
    user: { id: userId },
    isBypass: false
  };
}


interface CreateOfferingResponse {
  success: boolean;
  offering?: any;
  offeringId?: string;
  error?: string;
}

interface OfferingFormData {
  title: string;
  summary?: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  lat?: number;
  lng?: number;
  type?: string;
  tags?: string[];
  goal?: number;
  soft_cap?: number;
  hard_cap?: number;
  min_invest?: number;
  step_invest?: number;
  max_invest?: number;
  valuation?: number;
  target_irr?: number;
  equity_multiple?: number;
  hold_years?: number;
  distribution_freq?: string;
  close_date?: string;
  risk_bucket?: string;
  is_featured?: boolean;
  is_private?: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const response: CreateOfferingResponse = {
    success: false
  };

  try {
    console.log('create-offering: Starting request');

    // Use development auth bypass middleware FIRST
    const { user, isBypass } = await devAuthBypass(req);
    
    if (isBypass) {
      console.log('📋 Using dev bypass user for create-offering');
    }

    const userId = user.id;
    console.log('create-offering: Using userId:', userId);

    // Create service role client (bypasses RLS)
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.55.0?target=deno');
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Parse request data
    let formData: OfferingFormData;
    let orgId: string;
    let files: File[] = [];

    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      // Handle multipart form data (with file uploads)
      const form = await req.formData();
      
      // Extract orgId
      orgId = form.get('orgId') as string;
      if (!orgId) {
        response.error = 'Organization ID is required';
        return new Response(JSON.stringify(response), {
          status: 200,
          headers: corsHeaders
        });
      }

      // Extract form data
      const formDataStr = form.get('form') as string;
      if (!formDataStr) {
        response.error = 'Form data is required';
        return new Response(JSON.stringify(response), {
          status: 200,
          headers: corsHeaders
        });
      }

      try {
        formData = JSON.parse(formDataStr);
      } catch (e) {
        response.error = 'Invalid form data JSON';
        return new Response(JSON.stringify(response), {
          status: 200,
          headers: corsHeaders
        });
      }

      // Extract files
      for (const [key, value] of form.entries()) {
        if (key.startsWith('file_') && value instanceof File) {
          files.push(value);
        }
      }

      console.log('create-offering: Parsed multipart data - files:', files.length);
    } else {
      // Handle JSON data (no file uploads)
      const body = await req.json();
      orgId = body.orgId;
      formData = body.form;

      if (!orgId) {
        response.error = 'Organization ID is required';
        return new Response(JSON.stringify(response), {
          status: 200,
          headers: corsHeaders
        });
      }

      if (!formData) {
        response.error = 'Form data is required';
        return new Response(JSON.stringify(response), {
          status: 200,
          headers: corsHeaders
        });
      }

      console.log('create-offering: Parsed JSON data');
    }

    // Validate user is member of organization
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('developer_organization_members')
      .select('role')
      .eq('user_id', userId)
      .eq('organization_id', orgId)
      .maybeSingle();

    if (membershipError) {
      console.error('create-offering: Membership check error:', membershipError);
      response.error = 'Failed to verify organization membership';
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: corsHeaders
      });
    }

    if (!membership) {
      response.error = 'You are not a member of this organization';
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: corsHeaders
      });
    }

    console.log('create-offering: User membership verified, role:', membership.role);

    // Validate required fields
    if (!formData.title || formData.title.trim() === '') {
      response.error = 'Title is required';
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: corsHeaders
      });
    }

    // Create offering record
    const offeringData = {
      org_id: orgId,
      title: formData.title.trim(),
      summary: formData.summary?.trim() || null,
      description: formData.description?.trim() || null,
      address: formData.address?.trim() || null,
      city: formData.city?.trim() || null,
      state: formData.state?.trim() || null,
      country: formData.country?.trim() || null,
      lat: formData.lat || null,
      lng: formData.lng || null,
      type: formData.type || 'residential',
      tags: formData.tags || [],
      goal: formData.goal || null,
      soft_cap: formData.soft_cap || null,
      hard_cap: formData.hard_cap || null,
      min_invest: formData.min_invest || 1000,
      step_invest: formData.step_invest || 1000,
      max_invest: formData.max_invest || null,
      valuation: formData.valuation || null,
      target_irr: formData.target_irr || null,
      equity_multiple: formData.equity_multiple || null,
      hold_years: formData.hold_years || null,
      distribution_freq: formData.distribution_freq || null,
      close_date: formData.close_date || null,
      risk_bucket: formData.risk_bucket || null,
      is_featured: formData.is_featured || false,
      is_private: formData.is_private || false,
    };

    console.log('create-offering: Creating offering with data:', { title: offeringData.title, orgId });

    const { data: offering, error: offeringError } = await supabaseAdmin
      .from('offerings')
      .insert(offeringData)
      .select()
      .single();

    if (offeringError) {
      console.error('create-offering: Database error:', offeringError);
      response.error = `Failed to create offering: ${offeringError.message}`;
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: corsHeaders
      });
    }

    console.log('create-offering: Offering created with ID:', offering.id);

    // Mirror record into developer_offerings so developer portal shares the same ID
    const locationString = (formData.city && formData.state)
      ? `${formData.city}, ${formData.state}`
      : (formData.city || formData.address || formData.country || 'Location pending');

    const developerOfferingPayload = {
      id: offering.id,
      organization_id: orgId,
      title: offering.title,
      description: offering.description || formData.description || 'Description pending',
      location: locationString,
      property_type: offering.type || 'residential',
      target_amount: formData.goal || 0,
      raised_amount: 0,
      minimum_investment: formData.min_invest || 1000,
      expected_annual_return: formData.target_irr || null,
      status: 'coming_soon',
      funding_deadline: formData.close_date || null,
      images: [],
      documents: [],
      investor_count: 0,
    };

    const { error: devOfferingError } = await supabaseAdmin
      .from('developer_offerings')
      .upsert(developerOfferingPayload, { onConflict: 'id' });

    if (devOfferingError) {
      console.error('create-offering: Failed to sync developer_offerings:', devOfferingError);
    }

    // Handle file uploads if any
    const uploadedFiles: any[] = [];
    let coverUrl: string | null = null;

    if (files.length > 0) {
      console.log('create-offering: Processing', files.length, 'files');

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = `${Date.now()}_${file.name}`;
        const filePath = `${orgId}/${offering.id}/${fileName}`;

        try {
          // Upload file to storage
          const fileBuffer = await file.arrayBuffer();
          const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from('offering-media')
            .upload(filePath, fileBuffer, {
              contentType: file.type,
              upsert: false
            });

          if (uploadError) {
            console.error('create-offering: Upload error for', fileName, ':', uploadError);
            continue;
          }

          // Get public URL
          const { data: urlData } = supabaseAdmin.storage
            .from('offering-media')
            .getPublicUrl(filePath);

          const fileUrl = urlData.publicUrl;

          // Save to offering_media table
          const mediaKind = file.type.startsWith('video/') ? 'video' : 'image';
          const { data: mediaData, error: mediaError } = await supabaseAdmin
            .from('offering_media')
            .insert({
              offering_id: offering.id,
              url: fileUrl,
              kind: mediaKind,
              position: i
            })
            .select()
            .single();

          if (mediaError) {
            console.error('create-offering: Media record error:', mediaError);
            continue;
          }

          uploadedFiles.push(mediaData);

          // Set first image as cover
          if (i === 0 && mediaKind === 'image') {
            coverUrl = fileUrl;
          }

          console.log('create-offering: Uploaded file:', fileName, 'as', mediaKind);
        } catch (fileError) {
          console.error('create-offering: File processing error:', fileError);
          continue;
        }
      }

      // Update offering with cover URL if we have one
      if (coverUrl) {
        const { error: updateError } = await supabaseAdmin
          .from('offerings')
          .update({ cover_url: coverUrl })
          .eq('id', offering.id);

        if (updateError) {
          console.error('create-offering: Cover URL update error:', updateError);
        } else {
          offering.cover_url = coverUrl;
          console.log('create-offering: Set cover URL:', coverUrl);
        }
      }
    }

    const uploadedImageUrls = uploadedFiles
      .filter(file => file && file.kind === 'image')
      .map(file => file.url)
      .filter(Boolean);

    if (uploadedImageUrls.length > 0) {
      const { error: devImageUpdateError } = await supabaseAdmin
        .from('developer_offerings')
        .update({ images: uploadedImageUrls })
        .eq('id', offering.id);

      if (devImageUpdateError) {
        console.error('create-offering: Failed to sync developer_offerings images:', devImageUpdateError);
      }
    }

    // Success response
    response.success = true;
    response.offering = offering;
    response.offeringId = offering.id;

    console.log('create-offering: Successfully created offering', offering.id, 'with', uploadedFiles.length, 'files');

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('create-offering: Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    response.error = `Internal server error: ${errorMessage}`;
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: corsHeaders
    });
  }
});