import React, { useEffect, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Image, Video, Upload, CheckSquare, Square } from 'lucide-react';
import { DeveloperOffering } from '@/utils/developerHelpers';
import { useDeveloperAuth } from '@/contexts/DeveloperAuthContext';
import { useMediaManagement, MediaItem } from '@/hooks/useMediaManagement';
import { MediaCard } from './MediaCard';
import { MediaEditModal } from './MediaEditModal';
import { BulkActionsToolbar } from './BulkActionsToolbar';
import { MediaUploadModal } from './MediaUploadModal';
import { useToast } from '@/hooks/use-toast';

interface MediaTabProps {
  offering: DeveloperOffering;
}

export function MediaTab({ offering }: MediaTabProps) {
  const { hasPermission } = useDeveloperAuth();
  const { toast } = useToast();
  const {
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
  } = useMediaManagement(offering.id);

  const [selectionMode, setSelectionMode] = useState(false);
  const [editingMedia, setEditingMedia] = useState<MediaItem | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState<string[]>([]);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = mediaItems.findIndex((item) => item.id === active.id);
      const newIndex = mediaItems.findIndex((item) => item.id === over.id);
      const newOrder = arrayMove(mediaItems, oldIndex, newIndex);
      updateMediaOrder(newOrder);
    }
  };

  const handleDelete = (mediaIds: string[]) => {
    setMediaToDelete(mediaIds);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    const success = await deleteMedia(mediaToDelete);
    
    setDeleteConfirmOpen(false);
    setMediaToDelete([]);
    setSelectionMode(false);
    clearSelection();
  };

  const images = mediaItems.filter((item) => item.kind === 'image');
  const videos = mediaItems.filter((item) => item.kind === 'video');
  const totalSize = mediaItems.reduce((acc, item) => acc + (item.size_bytes || 0), 0);
  const formatSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const heroImage = images.find((img) => img.is_hero);

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      {hasPermission('write') && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Media Gallery</h3>
                <p className="text-sm text-muted-foreground">
                  Manage images and videos for this offering
                </p>
              </div>
              <div className="flex gap-2">
                {mediaItems.length > 0 && (
                  <Button
                    variant={selectionMode ? 'default' : 'outline'}
                    onClick={() => {
                      setSelectionMode(!selectionMode);
                      if (selectionMode) clearSelection();
                    }}
                  >
                    {selectionMode ? (
                      <>
                        <CheckSquare className="w-4 h-4 mr-2" />
                        Cancel
                      </>
                    ) : (
                      <>
                        <Square className="w-4 h-4 mr-2" />
                        Select
                      </>
                    )}
                  </Button>
                )}
                <Button 
                  onClick={() => setUploadModalOpen(true)}
                  data-testid="upload-media-btn"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Media
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Actions Toolbar */}
      {selectionMode && (
        <BulkActionsToolbar
          selectedCount={selectedItems.size}
          totalCount={mediaItems.length}
          onSelectAll={selectAll}
          onClearSelection={clearSelection}
          onDelete={() => handleDelete(Array.from(selectedItems))}
        />
      )}

      {/* Media Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Media</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mediaItems.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Images</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{images.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Videos</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{videos.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatSize(totalSize)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Hero Image Section */}
      {images.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Hero Image</CardTitle>
            <CardDescription>
              Main image displayed on the offering page
            </CardDescription>
          </CardHeader>
          <CardContent>
            {heroImage ? (
              <div className="space-y-4">
                <div className="relative">
                  <img
                    src={heroImage.medium_url || heroImage.url}
                    alt={heroImage.alt_text || 'Hero image'}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <Badge className="absolute top-2 left-2">Hero Image</Badge>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
                <div className="text-center">
                  <Image className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground mb-2">No hero image set</p>
                  <p className="text-xs text-muted-foreground">
                    Click the star icon on any image to set it as hero
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Media Gallery */}
      <Card>
        <CardHeader>
          <CardTitle>Media Gallery</CardTitle>
          <CardDescription>
            All images and videos for this offering • Drag to reorder
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-video w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : mediaItems.length === 0 ? (
            <div className="text-center py-12">
              <Image className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No media uploaded yet</h3>
              <p className="text-muted-foreground mb-4">
                Upload images and videos to showcase your property
              </p>
              {hasPermission('write') && (
                <Button 
                  onClick={() => setUploadModalOpen(true)}
                  data-testid="upload-media-btn"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Your First Media
                </Button>
              )}
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={mediaItems.map((item) => item.id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {mediaItems.map((item) => (
                    <MediaCard
                      key={item.id}
                      media={item}
                      isSelected={selectedItems.has(item.id)}
                      onToggleSelect={() => toggleSelection(item.id)}
                      onSetHero={() => setHeroImage(item.id)}
                      onEdit={() => setEditingMedia(item)}
                      onDelete={() => handleDelete([item.id])}
                      hasWritePermission={hasPermission('write')}
                      selectionMode={selectionMode}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* Upload Modal */}
      <MediaUploadModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        offeringId={offering.id}
        organizationId={offering.organization_id}
        onUploadComplete={fetchMedia}
      />

      {/* Edit Modal */}
      <MediaEditModal
        open={!!editingMedia}
        onOpenChange={(open) => !open && setEditingMedia(null)}
        media={editingMedia}
        onSave={updateMedia}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {mediaToDelete.length}{' '}
              {mediaToDelete.length === 1 ? 'item' : 'items'}. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
