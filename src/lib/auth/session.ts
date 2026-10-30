/**
 * Request-scoped identity: who is calling, which roles they hold and what they may do *right now*.
 *
 * `getActor()` re-reads roles and permission grants from PostgreSQL on every request (memoised per
 * request with React `cache`). There is deliberately NO cross-request cache, so a Super Admin editing a
 * role is reflected on the next request of every live session — no re-login needed.
 */
import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma/client";
import { resolveEffectivePermissions, type Actor, type RoleGrantInput } from "@/lib/permissions/engine";
import type { PermissionScope } from "@/config/permissions";

export const getActor = cache(async (): Promise<Actor | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      status: true,
      employee: { select: { id: true, branchId: true } },
      customer: { select: { id: true } },
      roles: {
        select: {
          role: {
            select: {
              id: true,
              key: true,
              name: true,
              audience: true,
              isActive: true,
              isProtected: true,
              occupiesManagerSeat: true,
              permissions: { select: { scope: true, permission: { select: { key: true } } } },
            },
          },
        },
      },
    },
  });

  // Suspended / inactive users lose access immediately, even with a still-valid session cookie.
  if (!user || user.status !== "ACTIVE") return null;

  const roleInputs: RoleGrantInput[] = user.roles.map(({ role }) => ({
    role: {
      id: role.id,
      key: role.key,
      name: role.name,
      audience: role.audience,
      occupiesManagerSeat: role.occupiesManagerSeat,
      isActive: role.isActive,
      isProtected: role.isProtected,
    },
    grants: role.permissions.map((p) => ({ key: p.permission.key, scope: p.scope as PermissionScope })),
  }));

  const { permissions, isSuperAdmin } = resolveEffectivePermissions(roleInputs);

  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    roles: roleInputs.filter((r) => r.role.isActive).map(({ role }) => ({
      id: role.id,
      key: role.key,
      name: role.name,
      audience: role.audience,
      occupiesManagerSeat: role.occupiesManagerSeat,
    })),
    permissions,
    isSuperAdmin,
    employeeId: user.employee?.id ?? null,
    branchId: user.employee?.branchId ?? null,
    customerId: user.customer?.id ?? null,
  };
});

/** The pathname of the current request (set by `proxy.ts`). */
export async function getRequestPath(): Promise<string> {
  return (await headers()).get("x-pathname") ?? "/";
}

/** Require a signed-in, active user; otherwise bounce to /login and come back afterwards. */
export async function requireActor(): Promise<Actor> {
  const actor = await getActor();
  if (!actor) {
    const path = await getRequestPath();
    redirect(`/login?next=${encodeURIComponent(path)}`);
  }
  return actor;
}
