-- Ensure developer offerings exist in public.offerings for media FK alignment
INSERT INTO public.offerings (
  id,
  org_id,
  title,
  summary,
  description,
  address,
  city,
  state,
  country,
  type,
  goal,
  min_invest,
  step_invest,
  target_irr,
  close_date,
  cover_url,
  created_at,
  updated_at
)
SELECT
  do.id,
  do.organization_id,
  do.title,
  LEFT(do.description, 180),
  do.description,
  do.location,
  NULL,
  NULL,
  NULL,
  do.property_type,
  do.target_amount,
  do.minimum_investment,
  do.minimum_investment,
  do.expected_annual_return,
  do.funding_deadline,
  CASE WHEN array_length(do.images, 1) > 0 THEN do.images[1] ELSE NULL END,
  do.created_at,
  do.updated_at
FROM public.developer_offerings do
WHERE NOT EXISTS (
  SELECT 1 FROM public.offerings o WHERE o.id = do.id
);
