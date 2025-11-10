-- PII Encryption and Audit System Migration

-- Create audit log table for PII access tracking
CREATE TABLE public.pii_access_audit (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id uuid NOT NULL,
  accessed_table text NOT NULL,
  accessed_column text NOT NULL,
  record_id uuid NOT NULL,
  operation text NOT NULL, -- 'decrypt', 'view', 'export'
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on audit table
ALTER TABLE public.pii_access_audit ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view PII access logs" 
ON public.pii_access_audit 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert audit logs
CREATE POLICY "System can insert PII access logs" 
ON public.pii_access_audit 
FOR INSERT 
WITH CHECK (true);

-- Create encrypted storage columns for developer_investors
ALTER TABLE public.developer_investors 
ADD COLUMN first_name_encrypted text,
ADD COLUMN last_name_encrypted text,
ADD COLUMN email_encrypted text,
ADD COLUMN phone_encrypted text;

-- Create table for encrypted investor additional data
CREATE TABLE public.developer_investors_encrypted (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  investor_id uuid NOT NULL REFERENCES developer_investors(id) ON DELETE CASCADE UNIQUE,
  address_encrypted text,
  bank_last4_encrypted text,
  documents_encrypted text, -- JSON array of document metadata
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on encrypted data table
ALTER TABLE public.developer_investors_encrypted ENABLE ROW LEVEL SECURITY;

-- Only admins can access encrypted additional data
CREATE POLICY "Admins can manage encrypted investor data" 
ON public.developer_investors_encrypted 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Function to audit PII access (MUST be called before any decryption)
CREATE OR REPLACE FUNCTION public.audit_pii_access(
  p_table_name text,
  p_column_name text,
  p_record_id uuid,
  p_operation text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log if user is actually an admin
  IF has_role(auth.uid(), 'admin'::app_role) THEN
    INSERT INTO public.pii_access_audit (
      admin_user_id,
      accessed_table,
      accessed_column,
      record_id,
      operation,
      ip_address,
      user_agent
    ) VALUES (
      auth.uid(),
      p_table_name,
      p_column_name,
      p_record_id,
      p_operation,
      inet_client_addr(),
      current_setting('request.headers', true)::json->>'user-agent'
    );
    RETURN true;
  END IF;
  RETURN false;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't let audit logging failures block the main operation
    -- But log to system logs
    RAISE WARNING 'PII audit logging failed: %', SQLERRM;
    RETURN false;
END;
$$;

-- Function to encrypt PII data (admin only)
CREATE OR REPLACE FUNCTION public.encrypt_pii(
  plaintext text,
  p_table_name text,
  p_column_name text,
  p_record_id uuid
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key text;
  encrypted_data text;
BEGIN
  -- Verify admin access
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: Admin role required for PII encryption';
  END IF;

  -- Audit the encryption operation
  PERFORM audit_pii_access(p_table_name, p_column_name, p_record_id, 'encrypt');

  -- In a real implementation, this would use a proper KMS service
  -- For now, we'll use a deterministic approach with the secret
  -- Note: In production, use proper AES-GCM with nonce/IV
  encryption_key := current_setting('app.pii_encryption_key', true);
  
  IF encryption_key IS NULL OR encryption_key = '' THEN
    RAISE EXCEPTION 'Encryption key not configured';
  END IF;

  -- Simple encryption placeholder (in production, use proper AES-GCM)
  -- This is a simplified version - real implementation would use pgcrypto with AES-GCM
  SELECT encode(
    encrypt(
      plaintext::bytea,
      encryption_key::bytea,
      'aes'
    ),
    'base64'
  ) INTO encrypted_data;

  RETURN encrypted_data;
EXCEPTION
  WHEN OTHERS THEN
    -- Never log the plaintext or encryption key
    RAISE EXCEPTION 'Encryption failed for security reasons';
END;
$$;

-- Function to decrypt PII data (admin only)
CREATE OR REPLACE FUNCTION public.decrypt_pii(
  encrypted_data text,
  p_table_name text,
  p_column_name text,
  p_record_id uuid
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key text;
  decrypted_data text;
BEGIN
  -- Verify admin access
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: Admin role required for PII decryption';
  END IF;

  -- Audit the decryption operation
  PERFORM audit_pii_access(p_table_name, p_column_name, p_record_id, 'decrypt');

  -- Get encryption key
  encryption_key := current_setting('app.pii_encryption_key', true);
  
  IF encryption_key IS NULL OR encryption_key = '' THEN
    RAISE EXCEPTION 'Decryption key not configured';
  END IF;

  -- Decrypt the data
  SELECT convert_from(
    decrypt(
      decode(encrypted_data, 'base64'),
      encryption_key::bytea,
      'aes'
    ),
    'UTF8'
  ) INTO decrypted_data;

  RETURN decrypted_data;
EXCEPTION
  WHEN OTHERS THEN
    -- Never log the encrypted data or decryption key
    RAISE EXCEPTION 'Decryption failed for security reasons';
END;
$$;

-- Function to safely get investor PII (admin only, with auditing)
CREATE OR REPLACE FUNCTION public.get_investor_pii(
  p_investor_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  investor_record RECORD;
  encrypted_record RECORD;
  result jsonb := '{}';
BEGIN
  -- Verify admin access
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: Admin role required for PII access';
  END IF;

  -- Get base investor record
  SELECT * INTO investor_record
  FROM developer_investors
  WHERE id = p_investor_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Investor not found';
  END IF;

  -- Get encrypted additional data
  SELECT * INTO encrypted_record
  FROM developer_investors_encrypted
  WHERE investor_id = p_investor_id;

  -- Decrypt and build result (each field audited separately)
  IF investor_record.first_name_encrypted IS NOT NULL THEN
    result := result || jsonb_build_object(
      'first_name', 
      decrypt_pii(investor_record.first_name_encrypted, 'developer_investors', 'first_name', p_investor_id)
    );
  END IF;

  IF investor_record.last_name_encrypted IS NOT NULL THEN
    result := result || jsonb_build_object(
      'last_name', 
      decrypt_pii(investor_record.last_name_encrypted, 'developer_investors', 'last_name', p_investor_id)
    );
  END IF;

  IF investor_record.email_encrypted IS NOT NULL THEN
    result := result || jsonb_build_object(
      'email', 
      decrypt_pii(investor_record.email_encrypted, 'developer_investors', 'email', p_investor_id)
    );
  END IF;

  IF investor_record.phone_encrypted IS NOT NULL THEN
    result := result || jsonb_build_object(
      'phone', 
      decrypt_pii(investor_record.phone_encrypted, 'developer_investors', 'phone', p_investor_id)
    );
  END IF;

  -- Include encrypted additional data if exists
  IF encrypted_record IS NOT NULL THEN
    IF encrypted_record.address_encrypted IS NOT NULL THEN
      result := result || jsonb_build_object(
        'address', 
        decrypt_pii(encrypted_record.address_encrypted, 'developer_investors_encrypted', 'address', p_investor_id)
      );
    END IF;

    IF encrypted_record.bank_last4_encrypted IS NOT NULL THEN
      result := result || jsonb_build_object(
        'bank_last4', 
        decrypt_pii(encrypted_record.bank_last4_encrypted, 'developer_investors_encrypted', 'bank_last4', p_investor_id)
      );
    END IF;

    IF encrypted_record.documents_encrypted IS NOT NULL THEN
      result := result || jsonb_build_object(
        'documents', 
        decrypt_pii(encrypted_record.documents_encrypted, 'developer_investors_encrypted', 'documents', p_investor_id)::jsonb
      );
    END IF;
  END IF;

  -- Add non-PII data
  result := result || jsonb_build_object(
    'id', investor_record.id,
    'total_invested', investor_record.total_invested,
    'investment_count', investor_record.investment_count,
    'status', investor_record.status,
    'investor_type', investor_record.investor_type,
    'created_at', investor_record.created_at,
    'updated_at', investor_record.updated_at
  );

  RETURN result;
END;
$$;

-- Create indexes for performance
CREATE INDEX idx_pii_access_audit_admin_user ON public.pii_access_audit(admin_user_id);
CREATE INDEX idx_pii_access_audit_table_record ON public.pii_access_audit(accessed_table, record_id);
CREATE INDEX idx_pii_access_audit_created_at ON public.pii_access_audit(created_at);

-- Create trigger for updating encrypted data timestamps
CREATE TRIGGER update_encrypted_investors_updated_at
BEFORE UPDATE ON public.developer_investors_encrypted
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();