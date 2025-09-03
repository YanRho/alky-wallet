// app/api/register/route.ts
export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { z } from "zod";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

/*

    API route for user registration.
    It handles POST requests with JSON body containing name, email, and password.
    Validates input, checks for existing user, hashes password, and creates new user in DB.
    Returns appropriate HTTP status codes and messages for success and error cases.
*/

// Schema for incoming registration data
const RegisterSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// Helper: Parse and validate JSON body
async function parseRequestBody(req: Request) {
  try {
    const json = await req.json();
    return RegisterSchema.parse(json);
  } catch (err) {
    if (err instanceof z.ZodError) {
      throw new Response(
        JSON.stringify({ error: err.issues.map((e) => e.message).join(", ") }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    throw new Response(
      JSON.stringify({ error: "Invalid or missing JSON" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
}

// Helper: Create user in DB
async function createUser(name: string, email: string, password: string) {
  const normalizedEmail = email.toLowerCase();
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
  const passwordHash = await hash(password, saltRounds);

  // Check for existing user
  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });
  if (existing) {
    throw new Response(
      JSON.stringify({ error: "Email is already registered" }),
      { status: 409, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    await prisma.user.create({
      data: { name, email: normalizedEmail, passwordHash },
    });
  } catch (e) {
    if (
      e instanceof PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      throw new Response(
        JSON.stringify({ error: "Email is already registered" }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }
    throw new Response(
      JSON.stringify({ error: "Database error. Please try again." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// POST handler
export async function POST(req: Request) {
  try {
    const { name, email, password } = await parseRequestBody(req);
    await createUser(name, email, password);

    return new Response(JSON.stringify({ ok: true }), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    if (err instanceof Response) return err;

    console.error("Unexpected registration error:", err);
    return new Response(
      JSON.stringify({ error: "Server error. Please try again." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
