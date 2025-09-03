import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

/*
    API route for adding a new transaction.
    It handles POST requests to /api/transactions.
    Validates user session and input data, creates the transaction in the database.
    Returns appropriate HTTP status codes and messages for success and error cases.
*/


export const runtime = "nodejs";


const Schema = z.object({
    kind: z.enum(["expense", "income"]).optional(),
    amount: z.string(),
    note: z.string().optional().nullable(),
    occurredAt: z.string(),
});


export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401 });


        const json = await req.json().catch(() => null);
        const parsed = Schema.safeParse(json);
        if (!parsed.success) return new Response(JSON.stringify({ error: "Invalid form data" }), { status: 400 });


        const amountFloat = parseFloat(parsed.data.amount);
        if (!Number.isFinite(amountFloat)) return new Response(JSON.stringify({ error: "Amount must be a number" }), { status: 400 });


        const absoluteCents = Math.round(Math.abs(amountFloat) * 100);
        const amountCents = parsed.data.kind === "income" ? absoluteCents : -absoluteCents;


        const occurredAt = new Date(parsed.data.occurredAt);
        if (Number.isNaN(occurredAt.getTime())) return new Response(JSON.stringify({ error: "Invalid date" }), { status: 400 });


        const email = session.user.email.toLowerCase();
        const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
        if (!user) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });


        const account = (await prisma.account.findFirst({ where: { ownerId: user.id } })) ??
            (await prisma.account.create({ data: { ownerId: user.id, name: "Cash", currency: "USD" } }));


        await prisma.transaction.create({
            data: { ownerId: user.id, accountId: account.id, amountCents, note: parsed.data.note || null, occurredAt },
        });


        return new Response(JSON.stringify({ ok: true }), { status: 201 });
    } catch {
        return new Response(JSON.stringify({ error: "Failed to add transaction" }), { status: 500 });
    }
}