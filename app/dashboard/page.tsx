import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDashboardData } from "@/lib/actions";
import SignOutButton from "@/components/auth/SignOutButton";
import AddTransactionForm from "@/components/transactions/AddTransactionForm";
import DeleteTransactionButton from "@/components/transactions/DeleteTransactionButton";
import Link from "next/link";

/*
    Dashboard page component that displays user financial overview.
    Redirects to login if not authenticated.
    Fetches and displays total balance, monthly spend/income, and recent transactions.
    Includes navigation links and sign-out button.
*/

export const revalidate = 0;

export default async function DashboardPage() {

  // Get user session, redirect to login if not authenticated
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?callbackUrl=/dashboard");

  // check session user details
  const name = session.user?.name ?? "there"; 
  const email = session.user?.email?.toLowerCase() ?? "";

  const {
    totalBalanceCents,
    monthSpendCents,
    monthIncomeCents,
    recent,
    error,
  } = await getDashboardData(email);

  const fmt = (cents: number, currency = "USD") =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);

  return (
    <main className="min-h-screen bg-neutral-100">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-neutral-200">
        <div className="mx-auto max-w-6xl px-6 py-3 flex items-center justify-between">
          <nav className="flex items-center gap-6 font-medium">
            <Link href="/dashboard" className="hover:underline">Dashboard</Link>
            <Link href="/accounts" className="hover:underline">Accounts</Link>
            <Link href="/categories" className="hover:underline">Categories</Link>
            <Link href="/reports" className="hover:underline">Reports</Link>
          </nav>
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

        <section id="quick-actions">
          <h2 className="text-lg font-medium mb-3">Quick actions</h2>
          <AddTransactionForm />
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/accounts" className="hover:shadow-md transition">
            <Card title="Total balance" value={fmt(totalBalanceCents)} subtitle="All accounts" />
          </Link>
          <Link href="/transactions?filter=expenses" className="hover:shadow-md transition">
            <Card title="This month spend" value={fmt(monthSpendCents)} subtitle="Expenses" />
          </Link>
          <Link href="/transactions?filter=income" className="hover:shadow-md transition">
            <Card title="This month income" value={fmt(monthIncomeCents)} subtitle="Income" />
          </Link>
        </section>

        <section className="grid grid-cols-1 gap-6">
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-medium">Recent activity</h2>
              <Link href="/transactions" className="text-sm text-gray-600 hover:underline">View all</Link>
            </div>

            {recent.length === 0 ? (
              <EmptyState text="No transactions yet. Add your first one." />
            ) : (
              <ul className="divide-y">
                {recent.map((t) => (
                  <li key={t.id} className="flex items-center justify-between py-3 text-sm">
                    <div className="flex flex-col">
                      <span className="font-medium">{t.note || "(no note)"}</span>
                      <span className="text-gray-500">
                        {new Date(t.occurredAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={t.amountCents < 0 ? "text-red-600" : "text-emerald-600"}>
                        {fmt(t.amountCents)}
                      </span>
                      <DeleteTransactionButton id={t.id} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {error && <ErrorPanel message={error} />}
      </div>
    </main>
  );
}

function Card({ title, value, subtitle }: { title: string; value: string; subtitle?: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm hover:bg-neutral-50 transition">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      {subtitle ? <p className="text-xs text-gray-500 mt-1">{subtitle}</p> : null}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-28 rounded-lg border border-dashed border-neutral-200 bg-neutral-50">
      <p className="text-sm text-gray-600 mb-2">{text}</p>
      <a href="#quick-actions" className="text-sm text-gray-900 underline hover:text-black">Add transaction</a>
    </div>
  );
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 text-red-800 p-5">
      <p className="text-sm">{message}</p>
    </div>
  );
}
