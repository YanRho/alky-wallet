import { PrismaClient } from "@prisma/client";

/*
    Prisma Client setup.
    Ensures a single instance of PrismaClient is used across the application.
    Configures logging based on the environment (development or production).
*/

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };


export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });


if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;