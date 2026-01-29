import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@datapraktis/db';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Users over time
    const usersOverTime = await prisma.user.groupBy({
      by: ['role'],
      where: {
        createdAt: { gte: startDate },
      },
      _count: true,
    });

    // Projects over time by status
    const projectsByStatus = await prisma.project.groupBy({
      by: ['status'],
      _count: true,
    });

    // Revenue over time
    const transactions = await prisma.transaction.findMany({
      where: {
        createdAt: { gte: startDate },
        status: { in: ['ESCROWED', 'RELEASED'] },
      },
      select: {
        amount: true,
        platformFee: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group transactions by day
    const revenueByDay: Record<string, { amount: number; fee: number }> = {};
    transactions.forEach((t: { amount: number; platformFee: number; createdAt: Date }) => {
      const day = t.createdAt.toISOString().split('T')[0];
      if (!revenueByDay[day]) {
        revenueByDay[day] = { amount: 0, fee: 0 };
      }
      revenueByDay[day].amount += t.amount;
      revenueByDay[day].fee += t.platformFee;
    });

    // Top templates
    const topTemplates = await prisma.project.groupBy({
      by: ['templateId'],
      _count: true,
      orderBy: { _count: { templateId: 'desc' } },
      take: 5,
    });

    const templateIds = topTemplates
      .map((t: { templateId: string | null; _count: number }) => t.templateId)
      .filter((id: string | null): id is string => id !== null);

    const templates = await prisma.template.findMany({
      where: { id: { in: templateIds } },
      select: { id: true, name: true },
    });

    const topTemplatesWithNames = topTemplates.map((t: { templateId: string | null; _count: number }) => ({
      templateId: t.templateId,
      name: templates.find((temp: { id: string; name: string }) => temp.id === t.templateId)?.name || 'No Template',
      count: t._count,
    }));

    // Top analysts
    const topAnalysts = await prisma.analystProfile.findMany({
      orderBy: { completedProjects: 'desc' },
      take: 5,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Average project value
    const avgProjectValue = await prisma.project.aggregate({
      where: {
        status: { in: ['IN_PROGRESS', 'COMPLETED'] },
      },
      _avg: {
        budgetMin: true,
        budgetMax: true,
      },
    });

    // Conversion rates
    const totalProjects = await prisma.project.count();
    const completedProjects = await prisma.project.count({
      where: { status: 'COMPLETED' },
    });
    const conversionRate =
      totalProjects > 0 ? ((completedProjects / totalProjects) * 100).toFixed(1) : 0;

    // Average time to hire (from OPEN to IN_PROGRESS)
    const projectsWithHireTime = await prisma.project.findMany({
      where: {
        status: { in: ['IN_PROGRESS', 'COMPLETED'] },
        hiredAt: { not: null },
      },
      select: {
        createdAt: true,
        hiredAt: true,
      },
    });

    let avgHireTimeDays = 0;
    if (projectsWithHireTime.length > 0) {
      const totalDays = projectsWithHireTime.reduce((sum: number, p: { createdAt: Date; hiredAt: Date | null }) => {
        if (p.hiredAt) {
          const diffTime = Math.abs(p.hiredAt.getTime() - p.createdAt.getTime());
          const diffDays = diffTime / (1000 * 60 * 60 * 24);
          return sum + diffDays;
        }
        return sum;
      }, 0);
      avgHireTimeDays = totalDays / projectsWithHireTime.length;
    }

    return NextResponse.json({
      success: true,
      data: {
        usersOverTime,
        projectsByStatus,
        revenueByDay: Object.entries(revenueByDay).map(([date, data]) => ({
          date,
          ...data,
        })),
        topTemplates: topTemplatesWithNames,
        topAnalysts: topAnalysts.map((a: { user: { id: string; name: string | null; image: string | null }; completedProjects: number; rating: number }) => ({
          ...a.user,
          completedProjects: a.completedProjects,
          rating: a.rating,
        })),
        metrics: {
          avgProjectValueMin: avgProjectValue._avg.budgetMin || 0,
          avgProjectValueMax: avgProjectValue._avg.budgetMax || 0,
          conversionRate: parseFloat(conversionRate as string),
          avgHireTimeDays: avgHireTimeDays.toFixed(1),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
