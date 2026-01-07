import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@datapraktis/db';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const createReviewSchema = z.object({
  projectId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().min(10, 'Review minimal 10 karakter').optional(),
  qualityRating: z.number().min(1).max(5).optional(),
  communicationRating: z.number().min(1).max(5).optional(),
  timelinessRating: z.number().min(1).max(5).optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createReviewSchema.parse(body);

    // Get project
    const project = await prisma.project.findUnique({
      where: { id: validatedData.projectId },
      include: {
        reviews: {
          where: { reviewerId: session.user.id },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if project is completed
    if (project.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Proyek harus selesai untuk memberikan review' },
        { status: 400 }
      );
    }

    // Check if user is involved in project
    const isClient = project.clientId === session.user.id;
    const isAnalyst = project.hiredAnalystId === session.user.id;

    if (!isClient && !isAnalyst) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if already reviewed
    if (project.reviews.length > 0) {
      return NextResponse.json(
        { error: 'Anda sudah memberikan review untuk proyek ini' },
        { status: 400 }
      );
    }

    // Determine reviewee
    const revieweeId = isClient ? project.hiredAnalystId : project.clientId;

    if (!revieweeId) {
      return NextResponse.json(
        { error: 'Tidak ada pihak untuk direview' },
        { status: 400 }
      );
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        projectId: validatedData.projectId,
        reviewerId: session.user.id,
        revieweeId,
        rating: validatedData.rating,
        comment: validatedData.comment,
        qualityRating: validatedData.qualityRating,
        communicationRating: validatedData.communicationRating,
        timelinessRating: validatedData.timelinessRating,
      },
    });

    // If client is reviewing analyst, update analyst stats
    if (isClient) {
      // Calculate new average rating
      const allReviews = await prisma.review.findMany({
        where: { revieweeId },
      });

      const avgRating =
        allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

      await prisma.analystProfile.update({
        where: { userId: revieweeId },
        data: {
          rating: avgRating,
          totalReviews: allReviews.length,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Review berhasil dikirim',
      data: review,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    );
  }
}

// Get reviews for a user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const projectId = searchParams.get('projectId');

    if (!userId && !projectId) {
      return NextResponse.json(
        { error: 'userId or projectId required' },
        { status: 400 }
      );
    }

    let reviews;

    if (projectId) {
      // Get reviews for a specific project
      reviews = await prisma.review.findMany({
        where: { projectId },
        include: {
          reviewer: {
            select: {
              id: true,
              name: true,
              image: true,
              role: true,
            },
          },
          project: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // Get reviews received by a user
      reviews = await prisma.review.findMany({
        where: { revieweeId: userId! },
        include: {
          reviewer: {
            select: {
              id: true,
              name: true,
              image: true,
              role: true,
            },
          },
          project: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return NextResponse.json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}
