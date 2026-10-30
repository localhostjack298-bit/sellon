import "server-only";
import { headers } from "next/headers";
import { prisma, Prisma } from "@/lib/prisma/client";
import type { Actor } from "@/lib/permissions/engine";

type DbLike = Pick<typeof prisma, "auditLog">;

export interface AuditInput {
  actor?: Pick<Actor, "userId" | "name"> | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
  metadata?: Record<string, unknown>;
}

async function clientIp(): Promise<string | null> {
  try {
    const h = await headers();
    return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null;
  } catch {
    return null; // outside a request (seed, scripts)
  }
}

/** Append an immutable audit record. Pass a transaction client so the log commits atomically with the change. */
export async function writeAudit(input: AuditInput, db: DbLike = prisma): Promise<void> {
  await db.auditLog.create({
    data: {
      actorId: input.actor?.userId ?? null,
      actorName: input.actor?.name ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      summary: input.summary,
      metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      ipAddress: await clientIp(),
    },
  });
}

/** Record a denied access attempt (de-duplicated per actor + resource for one minute). */
export async function recordAccessDenied(actor: Pick<Actor, "userId" | "name">, permission: string, resource: string): Promise<void> {
  try {
    const since = new Date(Date.now() - 60_000);
    const duplicate = await prisma.auditLog.findFirst({
      where: { action: "access.denied", actorId: actor.userId, entityId: resource, createdAt: { gte: since } },
      select: { id: true },
    });
    if (duplicate) return;
    await writeAudit({
      actor,
      action: "access.denied",
      entityType: "permission",
      entityId: resource,
      summary: `Access denied — ${permission} (${resource})`,
      metadata: { permission, resource },
    });
  } catch (error) {
    console.error("[audit] could not record access.denied", error);
  }
}
