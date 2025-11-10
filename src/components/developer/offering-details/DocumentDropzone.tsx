import React, { useRef, useState } from 'react';
import { Upload, X, FileText, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface DocumentDropzoneProps {
  selectedFiles: File[];
  onFilesChange: (files: File[]) => void;
  error?: string;
  onError: (error: string) => void;
  maxFiles?: number;
  maxSizeMB?: number;
}

export function DocumentDropzone({
  selectedFiles,
  onFilesChange,
  error,
  onError,
  maxFiles = 10,
  maxSizeMB = 25
}: DocumentDropzoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const validateFiles = (files: FileList | null): File[] => {
    if (!files || files.length === 0) return [];

    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const maxSize = maxSizeMB * 1024 * 1024;

    // Check total file count
    if (fileArray.length > maxFiles) {
      onError(`Maximum ${maxFiles} files allowed`);
      return [];
    }

    for (const file of fileArray) {
      // Check file size
      if (file.size > maxSize) {
        onError(`File "${file.name}" exceeds ${maxSizeMB} MB limit`);
        return [];
      }

      // Check MIME type and extension
      const isPdfMimeType = file.type === 'application/pdf';
      const isPdfExtension = file.name.toLowerCase().endsWith('.pdf');

      if (!isPdfMimeType && !isPdfExtension) {
        onError(`"${file.name}" is not a PDF file. Only PDF files are allowed.`);
        return [];
      }

      validFiles.push(file);
    }

    onError(''); // Clear any previous errors
    return validFiles;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const validFiles = validateFiles(e.dataTransfer.files);
    if (validFiles.length > 0) {
      onFilesChange(validFiles);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const validFiles = validateFiles(e.target.files);
    if (validFiles.length > 0) {
      onFilesChange(validFiles);
    } else {
      // Clear the input if validation failed
      e.target.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    onFilesChange(newFiles);
    
    // Clear input value to allow re-selecting the same file
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Dropzone */}
        <div
          className={cn(
            "relative border-2 border-dashed rounded-lg transition-colors cursor-pointer",
            "hover:border-primary/50 hover:bg-accent/5",
            dragActive && "border-primary bg-accent/10",
            error && "border-destructive",
            !error && !dragActive && "border-border"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleClick}
        >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="application/pdf,.pdf"
          onChange={handleChange}
          className="hidden"
          data-testid="file-input"
        />
        
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <Upload className={cn(
            "w-12 h-12 mb-4 transition-colors",
            dragActive ? "text-primary" : "text-muted-foreground"
          )} />
          
          <p className="text-base font-medium mb-1">
            Drag & drop PDF files here, or click to select
          </p>
          
          <p className="text-sm text-muted-foreground">
            PDFs only • Max {maxFiles} files • {maxSizeMB} MB each
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

        {/* Selected Files List */}
        {selectedFiles.length > 0 && !error && (
          <div className="space-y-2 overflow-visible">
            <p className="text-sm font-medium text-muted-foreground">
              {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
            </p>
            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="grid grid-cols-[auto,1fr,auto] items-center gap-3 p-3 rounded-lg border bg-card"
                >
                  <FileText className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <p 
                          className="text-sm font-medium truncate cursor-default"
                          title={file.name}
                        >
                          {file.name}
                        </p>
                      </TooltipTrigger>
                      <TooltipContent className="z-[9999] max-w-[80vw] break-words">
                        {file.name}
                      </TooltipContent>
                    </Tooltip>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile(index);
                    }}
                    className="h-8 w-8 p-0 flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                    <span className="sr-only">Remove file</span>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
