/**
 * Prisma ORM 7 client singleton (PostgreSQL via the `pg` driver adapter).
 * Shared by Next.js server code, the seed script and tests. Never import this from a Client Component.
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { __stellarPrisma?: PrismaClient };

function createClient(): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    max: Number(process.env.DATABASE_POOL_MAX ?? 10),
  });
  return new PrismaClient({
    adapter,
    log: process.env.PRISMA_LOG === "true" ? ["query", "warn", "error"] : ["warn", "error"],
  });
}

export const prisma: PrismaClient = globalForPrisma.__stellarPrisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.__stellarPrisma = prisma;

export { Prisma } from "@/generated/prisma/client";
export type TxClient = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

/** True when a Prisma error represents a PostgreSQL exclusion-constraint violation (SQLSTATE 23P01). */
export function isExclusionViolation(error: unknown): boolean {
  const text = errorText(error);
  return /23P01|exclusion constraint|bookings_no_staff_overlap|booking_resources_no_overlap/i.test(text);
}

/** True for unique-constraint violations (P2002 / SQLSTATE 23505). */
export function isUniqueViolation(error: unknown): boolean {
  const text = errorText(error);
  return /P2002|23505|unique constraint/i.test(text);
}

function errorText(error: unknown): string {
  if (!error) return "";
  try {
    const e = error as { message?: string; code?: string; meta?: unknown; cause?: unknown };
    return [e.code, e.message, JSON.stringify(e.meta ?? ""), JSON.stringify(e.cause ?? "")].filter(Boolean).join(" ");
  } catch {
    return String(error);
  }
}
