export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

/*
    API route for deleting a transaction by ID.
    It handles DELETE requests to /api/transactions/[id].
    Validates user session, checks transaction ownership, and deletes the transaction from the database.
    Returns appropriate HTTP status codes and messages for success and error cases.
*/


export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
    try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401 });


    const email = session.user.email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });


    const tx = await prisma.transaction.findUnique({ where: { id: params.id }, select: { ownerId: true } });
    if (!tx || tx.ownerId !== user.id) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });


    await prisma.transaction.delete({ where: { id: params.id } });
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
} catch {
    return new Response(JSON.stringify({ error: "Failed to delete" }), { status: 500 });
    }
}
