/**
 * Pure permission engine — no database, no framework. Fully unit-tested (see tests/permissions.test.ts).
 *
 * Model
 *  • A user holds one or more roles; a role holds permission grants `{ key, scope }`.
 *  • Effective permissions = union of grants across the user's *active* roles; where several roles grant
 *    the same key the widest scope wins (ALL > BRANCH > OWN).
 *  • Anything not granted is denied. Unknown keys are ignored (default-deny).
 *  • The protected Super Admin role evaluates to every registered permission at ALL scope.
 */
import {
  ALL_PERMISSION_KEYS,
  SCOPE_RANK,
  isPermissionKey,
  normalizeScope,
  type PermissionKey,
  type PermissionScope,
} from "@/config/permissions";

export type RoleAudience = "ADMIN" | "STAFF" | "CUSTOMER";

export interface ActorRole {
  id: string;
  key: string;
  name: string;
  audience: RoleAudience;
  occupiesManagerSeat: boolean;
}

export interface Actor {
  userId: string;
  name: string;
  email: string;
  image: string | null;
  roles: ActorRole[];
  /** Effective permissions: key → widest scope. Plain object so it is safe to serialise to the client for UI hints. */
  permissions: Partial<Record<PermissionKey, PermissionScope>>;
  isSuperAdmin: boolean;
  employeeId: string | null;
  branchId: string | null;
  customerId: string | null;
}

export interface RoleGrantInput {
  role: ActorRole & { isActive: boolean; isProtected: boolean };
  grants: { key: string; scope: PermissionScope }[];
}

export function resolveEffectivePermissions(roles: RoleGrantInput[]): {
  permissions: Partial<Record<PermissionKey, PermissionScope>>;
  isSuperAdmin: boolean;
} {
  const permissions: Partial<Record<PermissionKey, PermissionScope>> = {};
  let isSuperAdmin = false;

  for (const { role, grants } of roles) {
    if (!role.isActive) continue;

    if (role.isProtected) {
      isSuperAdmin = true;
      for (const key of ALL_PERMISSION_KEYS) permissions[key] = "ALL";
      continue;
    }

    for (const grant of grants) {
      if (!isPermissionKey(grant.key)) continue; // default-deny unknown / retired permissions
      const scope = normalizeScope(grant.key, grant.scope);
      const current = permissions[grant.key];
      if (!current || SCOPE_RANK[scope] > SCOPE_RANK[current]) permissions[grant.key] = scope;
    }
  }

  return { permissions, isSuperAdmin };
}

type HasPermissions = Pick<Actor, "permissions">;

export function can(actor: HasPermissions | null | undefined, key: PermissionKey): boolean {
  if (!actor) return false;
  return Boolean(actor.permissions[key]);
}

export function canAny(actor: HasPermissions | null | undefined, keys: readonly PermissionKey[]): boolean {
  return keys.some((k) => can(actor, k));
}

export function canAll(actor: HasPermissions | null | undefined, keys: readonly PermissionKey[]): boolean {
  return keys.every((k) => can(actor, k));
}

export function scopeOf(actor: HasPermissions | null | undefined, key: PermissionKey): PermissionScope | null {
  if (!actor) return null;
  return actor.permissions[key] ?? null;
}

export function scopeAtLeast(actor: HasPermissions | null | undefined, key: PermissionKey, min: PermissionScope): boolean {
  const s = scopeOf(actor, key);
  return s !== null && SCOPE_RANK[s] >= SCOPE_RANK[min];
}

export interface ScopedRecord {
  /** The employee the record belongs to / is assigned to. */
  employeeId?: string | null;
  branchId?: string | null;
}

/**
 * Is a concrete record inside the actor's scope for this permission?
 * Used for single-record checks (detail pages, mutations) — list queries use `scopeWhere` helpers instead.
 */
export function recordInScope(actor: Actor | null | undefined, key: PermissionKey, record: ScopedRecord): boolean {
  const scope = scopeOf(actor, key);
  if (!actor || !scope) return false;
  if (scope === "ALL") return true;
  if (scope === "BRANCH") return Boolean(actor.branchId) && record.branchId === actor.branchId;
  return Boolean(actor.employeeId) && record.employeeId === actor.employeeId;
}

/** Portal access derives from role audiences (never from client state). */
export function portalAccess(actor: Pick<Actor, "roles" | "isSuperAdmin"> | null | undefined) {
  const audiences = new Set((actor?.roles ?? []).map((r) => r.audience));
  return {
    admin: audiences.has("ADMIN"),
    staff: audiences.has("STAFF") || audiences.has("ADMIN"),
    customer: audiences.has("CUSTOMER"),
  };
}

export function homePathFor(actor: Pick<Actor, "roles" | "isSuperAdmin"> | null | undefined): string {
  const access = portalAccess(actor);
  if (access.admin) return "/admin";
  if (access.staff) return "/staff";
  return "/account";
}

/** Does this actor hold a seat-consuming (manager-tier) role? */
export function isManagerTier(actor: Pick<Actor, "roles">): boolean {
  return actor.roles.some((r) => r.occupiesManagerSeat);
}

/** Sorted, serialisable list of permission keys for client-side UI hints. */
export function permissionKeys(actor: HasPermissions): PermissionKey[] {
  return (Object.keys(actor.permissions) as PermissionKey[]).sort();
}
