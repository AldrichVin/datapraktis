import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@datapraktis/db';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const userRole = session.user.role;

    if (userRole === 'CLIENT') {
      // Client dashboard stats
      const [projects, completedSum, pendingProposals] = await Promise.all([
        // Get all client projects with status counts
        prisma.project.findMany({
          where: { clientId: userId },
          select: {
            id: true,
            title: true,
            status: true,
            budgetMin: true,
            budgetMax: true,
            createdAt: true,
            _count: {
              select: { proposals: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        // Get total spent (sum of paid milestones)
        prisma.transaction.aggregate({
          where: {
            milestone: {
              project: {
                clientId: userId,
              },
            },
            status: 'RELEASED',
          },
          _sum: {
            amount: true,
          },
        }),
        // Count pending proposals across all projects
        prisma.proposal.count({
          where: {
            project: {
              clientId: userId,
            },
            status: 'PENDING',
          },
        }),
      ]);

      const activeProjects = projects.filter(
        (p) => p.status === 'IN_PROGRESS'
      ).length;
      const completedProjects = projects.filter(
        (p) => p.status === 'COMPLETED'
      ).length;
      const totalSpent = completedSum._sum.amount || 0;

      // Get recent projects (limit 5)
      const recentProjects = projects.slice(0, 5).map((p) => ({
        id: p.id,
        title: p.title,
        status: p.status,
        budget: p.budgetMax,
        proposals: p._count.proposals,
        createdAt: p.createdAt.toISOString(),
      }));

      return NextResponse.json({
        success: true,
        data: {
          stats: {
            activeProjects,
            pendingProposals,
            completedProjects,
            totalSpent,
          },
          recentProjects,
        },
      });
    } else if (userRole === 'ANALYST') {
      // Analyst dashboard stats
      const [
        analystProfile,
        activeProjects,
        pendingProposals,
        totalEarnings,
        availableProjects,
        unreadMessages,
      ] = await Promise.all([
        // Get analyst profile
        prisma.analystProfile.findUnique({
          where: { userId },
          select: {
            rating: true,
            totalReviews: true,
            completedProjects: true,
            bio: true,
            headline: true,
            skills: true,
            portfolioUrl: true,
          },
        }),
        // Count active projects (where analyst is hired)
        prisma.project.count({
          where: {
            hiredAnalystId: userId,
            status: 'IN_PROGRESS',
          },
        }),
        // Count pending proposals
        prisma.proposal.count({
          where: {
            analystId: userId,
            status: 'PENDING',
          },
        }),
        // Get total earnings (released transactions)
        prisma.transaction.aggregate({
          where: {
            milestone: {
              project: {
                hiredAnalystId: userId,
              },
            },
            status: 'RELEASED',
          },
          _sum: {
            netAmount: true,
          },
        }),
        // Get available (open) projects
        prisma.project.findMany({
          where: {
            status: 'OPEN',
          },
          include: {
            client: {
              select: {
                name: true,
              },
            },
            template: {
              select: {
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        // Count unread messages
        prisma.message.count({
          where: {
            conversation: {
              participants: {
                some: {
                  userId,
                },
              },
            },
            senderId: {
              not: userId,
            },
            read: false,
          },
        }),
      ]);

      // Calculate profile completion percentage
      let profileCompletion = 0;
      if (analystProfile) {
        if (analystProfile.headline) profileCompletion += 20;
        if (analystProfile.bio && analystProfile.bio.length >= 50) profileCompletion += 20;
        if (analystProfile.skills && analystProfile.skills.length >= 3) profileCompletion += 20;
        if (analystProfile.portfolioUrl) profileCompletion += 20;
        if (analystProfile.rating > 0) profileCompletion += 20;
      }

      return NextResponse.json({
        success: true,
        data: {
          stats: {
            activeProjects,
            pendingProposals,
            completedProjects: analystProfile?.completedProjects || 0,
            totalEarnings: totalEarnings._sum.netAmount || 0,
            rating: analystProfile?.rating || 0,
            totalReviews: analystProfile?.totalReviews || 0,
          },
          profileCompletion,
          unreadMessages,
          availableProjects: availableProjects.map((p) => ({
            id: p.id,
            title: p.title,
            client: p.client.name,
            budget: p.budgetMax,
            deadline: p.deadline
              ? Math.ceil(
                  (new Date(p.deadline).getTime() - Date.now()) /
                    (1000 * 60 * 60 * 24)
                )
              : null,
            createdAt: p.createdAt.toISOString(),
          })),
        },
      });
    }

    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
