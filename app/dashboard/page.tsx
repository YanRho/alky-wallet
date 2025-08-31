// app/dashboard/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import SignOutButton from "@/components/SignOutButton";
import { prisma } from "@/lib/prisma";
import AddTransactionForm from "../../components/transactions/AddTransactionForm";
import DeleteTransactionButton from "../../components/transactions/DeleteTransactionButton";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?callbackUrl=/dashboard");

  const name = session.user?.name ?? "there";
  const email = session.user?.email?.toLowerCase() ?? "";

  let totalBalanceCents = 0;
  let monthSpendCents = 0;
  let monthIncomeCents = 0;
  let recent: { id: string; note: string | null; amountCents: number; occurredAt: Date }[] = [];

  try {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (user) {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [sumAll, sumMonthSpend, sumMonthIncome, recentTx] = await Promise.all([
        prisma.transaction.aggregate({ _sum: { amountCents: true }, where: { ownerId: user.id } }),
        prisma.transaction.aggregate({
          _sum: { amountCents: true },
          where: { ownerId: user.id, occurredAt: { gte: startOfMonth, lte: now }, amountCents: { lt: 0 } },
        }),
        prisma.transaction.aggregate({
          _sum: { amountCents: true },
          where: { ownerId: user.id, occurredAt: { gte: startOfMonth, lte: now }, amountCents: { gt: 0 } },
        }),
        prisma.transaction.findMany({
          where: { ownerId: user.id },
          orderBy: { occurredAt: "desc" },
          take: 5,
          select: { id: true, note: true, amountCents: true, occurredAt: true },
        }),
      ]);

      totalBalanceCents = sumAll._sum.amountCents ?? 0;
      monthSpendCents = Math.abs(sumMonthSpend._sum.amountCents ?? 0);
      monthIncomeCents = sumMonthIncome._sum.amountCents ?? 0;
      recent = recentTx;
    }
  } catch {}

  const fmt = (cents: number, currency = "USD") =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);

  return (
    <main className="min-h-screen bg-neutral-100">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-neutral-200">
        <div className="mx-auto max-w-6xl px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6 font-medium">
            <a href="/dashboard" className="hover:underline">Dashboard</a>
            <a href="#" className="hover:underline">Accounts</a>
            <a href="#" className="hover:underline">Categories</a>
            <a href="#" className="hover:underline">Reports</a>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-600 hidden sm:inline">{email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8 space-y-8">
        <section>
          <h1 className="text-2xl sm:text-3xl font-semibold">Welcome, {name} 👋</h1>
          <p className="text-gray-600 mt-1">Here’s a quick snapshot of your finances.</p>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card title="Total balance" value={fmt(totalBalanceCents)} />
          <Card title="This month spend" value={fmt(monthSpendCents)} subtitle="Expenses" />
          <Card title="This month income" value={fmt(monthIncomeCents)} subtitle="Income" />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-medium">Recent activity</h2>
              <a href="#" className="text-sm text-gray-600 hover:underline">View all</a>
            </div>
            {recent.length === 0 ? (
              <EmptyState text="No transactions yet. Add your first one." />
            ) : (
              <ul className="divide-y">
                {recent.map((t) => (
                  <li key={t.id} className="flex items-center justify-between py-3 text-sm">
                    <div className="flex flex-col">
                      <span className="font-medium">{t.note || "(no note)"}</span>
                      <span className="text-gray-500">{new Date(t.occurredAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={t.amountCents < 0 ? "text-red-600" : "text-emerald-600"}>{fmt(t.amountCents)}</span>
                      <DeleteTransactionButton id={t.id} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-medium mb-3">Quick actions</h2>
            <AddTransactionForm />
          </div>
        </section>
      </div>
    </main>
  );
}

function Card({ title, value, subtitle }: { title: string; value: string; subtitle?: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      {subtitle ? <p className="text-xs text-gray-500 mt-1">{subtitle}</p> : null}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center h-28 rounded-lg border border-dashed border-neutral-200 bg-neutral-50">
      <p className="text-sm text-gray-600">{text}</p>
    </div>
  );
}

