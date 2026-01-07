// AWS S3 Integration for File Storage
// Documentation: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-southeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'datapraktis-files';
const UPLOAD_EXPIRY = 60 * 5; // 5 minutes for upload
const DOWNLOAD_EXPIRY = 60 * 60; // 1 hour for download

interface UploadUrlParams {
  filename: string;
  contentType: string;
  projectId: string;
  uploaderId: string;
  accessLevel: 'PUBLIC_PREVIEW' | 'HIRED_ONLY' | 'DELIVERABLE';
}

interface DownloadUrlParams {
  s3Key: string;
}

// Generate S3 key with folder structure
function generateS3Key(
  projectId: string,
  accessLevel: string,
  filename: string
): string {
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `projects/${projectId}/${accessLevel.toLowerCase()}/${timestamp}-${sanitizedFilename}`;
}

// Get presigned URL for uploading
export async function getUploadUrl(params: UploadUrlParams): Promise<{
  uploadUrl: string;
  s3Key: string;
}> {
  const s3Key = generateS3Key(
    params.projectId,
    params.accessLevel,
    params.filename
  );

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
    ContentType: params.contentType,
    Metadata: {
      'project-id': params.projectId,
      'uploader-id': params.uploaderId,
      'access-level': params.accessLevel,
      'original-filename': params.filename,
    },
    // Enable server-side encryption
    ServerSideEncryption: 'AES256',
  });

  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: UPLOAD_EXPIRY,
  });

  return { uploadUrl, s3Key };
}

// Get presigned URL for downloading
export async function getDownloadUrl(params: DownloadUrlParams): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: params.s3Key,
  });

  return getSignedUrl(s3Client, command, {
    expiresIn: DOWNLOAD_EXPIRY,
  });
}

// Delete file from S3
export async function deleteFile(s3Key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
  });

  await s3Client.send(command);
}

// Validate file type
const ALLOWED_MIME_TYPES = [
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/csv',
  'text/plain',
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  // Data files
  'application/json',
  'application/xml',
  'text/xml',
  // Archives
  'application/zip',
  'application/x-rar-compressed',
  'application/gzip',
];

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export function validateFile(
  mimeType: string,
  size: number
): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return {
      valid: false,
      error: 'Tipe file tidak didukung. Gunakan PDF, Excel, Word, CSV, gambar, atau arsip.',
    };
  }

  if (size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'Ukuran file maksimal 100MB',
    };
  }

  return { valid: true };
}

// Get file extension from mime type
export function getExtensionFromMimeType(mimeType: string): string {
  const extensions: Record<string, string> = {
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.ms-powerpoint': 'ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'text/csv': 'csv',
    'text/plain': 'txt',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'application/json': 'json',
    'application/xml': 'xml',
    'text/xml': 'xml',
    'application/zip': 'zip',
    'application/x-rar-compressed': 'rar',
    'application/gzip': 'gz',
  };

  return extensions[mimeType] || 'bin';
}

export { BUCKET_NAME, ALLOWED_MIME_TYPES, MAX_FILE_SIZE };
