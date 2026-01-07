import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@datapraktis/db';
import { authOptions } from '@/lib/auth';
import { getUploadUrl, validateFile } from '@/lib/s3';
import { z } from 'zod';

const getUploadUrlSchema = z.object({
  projectId: z.string(),
  filename: z.string(),
  mimeType: z.string(),
  size: z.number(),
  accessLevel: z.enum(['PUBLIC_PREVIEW', 'HIRED_ONLY', 'DELIVERABLE']),
  milestoneId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = getUploadUrlSchema.parse(body);

    // Validate file
    const validation = validateFile(validatedData.mimeType, validatedData.size);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Get project and check permissions
    const project = await prisma.project.findUnique({
      where: { id: validatedData.projectId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const isClient = project.clientId === session.user.id;
    const isAnalyst = project.hiredAnalystId === session.user.id;

    // Permission checks
    if (validatedData.accessLevel === 'DELIVERABLE') {
      // Only hired analyst can upload deliverables
      if (!isAnalyst) {
        return NextResponse.json(
          { error: 'Hanya analyst yang dapat mengupload deliverable' },
          { status: 403 }
        );
      }
      if (project.status !== 'IN_PROGRESS') {
        return NextResponse.json(
          { error: 'Proyek harus dalam status aktif' },
          { status: 400 }
        );
      }
    } else {
      // Only client can upload project files
      if (!isClient) {
        return NextResponse.json(
          { error: 'Hanya klien yang dapat mengupload file proyek' },
          { status: 403 }
        );
      }
    }

    // Generate presigned URL
    const { uploadUrl, s3Key } = await getUploadUrl({
      filename: validatedData.filename,
      contentType: validatedData.mimeType,
      projectId: validatedData.projectId,
      uploaderId: session.user.id,
      accessLevel: validatedData.accessLevel,
    });

    // Create file record (pending upload)
    const file = await prisma.projectFile.create({
      data: {
        projectId: validatedData.projectId,
        uploaderId: session.user.id,
        filename: s3Key.split('/').pop() || validatedData.filename,
        originalName: validatedData.filename,
        mimeType: validatedData.mimeType,
        size: validatedData.size,
        s3Key,
        accessLevel: validatedData.accessLevel,
        milestoneId: validatedData.milestoneId,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        uploadUrl,
        fileId: file.id,
        s3Key,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error getting upload URL:', error);
    return NextResponse.json(
      { error: 'Failed to get upload URL' },
      { status: 500 }
    );
  }
}
