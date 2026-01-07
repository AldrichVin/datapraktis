import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@datapraktis/db';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const updateMilestoneSchema = z.object({
  action: z.enum(['submit', 'approve', 'request_revision']),
  revisionNote: z.string().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const milestone = await prisma.milestone.findUnique({
      where: { id: params.id },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            clientId: true,
            hiredAnalystId: true,
          },
        },
        deliverables: {
          where: { deletedAt: null },
          select: {
            id: true,
            filename: true,
            originalName: true,
            mimeType: true,
            size: true,
            createdAt: true,
          },
        },
      },
    });

    if (!milestone) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    }

    // Check access - only client or hired analyst can view
    const isClient = milestone.project.clientId === session.user.id;
    const isAnalyst = milestone.project.hiredAnalystId === session.user.id;

    if (!isClient && !isAnalyst) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...milestone,
        isClient,
        isAnalyst,
      },
    });
  } catch (error) {
    console.error('Error fetching milestone:', error);
    return NextResponse.json(
      { error: 'Failed to fetch milestone' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const milestone = await prisma.milestone.findUnique({
      where: { id: params.id },
      include: {
        project: {
          include: {
            milestones: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    });

    if (!milestone) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    }

    const isClient = milestone.project.clientId === session.user.id;
    const isAnalyst = milestone.project.hiredAnalystId === session.user.id;

    if (!isClient && !isAnalyst) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateMilestoneSchema.parse(body);

    const { action, revisionNote } = validatedData;

    // Handle different actions
    if (action === 'submit') {
      // Only analyst can submit
      if (!isAnalyst) {
        return NextResponse.json(
          { error: 'Only analyst can submit milestone' },
          { status: 403 }
        );
      }

      // Can only submit if IN_PROGRESS or REVISION_REQUESTED
      if (
        milestone.status !== 'IN_PROGRESS' &&
        milestone.status !== 'REVISION_REQUESTED'
      ) {
        return NextResponse.json(
          { error: 'Milestone tidak dalam status yang dapat disubmit' },
          { status: 400 }
        );
      }

      await prisma.milestone.update({
        where: { id: params.id },
        data: {
          status: 'SUBMITTED',
          submittedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Milestone berhasil disubmit untuk review',
      });
    }

    if (action === 'approve') {
      // Only client can approve
      if (!isClient) {
        return NextResponse.json(
          { error: 'Only client can approve milestone' },
          { status: 403 }
        );
      }

      // Can only approve if SUBMITTED
      if (milestone.status !== 'SUBMITTED') {
        return NextResponse.json(
          { error: 'Milestone belum disubmit' },
          { status: 400 }
        );
      }

      await prisma.$transaction(async (tx) => {
        // Approve current milestone
        await tx.milestone.update({
          where: { id: params.id },
          data: {
            status: 'APPROVED',
            approvedAt: new Date(),
          },
        });

        // Find and start next milestone
        const currentIndex = milestone.project.milestones.findIndex(
          (m) => m.id === params.id
        );
        const nextMilestone = milestone.project.milestones[currentIndex + 1];

        if (nextMilestone && nextMilestone.status === 'PENDING') {
          await tx.milestone.update({
            where: { id: nextMilestone.id },
            data: { status: 'IN_PROGRESS' },
          });
        }

        // Check if all milestones are approved
        const allMilestones = milestone.project.milestones;
        const approvedCount = allMilestones.filter(
          (m) => m.status === 'APPROVED' || m.id === params.id
        ).length;

        if (approvedCount === allMilestones.length) {
          // All milestones done - complete project
          await tx.project.update({
            where: { id: milestone.projectId },
            data: {
              status: 'COMPLETED',
              completedAt: new Date(),
            },
          });

          // Update analyst stats
          await tx.analystProfile.update({
            where: { userId: milestone.project.hiredAnalystId! },
            data: {
              completedProjects: { increment: 1 },
            },
          });
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Milestone disetujui',
      });
    }

    if (action === 'request_revision') {
      // Only client can request revision
      if (!isClient) {
        return NextResponse.json(
          { error: 'Only client can request revision' },
          { status: 403 }
        );
      }

      // Can only request revision if SUBMITTED
      if (milestone.status !== 'SUBMITTED') {
        return NextResponse.json(
          { error: 'Milestone belum disubmit' },
          { status: 400 }
        );
      }

      // Check revision limit
      if (milestone.revisionCount >= milestone.maxRevisions) {
        return NextResponse.json(
          { error: 'Batas revisi sudah tercapai' },
          { status: 400 }
        );
      }

      await prisma.milestone.update({
        where: { id: params.id },
        data: {
          status: 'REVISION_REQUESTED',
          revisionCount: { increment: 1 },
        },
      });

      // Optionally send revision note as a message
      if (revisionNote) {
        const conversation = await prisma.conversation.findFirst({
          where: { projectId: milestone.projectId },
        });

        if (conversation) {
          await prisma.message.create({
            data: {
              conversationId: conversation.id,
              senderId: session.user.id,
              content: `📝 Permintaan Revisi untuk "${milestone.title}":\n\n${revisionNote}`,
            },
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Permintaan revisi terkirim',
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating milestone:', error);
    return NextResponse.json(
      { error: 'Failed to update milestone' },
      { status: 500 }
    );
  }
}
