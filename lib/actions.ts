import { prisma } from "@/lib/prisma";

/*
    Dashboard data retrieval function.
    Fetches and returns dashboard data for a user by email.
    Includes total balance, monthly spend/income, and recent transactions.
    Handles errors and returns default values if user not found or on failure.
*/

export type RecentTx = {
  id: string;
  note: string | null;
  amountCents: number;
  occurredAt: Date;
};

export async function getDashboardData(email: string): Promise<{
  totalBalanceCents: number;
  monthSpendCents: number;
  monthIncomeCents: number;
  recent: RecentTx[];
  error?: string;
}> {
  if (!email) return { totalBalanceCents: 0, monthSpendCents: 0, monthIncomeCents: 0, recent: [] };

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return { totalBalanceCents: 0, monthSpendCents: 0, monthIncomeCents: 0, recent: [] };
    }

    const now = new Date();
    const startOfMonthUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const nowUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()));

    const [sumAll, sumMonthSpend, sumMonthIncome, recentTx] = await Promise.all([
      prisma.transaction.aggregate({
        _sum: { amountCents: true },
        where: { ownerId: user.id },
      }),
      prisma.transaction.aggregate({
        _sum: { amountCents: true },
        where: {
          ownerId: user.id,
          occurredAt: { gte: startOfMonthUtc, lte: nowUtc },
          amountCents: { lt: 0 },
        },
      }),
      prisma.transaction.aggregate({
        _sum: { amountCents: true },
        where: {
          ownerId: user.id,
          occurredAt: { gte: startOfMonthUtc, lte: nowUtc },
          amountCents: { gt: 0 },
        },
      }),
      prisma.transaction.findMany({
        where: { ownerId: user.id },
        orderBy: { occurredAt: "desc" },
        take: 5,
        select: { id: true, note: true, amountCents: true, occurredAt: true },
      }),
    ]);

    return {
      totalBalanceCents: sumAll._sum.amountCents ?? 0,
      monthSpendCents: Math.abs(sumMonthSpend._sum.amountCents ?? 0),
      monthIncomeCents: sumMonthIncome._sum.amountCents ?? 0,
      recent: recentTx,
    };
  } catch (e) {
    console.error("[Dashboard] failed to load:", e);
    return {
      totalBalanceCents: 0,
      monthSpendCents: 0,
      monthIncomeCents: 0,
      recent: [],
      error: "We couldn’t load your dashboard right now. Please try again.",
    };
  }
}
