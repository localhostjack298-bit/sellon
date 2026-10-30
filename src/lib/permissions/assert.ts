/**
 * Guard helpers used by services, server actions and route handlers.
 * `assertCan` is the last line of defence: even if a UI button is visible, or a client forges a request,
 * the service layer refuses the operation.
 */
import { Errors } from "@/lib/errors";
import { can, canAny, recordInScope, scopeOf, type Actor, type ScopedRecord } from "@/lib/permissions/engine";
import type { PermissionKey } from "@/config/permissions";

export function assertAuthenticated(actor: Actor | null | undefined): asserts actor is Actor {
  if (!actor) throw Errors.unauthenticated();
}

export function assertCan(actor: Actor | null | undefined, key: PermissionKey): asserts actor is Actor {
  assertAuthenticated(actor);
  if (!can(actor, key)) throw Errors.forbidden(`You don't have the “${key}” permission.`, { permission: key });
}

export function assertCanAny(actor: Actor | null | undefined, keys: readonly PermissionKey[]): asserts actor is Actor {
  assertAuthenticated(actor);
  if (!canAny(actor, keys)) throw Errors.forbidden(`You need one of: ${keys.join(", ")}.`, { permission: keys[0] });
}

/** Single-record scope check (OWN / BRANCH / ALL). */
export function assertRecordScope(actor: Actor | null | undefined, key: PermissionKey, record: ScopedRecord): asserts actor is Actor {
  assertCan(actor, key);
  if (!recordInScope(actor, key, record)) {
    throw Errors.forbidden("That record is outside the scope of your permission.", { permission: key, scope: scopeOf(actor, key) });
  }
}
