"use client";


import { useTransition } from "react";
import { useRouter } from "next/navigation";


export default function DeleteTransactionButton({ id }: { id: string }) {
    const [pending, start] = useTransition();
    const router = useRouter();


return (
    <button
        onClick={() => start(async () => {
            await fetch(`/api/transactions/${id}`, { method: "DELETE" });
            router.refresh();
        })}
        className="text-xs text-gray-500 hover:text-red-600"
        disabled={pending}
        >
        {pending ? "Deleting…" : "Delete"}
    </button>
    );
}