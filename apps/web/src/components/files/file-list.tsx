'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import {
  Download,
  File,
  FileSpreadsheet,
  FileText,
  Image,
  Loader2,
  Trash2,
  Archive,
  Lock,
  Eye,
} from 'lucide-react';

interface ProjectFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  accessLevel: string;
  createdAt: string;
}

interface FileListProps {
  files: ProjectFile[];
  canDelete?: boolean;
  canDownload?: boolean;
  onDelete?: (fileId: string) => void;
  className?: string;
}

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

function getAccessLevelLabel(level: string): string {
  switch (level) {
    case 'PUBLIC_PREVIEW':
      return 'Preview';
    case 'HIRED_ONLY':
      return 'Full Access';
    case 'DELIVERABLE':
      return 'Deliverable';
    default:
      return level;
  }
}

export function FileList({
  files,
  canDelete = false,
  canDownload = true,
  onDelete,
  className,
}: FileListProps) {
  const { toast } = useToast();
  const [loadingFile, setLoadingFile] = useState<string | null>(null);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);

  const handleDownload = async (file: ProjectFile) => {
    setLoadingFile(file.id);
    try {
      const res = await fetch(`/api/files/${file.id}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to get download URL');
      }

      // Open download URL in new tab
      window.open(data.data.downloadUrl, '_blank');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Gagal mengunduh file',
        variant: 'destructive',
      });
    } finally {
      setLoadingFile(null);
    }
  };

  const handleDelete = async (file: ProjectFile) => {
    if (!confirm(`Hapus file "${file.originalName}"?`)) return;

    setDeletingFile(file.id);
    try {
      const res = await fetch(`/api/files/${file.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete file');
      }

      toast({
        title: 'Berhasil',
        description: 'File berhasil dihapus',
      });

      onDelete?.(file.id);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Gagal menghapus file',
        variant: 'destructive',
      });
    } finally {
      setDeletingFile(null);
    }
  };

  if (files.length === 0) {
    return (
      <div className={cn('text-center py-8 text-muted-foreground', className)}>
        <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Belum ada file</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {files.map((file) => {
        const FileIcon = getFileIcon(file.mimeType);
        const isLoading = loadingFile === file.id;
        const isDeleting = deletingFile === file.id;

        return (
          <div
            key={file.id}
            className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <FileIcon className="h-8 w-8 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.originalName}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{formatFileSize(file.size)}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  {file.accessLevel === 'HIRED_ONLY' ? (
                    <Lock className="h-3 w-3" />
                  ) : (
                    <Eye className="h-3 w-3" />
                  )}
                  {getAccessLevelLabel(file.accessLevel)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {canDownload && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(file)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(file)}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 text-destructive" />
                  )}
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
