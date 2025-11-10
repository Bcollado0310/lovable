import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  GripVertical,
  Star,
  Edit,
  Trash2,
  EyeOff,
} from 'lucide-react';
import { MediaItem } from '@/hooks/useMediaManagement';
import { cn } from '@/lib/utils';

interface MediaCardProps {
  media: MediaItem;
  isSelected: boolean;
  onToggleSelect: () => void;
  onSetHero: () => void;
  onEdit: () => void;
  onDelete: () => void;
  hasWritePermission: boolean;
  selectionMode: boolean;
}

export function MediaCard({
  media,
  isSelected,
  onToggleSelect,
  onSetHero,
  onEdit,
  onDelete,
  hasWritePermission,
  selectionMode,
}: MediaCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: media.id, disabled: !hasWritePermission || selectionMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative overflow-hidden rounded-lg border bg-card transition-all',
        isDragging && 'opacity-50 ring-2 ring-primary',
        isSelected && 'ring-2 ring-primary'
      )}
    >
      {/* Image/Video */}
      <div className="aspect-video relative bg-muted">
        {media.kind === 'image' ? (
          <img
            src={media.thumbnail_url || media.url}
            alt={media.alt_text || media.filename || 'Media'}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <video
              src={media.url}
              poster={media.poster_url || undefined}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1">
          {media.is_hero && (
            <Badge variant="default" className="gap-1">
              <Star className="h-3 w-3" />
              Hero
            </Badge>
          )}
          {media.visibility === 'private' && (
            <Badge variant="secondary" className="gap-1">
              <EyeOff className="h-3 w-3" />
              Private
            </Badge>
          )}
        </div>

        {/* Selection Checkbox */}
        {selectionMode && (
          <div className="absolute top-2 right-2">
            <Checkbox
              checked={isSelected}
              onCheckedChange={onToggleSelect}
              className="h-5 w-5 bg-background"
            />
          </div>
        )}

        {/* Hover Actions & Drag Handle */}
        {hasWritePermission && !selectionMode && (
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            <div className="flex items-start justify-between p-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-2 pointer-events-auto">
                {!media.is_hero && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={onSetHero}
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Set as hero image</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" variant="secondary" onClick={onEdit}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit details</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={onDelete}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      {...attributes}
                      {...listeners}
                      className="rounded bg-background/80 p-1 cursor-grab active:cursor-grabbing pointer-events-auto"
                      aria-label="Reorder media"
                    >
                      <GripVertical className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Drag to reorder</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="h-16 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <h4 className="font-medium text-sm truncate" title={media.filename || ''}>
                {media.filename || 'Untitled'}
              </h4>
            </TooltipTrigger>
            <TooltipContent className="z-[9999] max-w-[80vw] break-words">
              {media.filename || 'Untitled'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
          <span>{formatFileSize(media.size_bytes)}</span>
          {media.kind === 'video' && media.duration && (
            <span>{formatDuration(media.duration)}</span>
          )}
          {media.kind === 'image' && media.width && media.height && (
            <span>{media.width}×{media.height}</span>
          )}
        </div>
      </div>
    </div>
  );
}
