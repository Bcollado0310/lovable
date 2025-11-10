-- Add new columns to offering_media table for enhanced media management
ALTER TABLE public.offering_media
ADD COLUMN is_hero BOOLEAN DEFAULT false,
ADD COLUMN alt_text TEXT,
ADD COLUMN caption TEXT,
ADD COLUMN visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
ADD COLUMN thumbnail_url TEXT,
ADD COLUMN medium_url TEXT,
ADD COLUMN width INTEGER,
ADD COLUMN height INTEGER,
ADD COLUMN duration INTEGER, -- duration in seconds for videos
ADD COLUMN poster_url TEXT, -- thumbnail/poster for videos
ADD COLUMN size_bytes BIGINT,
ADD COLUMN filename TEXT;

-- Create index on is_hero for faster hero image queries
CREATE INDEX idx_offering_media_is_hero ON public.offering_media(offering_id, is_hero) WHERE is_hero = true;

-- Create index on position for ordering
CREATE INDEX idx_offering_media_position ON public.offering_media(offering_id, position);

-- Function to ensure only one hero image per offering
CREATE OR REPLACE FUNCTION public.ensure_single_hero_media()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger to ensure single hero
CREATE TRIGGER ensure_single_hero_media_trigger
  BEFORE INSERT OR UPDATE ON public.offering_media
  FOR EACH ROW
  WHEN (NEW.is_hero = true)
  EXECUTE FUNCTION public.ensure_single_hero_media();

COMMENT ON COLUMN public.offering_media.is_hero IS 'Whether this media is the hero/primary image for the offering';
COMMENT ON COLUMN public.offering_media.alt_text IS 'Alternative text for accessibility';
COMMENT ON COLUMN public.offering_media.caption IS 'Caption/description for the media';
COMMENT ON COLUMN public.offering_media.visibility IS 'Whether media is public or private';
COMMENT ON COLUMN public.offering_media.thumbnail_url IS 'URL to thumbnail version (optimized for lists)';
COMMENT ON COLUMN public.offering_media.medium_url IS 'URL to medium-sized version (optimized for detail views)';
COMMENT ON COLUMN public.offering_media.duration IS 'Duration in seconds for video files';
COMMENT ON COLUMN public.offering_media.poster_url IS 'Poster/thumbnail frame for video files';