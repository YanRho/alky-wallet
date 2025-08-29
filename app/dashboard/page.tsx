
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import SignOutButton from "@/components/SignOutButton";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?callbackUrl=/dashboard");

  const name = session.user?.name ?? "there"; 
  const email = session.user?.email ?? ""; 

  // TODO: replace these with real aggregates later
  const totalBalanceCents = 0;
  const monthSpendCents = 0;
  const monthIncomeCents = 0;

  const fmt = (cents: number, currency = "USD") =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);

  return (
    <main className="min-h-screen bg-neutral-100">
      {/* Navbar */}
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
        {/* Greeting */}
        <section>
          <h1 className="text-2xl sm:text-3xl font-semibold">Welcome, {name} 👋</h1>
          <p className="text-gray-600 mt-1">Here’s a quick snapshot of your finances.</p>
        </section>

        {/* Stat cards */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card title="Total balance" value={fmt(totalBalanceCents)} />
          <Card title="This month spend" value={fmt(Math.abs(monthSpendCents))} subtitle="Expenses" />
          <Card title="This month income" value={fmt(monthIncomeCents)} subtitle="Income" />
        </section>

        {/* Recent activity + Quick actions */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-medium">Recent activity</h2>
              <a href="#" className="text-sm text-gray-600 hover:underline">View all</a>
            </div>
            <EmptyState text="No transactions yet. Add your first one." />
            {/* TODO: render a list of recent transactions here */}
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-medium mb-3">Quick actions</h2>
            <div className="flex flex-col gap-2">
              <a className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50" href="#">
                Add transaction
              </a>
              <a className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50" href="#">
                Add account
              </a>
              <a className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50" href="#">
                Add category
              </a>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Tip: Expenses are negative amounts, income is positive. We’ll wire these up next.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

/* ---------- tiny presentational helpers ---------- */
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
