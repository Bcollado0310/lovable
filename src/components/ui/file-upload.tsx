import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { X, Upload, Image, File, GripVertical } from "lucide-react";

export interface FileWithPreview extends File {
  preview?: string;
  progress?: number;
  uploaded?: boolean;
  url?: string;
}

export interface FileUploadProps {
  value?: FileWithPreview[];
  onChange?: (files: FileWithPreview[]) => void;
  onUploadProgress?: (fileIndex: number, progress: number) => void;
  multiple?: boolean;
  accept?: string;
  maxFiles?: number;
  className?: string;
  showPreviews?: boolean;
}

export function FileUpload({
  value = [],
  onChange,
  onUploadProgress,
  multiple = true,
  accept = "image/*",
  maxFiles = 10,
  className,
  showPreviews = true
}: FileUploadProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = React.useState(false);
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    
    const fileArray = Array.from(files);
    const newFiles = fileArray.map(file => {
      const fileWithPreview: FileWithPreview = file;
      
      // Create preview for images
      if (file.type.startsWith('image/') && showPreviews) {
        fileWithPreview.preview = URL.createObjectURL(file);
      }
      
      return fileWithPreview;
    });

    const updatedFiles = multiple 
      ? [...value, ...newFiles].slice(0, maxFiles)
      : newFiles.slice(0, 1);
    
    onChange?.(updatedFiles);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    const newFiles = value.filter((_, i) => i !== index);
    // Revoke object URL to prevent memory leaks
    if (value[index]?.preview) {
      URL.revokeObjectURL(value[index].preview!);
    }
    onChange?.(newFiles);
  };

  const updateProgress = (index: number, progress: number) => {
    const newFiles = [...value];
    newFiles[index] = { ...newFiles[index], progress };
    onChange?.(newFiles);
    onUploadProgress?.(index, progress);
  };

  const markAsUploaded = (index: number, url: string) => {
    const newFiles = [...value];
    newFiles[index] = { ...newFiles[index], uploaded: true, url, progress: 100 };
    onChange?.(newFiles);
  };

  // Drag and drop reordering
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropReorder = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newFiles = [...value];
    const draggedFile = newFiles[draggedIndex];
    
    // Remove dragged item
    newFiles.splice(draggedIndex, 1);
    // Insert at new position
    newFiles.splice(dropIndex, 0, draggedFile);
    
    onChange?.(newFiles);
    setDraggedIndex(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Cleanup previews on unmount
  React.useEffect(() => {
    return () => {
      value.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, []);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop Zone */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
          dragActive 
            ? "border-primary bg-primary/5" 
            : "border-muted-foreground/25 hover:border-primary/50"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground mb-2">
          Drag & drop files here, or click to select
        </p>
        <p className="text-xs text-muted-foreground">
          {accept === "image/*,video/*" 
            ? 'Images/Videos' 
            : accept.includes('image') 
            ? 'Images only' 
            : 'Any file type'} • Max {maxFiles} files
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />

      {/* File List with Previews */}
      {value.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Selected Files ({value.length})</h4>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {value.map((file, index) => (
              <div
                key={index}
                className={cn(
                  "relative group border rounded-lg overflow-hidden bg-background",
                  draggedIndex === index && "opacity-50"
                )}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDropReorder(e, index)}
              >
                {/* Drag Handle */}
                <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-background/80 rounded p-1 cursor-move">
                    <GripVertical className="h-3 w-3 text-muted-foreground" />
                  </div>
                </div>

                {/* Remove Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="absolute top-2 right-2 z-10 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-destructive hover:text-destructive-foreground"
                >
                  <X className="h-3 w-3" />
                </Button>

                {/* Preview */}
                {file.preview ? (
                  <div className="aspect-video relative">
                    <img
                      src={file.preview}
                      alt={file.name}
                      className="w-full h-full object-cover"
                      onLoad={() => URL.revokeObjectURL(file.preview!)}
                    />
                    {file.uploaded && (
                      <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                        <div className="bg-green-500 text-white text-xs px-2 py-1 rounded">
                          Uploaded
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-video flex items-center justify-center bg-muted">
                    {file.type.startsWith('image/') ? (
                      <Image className="h-8 w-8 text-muted-foreground" />
                    ) : (
                      <File className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                )}

                {/* File Info */}
                <div className="p-3 space-y-2">
                  <div>
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>

                  {/* Upload Progress */}
                  {file.progress !== undefined && file.progress < 100 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Uploading...</span>
                        <span>{Math.round(file.progress)}%</span>
                      </div>
                      <Progress value={file.progress} className="h-1" />
                    </div>
                  )}

                  {file.uploaded && (
                    <div className="text-xs text-green-600 font-medium">
                      ✓ Uploaded successfully
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <p className="text-xs text-muted-foreground">
            Drag files to reorder them. The first image will be used as the cover.
          </p>
        </div>
      )}
    </div>
  );
}