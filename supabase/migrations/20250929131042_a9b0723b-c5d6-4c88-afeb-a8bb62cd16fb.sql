-- Create per-offering investor aliases table
CREATE TABLE public.developer_offering_investor_aliases (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL,
  offering_id uuid NOT NULL REFERENCES developer_offerings(id) ON DELETE CASCADE,
  investor_id uuid NOT NULL REFERENCES developer_investors(id) ON DELETE CASCADE,
  alias_code text NOT NULL, -- e.g., "INV-0001", "INV-0002"
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(offering_id, investor_id),
  UNIQUE(offering_id, alias_code)
);

-- Enable RLS
ALTER TABLE public.developer_offering_investor_aliases ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view offering aliases from their organization" 
ON public.developer_offering_investor_aliases 
FOR SELECT 
USING (belongs_to_organization(auth.uid(), organization_id));

CREATE POLICY "Owners and managers can manage offering aliases" 
ON public.developer_offering_investor_aliases 
FOR ALL 
USING (has_developer_role(auth.uid(), organization_id, 'owner'::developer_role) OR has_developer_role(auth.uid(), organization_id, 'manager'::developer_role))
WITH CHECK (has_developer_role(auth.uid(), organization_id, 'owner'::developer_role) OR has_developer_role(auth.uid(), organization_id, 'manager'::developer_role));

-- Function to generate deterministic per-offering aliases
CREATE OR REPLACE FUNCTION public.generate_offering_investor_alias()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  offering_rec RECORD;
  next_number INTEGER;
  new_alias_code TEXT;
BEGIN
  -- Get offering details
  SELECT organization_id INTO offering_rec
  FROM developer_offerings 
  WHERE id = NEW.offering_id;
  
  -- Get the next number for this offering
  SELECT COALESCE(MAX(CAST(SUBSTRING(a.alias_code FROM 'INV-(\d+)') AS INTEGER)), 0) + 1
  INTO next_number
  FROM developer_offering_investor_aliases a
  WHERE a.offering_id = NEW.offering_id;
  
  -- Generate alias code
  new_alias_code := 'INV-' || LPAD(next_number::text, 4, '0');
  
  -- Insert the alias
  INSERT INTO public.developer_offering_investor_aliases (
    organization_id,
    offering_id,
    investor_id,
    alias_code
  ) VALUES (
    offering_rec.organization_id,
    NEW.offering_id,
    NEW.investor_id,
    new_alias_code
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for auto-alias generation when contribution events are created
CREATE TRIGGER generate_offering_investor_alias_trigger
AFTER INSERT ON public.developer_contribution_events
FOR EACH ROW
EXECUTE FUNCTION public.generate_offering_investor_alias();

-- Function to backfill existing investors with deterministic aliases
CREATE OR REPLACE FUNCTION public.backfill_offering_investor_aliases()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  event_rec RECORD;
  next_number INTEGER;
  new_alias_code TEXT;
BEGIN
  -- Process each unique investor-offering combination from contribution events
  FOR event_rec IN 
    SELECT DISTINCT offering_id, investor_id, organization_id
    FROM developer_contribution_events
    WHERE event_type = 'investment'
    ORDER BY offering_id, investor_id
  LOOP
    -- Check if alias already exists
    IF NOT EXISTS (
      SELECT 1 FROM developer_offering_investor_aliases 
      WHERE offering_id = event_rec.offering_id 
      AND investor_id = event_rec.investor_id
    ) THEN
      -- Get the next number for this offering
      SELECT COALESCE(MAX(CAST(SUBSTRING(a.alias_code FROM 'INV-(\d+)') AS INTEGER)), 0) + 1
      INTO next_number
      FROM developer_offering_investor_aliases a
      WHERE a.offering_id = event_rec.offering_id;
      
      -- Generate alias code
      new_alias_code := 'INV-' || LPAD(next_number::text, 4, '0');
      
      -- Insert the alias
      INSERT INTO public.developer_offering_investor_aliases (
        organization_id,
        offering_id,
        investor_id,
        alias_code
      ) VALUES (
        event_rec.organization_id,
        event_rec.offering_id,
        event_rec.investor_id,
        new_alias_code
      );
    END IF;
  END LOOP;
END;
$$;

-- Execute backfill for existing data
SELECT public.backfill_offering_investor_aliases();

-- Create indexes for performance
CREATE INDEX idx_offering_investor_aliases_offering_id ON public.developer_offering_investor_aliases(offering_id);
CREATE INDEX idx_offering_investor_aliases_investor_id ON public.developer_offering_investor_aliases(investor_id);
CREATE INDEX idx_offering_investor_aliases_alias_code ON public.developer_offering_investor_aliases(alias_code);