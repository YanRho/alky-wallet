"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

/*
  Form for adding a new transaction (expense or income).
  On submission, it sends a POST request to /api/transactions
  and refreshes the page to show the new transaction.
*/


export default function AddTransactionForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [defaultDate, setDefaultDate] = useState("");
  const router = useRouter();

  
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setDefaultDate(today);
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formEl = e.currentTarget;
    const fd = new FormData(formEl);
    const payload = Object.fromEntries(fd.entries());

    setPending(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || `Failed (${res.status})`);
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
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="kind" className="block text-sm font-medium text-gray-700">Type</label>
          <select
            id="kind"
            name="kind"
            defaultValue="expense"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/30"
            aria-label="Transaction type"
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount</label>
          <input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            required
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/30"
            aria-label="Amount"
          />
        </div>

        <div>
          <label htmlFor="occurredAt" className="block text-sm font-medium text-gray-700">Date</label>
          <input
            id="occurredAt"
            name="occurredAt"
            type="date"
            defaultValue={defaultDate}
            required
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/30"
            aria-label="Date"
          />
        </div>

        <div>
          <label htmlFor="note" className="block text-sm font-medium text-gray-700">Note</label>
          <input
            id="note"
            name="note"
            type="text"
            placeholder="Optional"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/30"
            aria-label="Note"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full sm:w-auto rounded-lg bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-black transition disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add transaction"}
      </button>
    </form>
  );
}
