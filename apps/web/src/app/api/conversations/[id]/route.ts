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

    // Check if user is a participant
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: params.id,
        participants: {
          some: {
            userId: session.user.id,
          },
        },
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            status: true,
            clientId: true,
            hiredAnalystId: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Get messages
    const messages = await prisma.message.findMany({
      where: { conversationId: params.id },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Update last read timestamp
    await prisma.conversationParticipant.updateMany({
      where: {
        conversationId: params.id,
        userId: session.user.id,
      },
      data: { lastReadAt: new Date() },
    });

    // Find the other participant
    const otherParticipant = conversation.participants.find(
      (p) => p.userId !== session.user.id
    );

    return NextResponse.json({
      success: true,
      data: {
        ...conversation,
        messages,
        otherUser: otherParticipant?.user,
      },
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
}
