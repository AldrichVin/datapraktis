import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@datapraktis/db';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        template: {
          select: {
            name: true,
            slug: true,
            icon: true,
            questions: true,
            exampleDeliverables: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            image: true,
            createdAt: true,
          },
        },
        files: {
          where: { deletedAt: null },
          select: {
            id: true,
            filename: true,
            originalName: true,
            mimeType: true,
            size: true,
            accessLevel: true,
            createdAt: true,
          },
        },
        proposals: {
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
                    responseTimeHours: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        milestones: {
          orderBy: { sortOrder: 'asc' },
          include: {
            files: {
              where: { deletedAt: null },
              select: {
                id: true,
                originalName: true,
                mimeType: true,
                size: true,
                createdAt: true,
              },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        _count: {
          select: {
            proposals: true,
            files: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check access permissions
    const isClient = project.clientId === session.user.id;
    const isAnalyst = session.user.role === 'ANALYST';
    const hasProposal = project.proposals.some(
      (p) => p.analystId === session.user.id
    );
    const isHiredAnalyst = project.hiredAnalystId === session.user.id;

    // Analysts can only see OPEN projects or ones they're involved with
    if (!isClient && isAnalyst && project.status !== 'OPEN' && !hasProposal && !isHiredAnalyst) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Filter proposals - analysts can only see their own unless hired
    let filteredProposals = project.proposals;
    if (isAnalyst && !isClient) {
      filteredProposals = project.proposals.filter(
        (p) => p.analystId === session.user.id
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...project,
        proposals: filteredProposals,
        isClient,
        isHiredAnalyst,
        hasProposal,
      },
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
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

    const project = await prisma.project.findUnique({
      where: { id: params.id },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.clientId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { status } = body;

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      DRAFT: ['OPEN', 'CANCELLED'],
      OPEN: ['CANCELLED'],
      IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
    };

    if (status && !validTransitions[project.status]?.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status transition' },
        { status: 400 }
      );
    }

    const updatedProject = await prisma.project.update({
      where: { id: params.id },
      data: {
        ...(status && { status }),
        ...(status === 'COMPLETED' && { completedAt: new Date() }),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedProject,
    });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}
