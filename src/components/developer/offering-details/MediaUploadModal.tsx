import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileUpload, FileWithPreview } from '@/components/ui/file-upload';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface MediaUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offeringId: string;
  organizationId: string;
  onUploadComplete: () => void;
}

export function MediaUploadModal({
  open,
  onOpenChange,
  offeringId,
  organizationId,
  onUploadComplete,
}: MediaUploadModalProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    setUploading(true);
    let successCount = 0;

    try {
      // Get current max position
      const { data: existingMedia } = await supabase
        .from('offering_media')
        .select('position')
        .eq('offering_id', offeringId)
        .order('position', { ascending: false })
        .limit(1);

      let currentPosition = existingMedia?.[0]?.position ?? -1;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file has a name
        if (!file || !file.name) {
          console.error('Invalid file object:', file);
          toast.error('Invalid file detected');
          continue;
        }
        
        // Update progress to 0
        const updatedFiles = [...files];
        updatedFiles[i] = { ...updatedFiles[i], progress: 0 };
        setFiles(updatedFiles);

        // Sanitize filename: remove special characters, accents, and spaces
        const sanitizedName = file.name
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Remove accents
          .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special chars with underscore
          .replace(/_{2,}/g, '_') // Replace multiple underscores with single
          .toLowerCase();
        
        const fileName = `${Date.now()}_${sanitizedName}`;
        const filePath = `${organizationId}/${offeringId}/${fileName}`;

        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setFiles(currentFiles => {
            const newFiles = [...currentFiles];
            const currentProgress = newFiles[i].progress || 0;
            if (currentProgress < 90) {
              newFiles[i] = { ...newFiles[i], progress: currentProgress + 10 };
            }
            return newFiles;
          });
        }, 100);

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('offering-media')
          .upload(filePath, file, {
            contentType: file.type,
            upsert: false
          });

        clearInterval(progressInterval);

        if (uploadError) {
          console.error('Upload error for', fileName, ':', uploadError);
          toast.error(`Failed to upload ${file.name}: ${uploadError.message}`);
          // Update progress to show error
          setFiles(currentFiles => {
            const errorFiles = [...currentFiles];
            errorFiles[i] = { ...errorFiles[i], progress: 0 };
            return errorFiles;
          });
          continue;
        }

        // Update progress to 100
        setFiles(currentFiles => {
          const completedFiles = [...currentFiles];
          completedFiles[i] = { ...completedFiles[i], progress: 100, uploaded: true };
          return completedFiles;
        });

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('offering-media')
          .getPublicUrl(filePath);

        // Save to offering_media table
        const mediaKind = file.type.startsWith('video/') ? 'video' : 'image';
        currentPosition++;
        
        const { error: mediaError } = await supabase
          .from('offering_media')
          .insert({
            offering_id: offeringId,
            url: urlData.publicUrl,
            kind: mediaKind,
            position: currentPosition,
            filename: file.name,
            size_bytes: file.size,
            visibility: 'public',
          });

        if (mediaError) {
          console.error('Media record error:', mediaError);
          toast.error(`Failed to save media record: ${mediaError.message}`);
          continue;
        }

        successCount++;
      }

      if (successCount > 0) {
        toast.success(`Successfully uploaded ${successCount} file(s)`);
        onUploadComplete();
        setFiles([]);
        onOpenChange(false);
      } else {
        toast.error('Failed to upload files');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload media');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setFiles([]);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto z-[9999]">
        <DialogHeader>
          <DialogTitle>Upload Media</DialogTitle>
          <DialogDescription>
            Add images and videos to your offering gallery
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <FileUpload
            value={files}
            onChange={setFiles}
            accept="image/*,video/*"
            maxFiles={10}
            showPreviews={true}
          />
          
          {uploading && (
            <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <p className="text-sm text-primary font-medium">
                Uploading files... Please don't close this window.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleUpload}
            disabled={uploading || files.length === 0}
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              `Upload ${files.length > 0 ? `${files.length} file${files.length > 1 ? 's' : ''}` : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
