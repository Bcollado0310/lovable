import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MediaItem {
  id: string;
  offering_id: string;
  url: string;
  kind: 'image' | 'video';
  position: number;
  is_hero: boolean;
  alt_text: string | null;
  caption: string | null;
  visibility: 'public' | 'private';
  thumbnail_url: string | null;
  medium_url: string | null;
  width: number | null;
  height: number | null;
  duration: number | null;
  poster_url: string | null;
  size_bytes: number | null;
  filename: string | null;
  created_at: string;
  updated_at: string;
}

const enforceHeroOrdering = (items: MediaItem[]): MediaItem[] => {
  const heroIndex = items.findIndex(item => item.is_hero);
  if (heroIndex <= 0) {
    return items;
  }

  const hero = items[heroIndex];
  const rest = items.filter((_, index) => index !== heroIndex);
  return [hero, ...rest];
};

const applyPositions = (items: MediaItem[]): MediaItem[] =>
  items.map((item, index) => ({ ...item, position: index }));

const persistOrder = async (items: MediaItem[]) => {
  for (const item of items) {
    const { error } = await supabase
      .from('offering_media')
      .update({ position: item.position })
      .eq('id', item.id);

    if (error) throw error;
  }
};

export function useMediaManagement(offeringId: string) {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const syncDeveloperImages = useCallback(async (media: MediaItem[]) => {
    try {
      const imageUrls = [...media]
        .filter(item => item.kind === 'image')
        .sort((a, b) => {
          if (a.is_hero === b.is_hero) {
            return a.position - b.position;
          }
          return a.is_hero ? -1 : 1;
        })
        .map(item => item.url);

      const { error } = await supabase
        .from('developer_offerings')
        .update({ images: imageUrls })
        .eq('id', offeringId);

      if (error) {
        console.error('Failed to sync developer offering images', error);
      }
    } catch (error) {
      console.error('Unexpected error syncing developer offering images', error);
    }
  }, [offeringId]);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('offering_media')
        .select('*')
        .eq('offering_id', offeringId)
        .order('position', { ascending: true });

      if (error) throw error;

      const media = applyPositions(
        enforceHeroOrdering((data || []) as MediaItem[])
      );

      setMediaItems(media);
      await syncDeveloperImages(media);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load media',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [offeringId, toast, syncDeveloperImages]);

  const updateMediaOrder = useCallback(async (items: MediaItem[]) => {
    try {
      const ordered = applyPositions(
        enforceHeroOrdering(items.map(item => ({ ...item })))
      );

      await persistOrder(ordered);
      setMediaItems(ordered);
      await syncDeveloperImages(ordered);

      toast({
        title: 'Success',
        description: 'Media order updated',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update order',
        variant: 'destructive',
      });
    }
  }, [toast, syncDeveloperImages]);

  const setHeroImage = useCallback(async (mediaId: string) => {
    try {
      const { error: resetError } = await supabase
        .from('offering_media')
        .update({ is_hero: false })
        .eq('offering_id', offeringId)
        .neq('id', mediaId);

      if (resetError) throw resetError;

      const { error: heroError } = await supabase
        .from('offering_media')
        .update({ is_hero: true })
        .eq('id', mediaId);

      if (heroError) throw heroError;

      const updated = applyPositions(
        enforceHeroOrdering(
          mediaItems.map(item => ({
            ...item,
            is_hero: item.id === mediaId,
          }))
        )
      );

      await persistOrder(updated);
      setMediaItems(updated);
      await syncDeveloperImages(updated);

      toast({
        title: 'Success',
        description: 'Hero image updated',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to set hero image',
        variant: 'destructive',
      });
    }
  }, [toast, syncDeveloperImages, mediaItems, offeringId]);

  const updateMedia = useCallback(async (
    mediaId: string,
    updates: Partial<MediaItem>
  ) => {
    try {
      const { error } = await supabase
        .from('offering_media')
        .update(updates)
        .eq('id', mediaId);

      if (error) throw error;

      setMediaItems(prev =>
        prev.map(item =>
          item.id === mediaId ? { ...item, ...updates } : item
        )
      );

      toast({
        title: 'Success',
        description: 'Media updated',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update media',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const deleteMedia = useCallback(async (mediaIds: string[]) => {
    try {
      const previousItems = mediaItems;
      const nextItems = applyPositions(
        enforceHeroOrdering(
          mediaItems.filter(item => !mediaIds.includes(item.id))
        )
      );

      setMediaItems(nextItems);
      setSelectedItems(new Set());

      const { error } = await supabase
        .from('offering_media')
        .delete()
        .in('id', mediaIds);

      if (error) {
        setMediaItems(previousItems);
        throw error;
      }

      await persistOrder(nextItems);
      await syncDeveloperImages(nextItems);

      toast({
        title: 'Success',
        description: `${mediaIds.length} item(s) deleted`,
      });

      return true;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete media',
        variant: 'destructive',
      });
      return false;
    }
  }, [mediaItems, toast, syncDeveloperImages]);

  const toggleSelection = useCallback((mediaId: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(mediaId)) {
        next.delete(mediaId);
      } else {
        next.add(mediaId);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedItems(new Set(mediaItems.map(item => item.id)));
  }, [mediaItems]);

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  return {
    mediaItems,
    loading,
    selectedItems,
    fetchMedia,
    updateMediaOrder,
    setHeroImage,
    updateMedia,
    deleteMedia,
    toggleSelection,
    selectAll,
    clearSelection,
  };
}
