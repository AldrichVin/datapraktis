import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@datapraktis/db';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const createProposalSchema = z.object({
  coverLetter: z.string().min(50, 'Cover letter minimal 50 karakter'),
  proposedBudget: z.number().min(500000, 'Budget minimal Rp 500.000'),
  proposedDays: z.number().min(1, 'Minimal 1 hari'),
  proposedMilestones: z.array(
    z.object({
      title: z.string().min(1),
      description: z.string().min(1),
      amount: z.number().min(0),
      dueDate: z.string().optional(),
    })
  ),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ANALYST') {
      return NextResponse.json(
        { error: 'Only analysts can submit proposals' },
        { status: 403 }
      );
    }

    // Check if analyst profile is complete
    const analyst = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { analystProfile: true },
    });

    if (!analyst?.analystProfile) {
      return NextResponse.json(
        { error: 'Lengkapi profil analyst Anda terlebih dahulu' },
        { status: 400 }
      );
    }

    // Check project exists and is open
    const project = await prisma.project.findUnique({
      where: { id: params.id },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.status !== 'OPEN') {
      return NextResponse.json(
        { error: 'Proyek ini tidak menerima proposal' },
        { status: 400 }
      );
    }

    // Check if already submitted
    const existingProposal = await prisma.proposal.findUnique({
      where: {
        projectId_analystId: {
          projectId: params.id,
          analystId: session.user.id,
        },
      },
    });

    if (existingProposal) {
      return NextResponse.json(
        { error: 'Anda sudah mengirim proposal untuk proyek ini' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = createProposalSchema.parse(body);

    // Validate milestones total equals proposed budget
    const milestonesTotal = validatedData.proposedMilestones.reduce(
      (sum, m) => sum + m.amount,
      0
    );

    if (milestonesTotal !== validatedData.proposedBudget) {
      return NextResponse.json(
        { error: 'Total milestone harus sama dengan budget yang diajukan' },
        { status: 400 }
      );
    }

    const proposal = await prisma.proposal.create({
      data: {
        projectId: params.id,
        analystId: session.user.id,
        coverLetter: validatedData.coverLetter,
        proposedBudget: validatedData.proposedBudget,
        proposedDays: validatedData.proposedDays,
        proposedMilestones: validatedData.proposedMilestones,
        status: 'PENDING',
      },
      include: {
        analyst: {
          select: {
            id: true,
            name: true,
            image: true,
            analystProfile: {
              select: {
                headline: true,
                rating: true,
                completedProjects: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: proposal,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating proposal:', error);
    return NextResponse.json(
      { error: 'Failed to create proposal' },
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

    const body = await request.json();
    const { proposalId, action } = body;

    if (!proposalId || !['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Get proposal and project
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: { project: true },
    });

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    // Only project owner can accept/reject
    if (proposal.project.clientId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (proposal.project.status !== 'OPEN') {
      return NextResponse.json(
        { error: 'Proyek ini tidak dapat menerima proposal lagi' },
        { status: 400 }
      );
    }

    if (action === 'accept') {
      // Accept this proposal, reject others, update project status
      await prisma.$transaction(async (tx) => {
        // Update accepted proposal
        await tx.proposal.update({
          where: { id: proposalId },
          data: { status: 'ACCEPTED' },
        });

        // Reject other proposals
        await tx.proposal.updateMany({
          where: {
            projectId: params.id,
            id: { not: proposalId },
            status: 'PENDING',
          },
          data: { status: 'REJECTED' },
        });

        // Update project
        await tx.project.update({
          where: { id: params.id },
          data: {
            status: 'IN_PROGRESS',
            hiredAnalystId: proposal.analystId,
            hiredAt: new Date(),
          },
        });

        // Create milestones from proposal
        const milestones = proposal.proposedMilestones as Array<{
          title: string;
          description: string;
          amount: number;
          dueDate?: string;
        }>;

        for (let i = 0; i < milestones.length; i++) {
          const milestone = milestones[i];
          await tx.milestone.create({
            data: {
              projectId: params.id,
              title: milestone.title,
              description: milestone.description,
              amount: milestone.amount,
              dueDate: milestone.dueDate ? new Date(milestone.dueDate) : null,
              sortOrder: i,
              status: i === 0 ? 'IN_PROGRESS' : 'PENDING',
            },
          });
        }

        // Create conversation for client and analyst
        await tx.conversation.create({
          data: {
            projectId: params.id,
            participants: {
              create: [
                { userId: proposal.project.clientId },
                { userId: proposal.analystId },
              ],
            },
          },
        });
      });

      return NextResponse.json({
        success: true,
        message: 'Proposal diterima! Proyek dimulai.',
      });
    } else {
      // Reject proposal
      await prisma.proposal.update({
        where: { id: proposalId },
        data: { status: 'REJECTED' },
      });

      return NextResponse.json({
        success: true,
        message: 'Proposal ditolak.',
      });
    }
  } catch (error) {
    console.error('Error updating proposal:', error);
    return NextResponse.json(
      { error: 'Failed to update proposal' },
      { status: 500 }
    );
  }
}
