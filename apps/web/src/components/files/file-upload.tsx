'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import {
  File,
  FileText,
  Image,
  Loader2,
  Upload,
  X,
  FileSpreadsheet,
  Archive,
} from 'lucide-react';

interface FileUploadProps {
  projectId: string;
  accessLevel: 'PUBLIC_PREVIEW' | 'HIRED_ONLY' | 'DELIVERABLE';
  milestoneId?: string;
  onUploadComplete?: (file: UploadedFile) => void;
  maxFiles?: number;
  className?: string;
}

interface UploadedFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
}

interface UploadingFile {
  name: string;
  size: number;
  progress: number;
  status: 'uploading' | 'complete' | 'error';
  error?: string;
}

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType === 'text/csv')
    return FileSpreadsheet;
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('gzip'))
    return Archive;
  return FileText;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUpload({
  projectId,
  accessLevel,
  milestoneId,
  onUploadComplete,
  maxFiles = 10,
  className,
}: FileUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files).slice(0, maxFiles);

    for (const file of fileArray) {
      await uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'Error',
        description: `File "${file.name}" terlalu besar. Maksimal 100MB.`,
        variant: 'destructive',
      });
      return;
    }

    // Add to uploading list
    const uploadingFile: UploadingFile = {
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'uploading',
    };

    setUploadingFiles((prev) => [...prev, uploadingFile]);

    try {
      // Get presigned URL
      const urlRes = await fetch('/api/files/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          filename: file.name,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          accessLevel,
          milestoneId,
        }),
      });

      const urlData = await urlRes.json();

      if (!urlRes.ok) {
        throw new Error(urlData.error || 'Failed to get upload URL');
      }

      // Upload to S3 using XMLHttpRequest for progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            setUploadingFiles((prev) =>
              prev.map((f) =>
                f.name === file.name ? { ...f, progress } : f
              )
            );
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error('Upload failed'));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'));
        });

        xhr.open('PUT', urlData.data.uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
        xhr.send(file);
      });

      // Mark as complete
      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.name === file.name ? { ...f, progress: 100, status: 'complete' } : f
        )
      );

      // Notify parent
      onUploadComplete?.({
        id: urlData.data.fileId,
        filename: urlData.data.s3Key.split('/').pop() || file.name,
        originalName: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
      });

      // Remove from list after delay
      setTimeout(() => {
        setUploadingFiles((prev) => prev.filter((f) => f.name !== file.name));
      }, 2000);
    } catch (error) {
      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.name === file.name
            ? {
                ...f,
                status: 'error',
                error: error instanceof Error ? error.message : 'Upload gagal',
              }
            : f
        )
      );

      toast({
        title: 'Upload Gagal',
        description: error instanceof Error ? error.message : 'Gagal mengupload file',
        variant: 'destructive',
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeUploadingFile = (name: string) => {
    setUploadingFiles((prev) => prev.filter((f) => f.name !== name));
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Drop Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50'
        )}
      >
        <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
        <p className="font-medium">Klik atau drag file ke sini</p>
        <p className="text-sm text-muted-foreground mt-1">
          PDF, Excel, Word, CSV, gambar, atau arsip. Maks 100MB per file.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.jpg,.jpeg,.png,.gif,.webp,.json,.xml,.zip,.rar,.gz"
        />
      </div>

      {/* Uploading Files */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          {uploadingFiles.map((file) => {
            const FileIcon = getFileIcon(file.name);
            return (
              <div
                key={file.name}
                className="flex items-center gap-3 p-3 border rounded-lg"
              >
                <FileIcon className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <div className="flex items-center gap-2">
                      {file.status === 'uploading' && (
                        <span className="text-xs text-muted-foreground">
                          {file.progress}%
                        </span>
                      )}
                      {file.status === 'complete' && (
                        <span className="text-xs text-green-600">Selesai</span>
                      )}
                      {file.status === 'error' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeUploadingFile(file.name)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                  {file.status === 'uploading' && (
                    <Progress value={file.progress} className="h-1 mt-2" />
                  )}
                  {file.status === 'error' && (
                    <p className="text-xs text-destructive mt-1">{file.error}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
