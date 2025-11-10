-- Create enums for document categories and visibility
CREATE TYPE document_category AS ENUM ('Financial', 'Appraisal', 'Legal', 'Technical', 'Other');
CREATE TYPE document_visibility AS ENUM ('Public', 'Private');

-- Create documents table
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offering_id UUID NOT NULL REFERENCES public.developer_offerings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL CHECK (size_bytes >= 0),
  category document_category NOT NULL DEFAULT 'Other',
  visibility document_visibility NOT NULL DEFAULT 'Public',
  storage_key TEXT NOT NULL, -- Path in object storage
  download_count INTEGER NOT NULL DEFAULT 0 CHECK (download_count >= 0),
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  checksum_sha256 TEXT, -- Optional checksum for file integrity
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX idx_documents_offering_category ON public.documents (offering_id, category);
CREATE INDEX idx_documents_offering_visibility ON public.documents (offering_id, visibility);
CREATE INDEX idx_documents_uploaded_by ON public.documents (uploaded_by);
CREATE INDEX idx_documents_storage_key ON public.documents (storage_key);

-- Create RLS policies
CREATE POLICY "Users can view documents from their organization offerings" 
ON public.documents 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.developer_offerings o
    JOIN public.developer_organization_members m ON m.organization_id = o.organization_id
    WHERE o.id = documents.offering_id 
    AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert documents for their organization offerings" 
ON public.documents 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.developer_offerings o
    JOIN public.developer_organization_members m ON m.organization_id = o.organization_id
    WHERE o.id = documents.offering_id 
    AND m.user_id = auth.uid()
    AND (
      has_developer_role(auth.uid(), o.organization_id, 'owner'::developer_role) OR
      has_developer_role(auth.uid(), o.organization_id, 'manager'::developer_role) OR
      has_developer_role(auth.uid(), o.organization_id, 'editor'::developer_role)
    )
  )
);

CREATE POLICY "Users can update documents from their organization offerings" 
ON public.documents 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 
    FROM public.developer_offerings o
    JOIN public.developer_organization_members m ON m.organization_id = o.organization_id
    WHERE o.id = documents.offering_id 
    AND m.user_id = auth.uid()
    AND (
      has_developer_role(auth.uid(), o.organization_id, 'owner'::developer_role) OR
      has_developer_role(auth.uid(), o.organization_id, 'manager'::developer_role) OR
      has_developer_role(auth.uid(), o.organization_id, 'editor'::developer_role)
    )
  )
);

CREATE POLICY "Users can delete documents from their organization offerings" 
ON public.documents 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 
    FROM public.developer_offerings o
    JOIN public.developer_organization_members m ON m.organization_id = o.organization_id
    WHERE o.id = documents.offering_id 
    AND m.user_id = auth.uid()
    AND (
      has_developer_role(auth.uid(), o.organization_id, 'owner'::developer_role) OR
      has_developer_role(auth.uid(), o.organization_id, 'manager'::developer_role)
    )
  )
);

-- Admin policies
CREATE POLICY "Admins can manage all documents" 
ON public.documents 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();