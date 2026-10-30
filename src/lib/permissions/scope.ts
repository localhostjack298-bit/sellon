import { scopeOf, type Actor } from "@/lib/permissions/engine";
import type { PermissionKey } from "@/config/permissions";

/**
 * A neutral description of "which records this actor may see for permission X".
 * Each feature module maps it onto a Prisma where-clause, so the rule is defined
 * once and every list query applies it server-side.
 */
export type ScopeFilter =
  | { kind: "none" }
  | { kind: "all" }
  | { kind: "branch"; branchId: string }
  | { kind: "own"; employeeId: string };

export function scopeFilter(actor: Actor, key: PermissionKey): ScopeFilter {
  const scope = scopeOf(actor, key);
  if (!scope) return { kind: "none" };
  if (scope === "ALL") return { kind: "all" };
  if (scope === "BRANCH") return actor.branchId ? { kind: "branch", branchId: actor.branchId } : { kind: "none" };
  return actor.employeeId ? { kind: "own", employeeId: actor.employeeId } : { kind: "none" };
}

/** Filter for models that carry an employeeId column (attendance, leave, salary, shifts…). */
export function employeeOwnedWhere(filter: ScopeFilter) {
  switch (filter.kind) {
    case "all":
      return {};
    case "branch":
      return { employee: { branchId: filter.branchId } };
    case "own":
      return { employeeId: filter.employeeId };
    default:
      return { id: "__no_access__" };
  }
}
