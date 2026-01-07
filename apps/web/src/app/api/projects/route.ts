import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma, Prisma } from '@datapraktis/db';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const createProjectSchema = z.object({
  templateId: z.string().optional(),
  title: z.string().min(5, 'Judul minimal 5 karakter'),
  description: z.string().min(20, 'Deskripsi minimal 20 karakter'),
  templateAnswers: z.record(z.unknown()).optional(),
  budgetMin: z.number().min(500000, 'Budget minimal Rp 500.000'),
  budgetMax: z.number(),
  deadline: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'CLIENT') {
      return NextResponse.json(
        { error: 'Only clients can create projects' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createProjectSchema.parse(body);

    const project = await prisma.project.create({
      data: {
        clientId: session.user.id,
        templateId: validatedData.templateId,
        title: validatedData.title,
        description: validatedData.description,
        templateAnswers: validatedData.templateAnswers as Prisma.InputJsonValue,
        budgetMin: validatedData.budgetMin,
        budgetMax: validatedData.budgetMax,
        deadline: validatedData.deadline ? new Date(validatedData.deadline) : null,
        status: 'OPEN',
      },
    });

    return NextResponse.json({
      success: true,
      data: project,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};

    // Clients see their own projects, analysts see open projects
    if (session.user.role === 'CLIENT') {
      where.clientId = session.user.id;
    } else if (session.user.role === 'ANALYST') {
      where.status = 'OPEN';
    }

    if (status) {
      where.status = status;
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        template: {
          select: {
            name: true,
            slug: true,
            icon: true,
          },
        },
        client: {
          select: {
            name: true,
            image: true,
          },
        },
        _count: {
          select: {
            proposals: true,
            files: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: projects,
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}
