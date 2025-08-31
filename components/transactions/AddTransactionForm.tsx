"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddTransactionForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formEl = e.currentTarget;
    const fd = new FormData(formEl);
    const payload = Object.fromEntries(fd.entries());

    setPending(true);
    try {
      const r = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(data.error || `Failed (${r.status})`);
      } else {
        formEl.reset();
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || "Network error");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <div className="grid grid-cols-4 gap-2">
        <select name="kind" defaultValue="expense" className="col-span-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/30">
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
        <input name="amount" type="number" step="0.01" placeholder="Amount" required className="col-span-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/30" />
        <input name="occurredAt" type="date" required className="col-span-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/30" />
        <input name="note" type="text" placeholder="Note (optional)" className="col-span-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/30" />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button disabled={pending} className="rounded-lg bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-black transition disabled:opacity-60">
        {pending ? "Adding…" : "Add transaction"}
      </button>
    </form>
  );
}

