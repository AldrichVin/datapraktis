import { NextResponse } from 'next/server';
import { prisma } from '@datapraktis/db';

// This endpoint should be called by a cron job (e.g., Vercel Cron, AWS Lambda)
// Recommended schedule: Every hour
// Security: Add CRON_SECRET verification in production

export async function GET(request: Request) {
  try {
    // Verify cron secret in production
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();

    // Find all milestones that are SUBMITTED and past auto-release date
    const expiredMilestones = await prisma.milestone.findMany({
      where: {
        status: 'SUBMITTED',
        autoReleaseAt: {
          lte: now,
        },
      },
      include: {
        project: {
          include: {
            milestones: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
        transaction: true,
      },
    });

    console.log(`Found ${expiredMilestones.length} milestones to auto-release`);

    const results = {
      processed: 0,
      released: 0,
      errors: [] as string[],
    };

    for (const milestone of expiredMilestones) {
      try {
        await prisma.$transaction(async (tx) => {
          // 1. Approve the milestone (auto-release)
          await tx.milestone.update({
            where: { id: milestone.id },
            data: {
              status: 'APPROVED',
              approvedAt: now,
              autoReleaseAt: null,
            },
          });

          // 2. Release escrowed funds for this milestone
          // Set availableAt to 5 days from now (security hold)
          const availableAt = new Date();
          availableAt.setDate(availableAt.getDate() + 5);

          if (milestone.transaction && milestone.transaction.status === 'ESCROWED') {
            await tx.transaction.update({
              where: { id: milestone.transaction.id },
              data: {
                status: 'RELEASED',
                releasedAt: now,
                availableAt: availableAt,
              },
            });
          }

          // 3. Update analyst balance
          if (milestone.project.hiredAnalystId && milestone.transaction) {
            const totalAmount = milestone.transaction.amount;
            const commission = Math.floor(totalAmount * 0.1); // 10% commission
            const netAmount = totalAmount - commission;

            await tx.analystProfile.update({
              where: { userId: milestone.project.hiredAnalystId },
              data: {
                balance: { increment: netAmount },
                totalEarnings: { increment: netAmount },
              },
            });
          }

          // 4. Start next milestone if available
          const currentIndex = milestone.project.milestones.findIndex(
            (m) => m.id === milestone.id
          );
          const nextMilestone = milestone.project.milestones[currentIndex + 1];

          if (nextMilestone && nextMilestone.status === 'PENDING') {
            await tx.milestone.update({
              where: { id: nextMilestone.id },
              data: { status: 'IN_PROGRESS' },
            });
          }

          // 5. Check if all milestones are approved - complete project
          const allMilestones = milestone.project.milestones;
          const approvedCount = allMilestones.filter(
            (m) => m.status === 'APPROVED' || m.id === milestone.id
          ).length;

          if (approvedCount === allMilestones.length) {
            await tx.project.update({
              where: { id: milestone.projectId },
              data: {
                status: 'COMPLETED',
                completedAt: now,
              },
            });

            // Update analyst stats
            if (milestone.project.hiredAnalystId) {
              await tx.analystProfile.update({
                where: { userId: milestone.project.hiredAnalystId },
                data: {
                  completedProjects: { increment: 1 },
                },
              });
            }
          }

          // 6. Create notification/message about auto-release
          const conversation = await tx.conversation.findFirst({
            where: { projectId: milestone.projectId },
          });

          if (conversation) {
            await tx.message.create({
              data: {
                conversationId: conversation.id,
                senderId: milestone.project.clientId, // System notification
                content: `[SISTEM] Milestone "${milestone.title}" telah di-auto-release karena tidak ada respon dalam 14 hari. Dana telah dilepas ke analyst.`,
              },
            });
          }

          results.released++;
        });

        results.processed++;
      } catch (error) {
        console.error(`Error auto-releasing milestone ${milestone.id}:`, error);
        results.errors.push(
          `Milestone ${milestone.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Auto-release completed`,
      ...results,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('Auto-release cron error:', error);
    return NextResponse.json(
      { error: 'Auto-release failed', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

// Also allow POST for manual triggers
export async function POST(request: Request) {
  return GET(request);
}
