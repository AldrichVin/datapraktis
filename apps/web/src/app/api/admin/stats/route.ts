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

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get current month start
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // User stats
    const [totalUsers, clientCount, analystCount, newUsersThisMonth] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'CLIENT' } }),
      prisma.user.count({ where: { role: 'ANALYST' } }),
      prisma.user.count({
        where: { createdAt: { gte: monthStart } },
      }),
    ]);

    // Project stats
    const [totalProjects, openProjects, inProgressProjects, completedProjects] =
      await Promise.all([
        prisma.project.count(),
        prisma.project.count({ where: { status: 'OPEN' } }),
        prisma.project.count({ where: { status: 'IN_PROGRESS' } }),
        prisma.project.count({ where: { status: 'COMPLETED' } }),
      ]);

    // Revenue stats
    const [totalPlatformFees, thisMonthFees, pendingWithdrawalsAmount] =
      await Promise.all([
        prisma.transaction.aggregate({
          where: { status: { in: ['RELEASED', 'ESCROWED'] } },
          _sum: { platformFee: true },
        }),
        prisma.transaction.aggregate({
          where: {
            status: { in: ['RELEASED', 'ESCROWED'] },
            createdAt: { gte: monthStart },
          },
          _sum: { platformFee: true },
        }),
        prisma.withdrawal.aggregate({
          where: { status: 'PENDING' },
          _sum: { amount: true },
        }),
      ]);

    // Recent projects
    const recentProjects = await prisma.project.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        client: {
          select: { name: true },
        },
      },
    });

    // Pending withdrawals
    const pendingWithdrawals = await prisma.withdrawal.findMany({
      where: { status: 'PENDING' },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        amount: true,
        createdAt: true,
        status: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          clients: clientCount,
          analysts: analystCount,
          newThisMonth: newUsersThisMonth,
        },
        projects: {
          total: totalProjects,
          open: openProjects,
          inProgress: inProgressProjects,
          completed: completedProjects,
        },
        revenue: {
          totalPlatformFees: totalPlatformFees._sum.platformFee || 0,
          thisMonth: thisMonthFees._sum.platformFee || 0,
          pendingWithdrawals: pendingWithdrawalsAmount._sum.amount || 0,
        },
        recentProjects,
        pendingWithdrawals,
      },
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
