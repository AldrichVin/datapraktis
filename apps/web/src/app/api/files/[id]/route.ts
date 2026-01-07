import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@datapraktis/db';
import { authOptions } from '@/lib/auth';
import { getDownloadUrl, deleteFile } from '@/lib/s3';

// Get download URL for a file
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const file = await prisma.projectFile.findUnique({
      where: { id: params.id },
      include: {
        project: {
          select: {
            clientId: true,
            hiredAnalystId: true,
            status: true,
          },
        },
      },
    });

    if (!file || file.deletedAt) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const isClient = file.project.clientId === session.user.id;
    const isAnalyst = file.project.hiredAnalystId === session.user.id;

    // Check access based on file access level
    if (file.accessLevel === 'HIRED_ONLY' || file.accessLevel === 'DELIVERABLE') {
      // Only client and hired analyst can access
      if (!isClient && !isAnalyst) {
        return NextResponse.json(
          { error: 'File hanya dapat diakses setelah hiring' },
          { status: 403 }
        );
      }
    }

    // For PUBLIC_PREVIEW, anyone with valid session can access
    // (In production, you might want to add watermarking for previews)

    const downloadUrl = await getDownloadUrl({ s3Key: file.s3Key });

    return NextResponse.json({
      success: true,
      data: {
        downloadUrl,
        filename: file.originalName,
        mimeType: file.mimeType,
        size: file.size,
      },
    });
  } catch (error) {
    console.error('Error getting download URL:', error);
    return NextResponse.json(
      { error: 'Failed to get download URL' },
      { status: 500 }
    );
  }
}

// Soft delete a file
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const file = await prisma.projectFile.findUnique({
      where: { id: params.id },
      include: {
        project: {
          select: {
            clientId: true,
            hiredAnalystId: true,
            status: true,
          },
        },
      },
    });

    if (!file || file.deletedAt) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Only uploader can delete their own files
    if (file.uploaderId !== session.user.id) {
      return NextResponse.json(
        { error: 'Hanya uploader yang dapat menghapus file' },
        { status: 403 }
      );
    }

    // Can't delete files from completed projects
    if (file.project.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'File dari proyek yang sudah selesai tidak dapat dihapus' },
        { status: 400 }
      );
    }

    // Soft delete (keep for 90 days)
    await prisma.projectFile.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: 'File berhasil dihapus',
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
