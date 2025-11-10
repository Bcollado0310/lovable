-- Fix RLS on public.offering_media to reference developer_offerings and allow dev org in dev
-- Drop existing policies (names from previous config)
DROP POLICY IF EXISTS "Users can insert media for their organization offerings" ON public.offering_media;
DROP POLICY IF EXISTS "Users can view media from their organization offerings" ON public.offering_media;
DROP POLICY IF EXISTS "Users can update media from their organization offerings" ON public.offering_media;
DROP POLICY IF EXISTS "Users can delete media from their organization offerings" ON public.offering_media;

-- Recreate policies using developer_offerings and org membership; allow dev org id
CREATE POLICY "Users can insert media for their organization offerings"
ON public.offering_media
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.developer_offerings AS dof
    JOIN public.developer_organization_members AS m ON m.organization_id = dof.organization_id
    WHERE dof.id = offering_media.offering_id
      AND (
        (auth.uid() IS NOT NULL AND m.user_id = auth.uid())
        OR dof.organization_id = '550e8400-e29b-41d4-a716-446655440000'
      )
  )
);

CREATE POLICY "Users can view media from their organization offerings"
ON public.offering_media
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.developer_offerings AS dof
    JOIN public.developer_organization_members AS m ON m.organization_id = dof.organization_id
    WHERE dof.id = offering_media.offering_id
      AND (
        (auth.uid() IS NOT NULL AND m.user_id = auth.uid())
        OR dof.organization_id = '550e8400-e29b-41d4-a716-446655440000'
      )
  )
);

CREATE POLICY "Users can update media from their organization offerings"
ON public.offering_media
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.developer_offerings AS dof
    JOIN public.developer_organization_members AS m ON m.organization_id = dof.organization_id
    WHERE dof.id = offering_media.offering_id
      AND (
        (auth.uid() IS NOT NULL AND m.user_id = auth.uid())
        OR dof.organization_id = '550e8400-e29b-41d4-a716-446655440000'
      )
  )
);

CREATE POLICY "Users can delete media from their organization offerings"
ON public.offering_media
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.developer_offerings AS dof
    JOIN public.developer_organization_members AS m ON m.organization_id = dof.organization_id
    WHERE dof.id = offering_media.offering_id
      AND (
        (auth.uid() IS NOT NULL AND m.user_id = auth.uid())
        OR dof.organization_id = '550e8400-e29b-41d4-a716-446655440000'
      )
  )
);
