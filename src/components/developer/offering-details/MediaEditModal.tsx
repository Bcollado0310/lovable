import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MediaItem } from '@/hooks/useMediaManagement';

interface MediaEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  media: MediaItem | null;
  onSave: (mediaId: string, updates: Partial<MediaItem>) => Promise<void>;
}

export function MediaEditModal({
  open,
  onOpenChange,
  media,
  onSave,
}: MediaEditModalProps) {
  const [altText, setAltText] = useState('');
  const [caption, setCaption] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (media) {
      setAltText(media.alt_text || '');
      setCaption(media.caption || '');
      setVisibility(media.visibility);
    }
  }, [media]);

  const handleSave = async () => {
    if (!media) return;

    setSaving(true);
    try {
      await onSave(media.id, {
        alt_text: altText || null,
        caption: caption || null,
        visibility,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  if (!media) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Media</DialogTitle>
          <DialogDescription>
            Update the metadata for this {media.kind}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Preview */}
          <div className="flex justify-center">
            {media.kind === 'image' ? (
              <img
                src={media.medium_url || media.url}
                alt={media.alt_text || media.filename || 'Media preview'}
                className="max-h-48 rounded-lg object-contain"
              />
            ) : (
              <video
                src={media.url}
                poster={media.poster_url || undefined}
                className="max-h-48 rounded-lg"
                controls
              />
            )}
          </div>

          {/* Alt Text */}
          <div className="space-y-2">
            <Label htmlFor="alt-text">Alt Text</Label>
            <Input
              id="alt-text"
              placeholder="Describe this image for accessibility"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Used by screen readers and shown when images fail to load
            </p>
          </div>

          {/* Caption */}
          <div className="space-y-2">
            <Label htmlFor="caption">Caption</Label>
            <Textarea
              id="caption"
              placeholder="Add a caption or description"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
            />
          </div>

          {/* Visibility */}
          <div className="space-y-2">
            <Label htmlFor="visibility">Visibility</Label>
            <Select value={visibility} onValueChange={(v) => setVisibility(v as 'public' | 'private')}>
              <SelectTrigger id="visibility">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {visibility === 'public'
                ? 'Visible to all investors'
                : 'Only visible to organization members'}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
