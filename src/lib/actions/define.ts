/**
 * Safe server-action factory.
 *
 * Every mutation in the product is declared through `authedAction` / `publicAction`, which:
 *   1. resolves the actor from the session (fresh permissions from the DB)
 *   2. enforces the portal + permission gate (default-deny) and audits denials
 *   3. validates input with Zod on the server (never trust the client)
 *   4. maps expected failures (`AppError`) to a typed result and hides unexpected ones
 *
 * Services still re-check permissions & scope — the gate here is the first of two layers.
 */
import "server-only";
import { z } from "zod";
import { getActor } from "@/lib/auth/session";
import { recordAccessDenied } from "@/features/audit/audit";
import { AppError, Errors, isAppError, type ErrorCode } from "@/lib/errors";
import { canAny, portalAccess, type Actor } from "@/lib/permissions/engine";
import type { PermissionKey } from "@/config/permissions";
import { isUniqueViolation } from "@/lib/prisma/client";

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; code: ErrorCode; error: string; fieldErrors?: Record<string, string[]> };

export function fail(code: ErrorCode, error: string, fieldErrors?: Record<string, string[]>): { ok: false; code: ErrorCode; error: string; fieldErrors?: Record<string, string[]> } {
  return { ok: false, code, error, fieldErrors };
}

type Portal = "admin" | "staff" | "customer";

interface Common<S extends z.ZodType> {
  name: string;
  schema: S;
}

async function execute<S extends z.ZodType, R>(
  config: Common<S> & { permission?: PermissionKey | PermissionKey[]; portal?: Portal; requireAuth: boolean },
  raw: unknown,
  handler: (ctx: { input: z.output<S>; actor: Actor | null }) => Promise<ActionResult<R>>,
): Promise<ActionResult<R>> {
  try {
    const actor = await getActor();

    if (config.requireAuth && !actor) return fail("UNAUTHENTICATED", "Your session has expired. Please sign in again.");

    if (actor && config.portal && !portalAccess(actor)[config.portal]) {
      await recordAccessDenied(actor, `portal:${config.portal}`, `action:${config.name}`);
      return fail("FORBIDDEN", "You don't have access to this area.");
    }

    if (config.permission) {
      const keys = Array.isArray(config.permission) ? config.permission : [config.permission];
      if (!actor || !canAny(actor, keys)) {
        if (actor) await recordAccessDenied(actor, keys.join(" | "), `action:${config.name}`);
        return fail("FORBIDDEN", "You don't have permission to do that.");
      }
    }

    const parsed = config.schema.safeParse(raw);
    if (!parsed.success) {
      const flat = z.flattenError(parsed.error);
      return fail("VALIDATION", "Please check the highlighted fields.", flat.fieldErrors as Record<string, string[]>);
    }

    return await handler({ input: parsed.data, actor: actor as Actor });
  } catch (error) {
    // Let Next.js control-flow errors (redirect / notFound) pass through untouched.
    if (error && typeof error === "object" && "digest" in error && typeof (error as { digest?: unknown }).digest === "string") {
      const digest = (error as { digest: string }).digest;
      if (digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_HTTP_ERROR_FALLBACK") || digest === "DYNAMIC_SERVER_USAGE") throw error;
    }
    if (isAppError(error)) return fail(error.code, error.message, error.fieldErrors);
    if (isUniqueViolation(error)) return fail("CONFLICT", "That already exists.");
    console.error(`[action:${config.name}]`, error);
    return fail("INTERNAL", "Something went wrong on our side. Please try again.");
  }
}

/** Mutation that requires a signed-in, active user (optionally a portal and/or any-of permissions). */
export function authedAction<S extends z.ZodType, R>(
  config: Common<S> & {
    permission?: PermissionKey | PermissionKey[];
    portal?: Portal;
    handler: (ctx: { input: z.output<S>; actor: Actor }) => Promise<ActionResult<R>>;
  },
) {
  return async (raw: z.input<S>): Promise<ActionResult<R>> =>
    execute({ ...config, requireAuth: true }, raw, (ctx) => config.handler({ input: ctx.input, actor: ctx.actor as Actor }));
}

/** Mutation open to anonymous visitors (booking as guest, contact form, sign-in…). */
export function publicAction<S extends z.ZodType, R>(
  config: Common<S> & { handler: (ctx: { input: z.output<S>; actor: Actor | null }) => Promise<ActionResult<R>> },
) {
  return async (raw: z.input<S>): Promise<ActionResult<R>> => execute({ ...config, requireAuth: false }, raw, config.handler);
}

export { AppError, Errors };
