// app/api/register/route.ts
export const runtime = "nodejs"; // ensure Node runtime for Prisma

import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { z, ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

const RegisterSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: (z as any).email
    ? (z as any).email("Invalid email address")
    : z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: Request) {
  try {
    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid or missing JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { name, email, password } = RegisterSchema.parse(json);
    const normalizedEmail = email.toLowerCase();

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });
    if (existing) {
      return new Response(
        JSON.stringify({ error: "Email is already registered" }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }

    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
    const passwordHash = await hash(password, saltRounds);

    try {
      await prisma.user.create({
        data: { name, email: normalizedEmail, passwordHash },
      });
    } catch (e) {
      // Handle unique constraint violation
      if (
        e instanceof PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        return new Response(
          JSON.stringify({ error: "Email is already registered" }),
          { status: 409, headers: { "Content-Type": "application/json" } }
        );
      }
      throw e;
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return new Response(
        JSON.stringify({
          error: err.issues.map((e) => e.message).join(", "),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.error("Registration error:", err);
    return new Response(
      JSON.stringify({ error: "Server error. Please try again." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
