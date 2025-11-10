-- Fix security warning: Set search_path for ensure_single_hero_media function
DROP FUNCTION IF EXISTS public.ensure_single_hero_media() CASCADE;

CREATE OR REPLACE FUNCTION public.ensure_single_hero_media()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If setting a new hero, unset all others for this offering
  IF NEW.is_hero = true THEN
    UPDATE public.offering_media
    SET is_hero = false
    WHERE offering_id = NEW.offering_id
      AND id != NEW.id
      AND is_hero = true;
  END IF;
  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS ensure_single_hero_media_trigger ON public.offering_media;

CREATE TRIGGER ensure_single_hero_media_trigger
  BEFORE INSERT OR UPDATE ON public.offering_media
  FOR EACH ROW
  WHEN (NEW.is_hero = true)
  EXECUTE FUNCTION public.ensure_single_hero_media();