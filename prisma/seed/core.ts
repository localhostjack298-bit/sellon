/**
 * Core seed: permission registry sync, roles & grants, branch, hours, booking policy, resources, settings,
 * media library and website content. Safe to run repeatedly.
 */
import { hashPassword } from "better-auth/crypto";

/** Hash once per seed run; all demo accounts share DEMO_PASSWORD. */
export const hashDemoPassword = (password: string) => hashPassword(password);
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { ALL_PERMISSIONS, normalizeScope, type PermissionKey } from "@/config/permissions";
import { ROLE_SEEDS } from "@/config/default-roles";
import { LOCAL_IMAGES, brand } from "@/config/brand";
import { CONTENT_BLOCKS } from "./data/content";

export interface CoreOptions {
  /** Reset role grants to the shipped defaults (demo seed). When false, existing roles are left untouched. */
  resetRoles: boolean;
}

export async function syncPermissions(prisma: PrismaClient) {
  for (const p of ALL_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: p.key },
      create: { key: p.key, module: p.module, action: p.action, label: p.label, description: p.description },
      update: { module: p.module, action: p.action, label: p.label, description: p.description },
    });
  }
  // Retire permissions that no longer exist in the registry (their grants cascade away → default-deny).
  const keys = ALL_PERMISSIONS.map((p) => p.key);
  const removed = await prisma.permission.deleteMany({ where: { key: { notIn: keys } } });
  return { synced: keys.length, removed: removed.count };
}

export async function seedRoles(prisma: PrismaClient, opts: CoreOptions) {
  const permissionRows = await prisma.permission.findMany({ select: { id: true, key: true } });
  const permissionId = new Map(permissionRows.map((p) => [p.key, p.id]));
  const roleIds = new Map<string, string>();

  for (const seed of ROLE_SEEDS) {
    const existing = await prisma.role.findUnique({ where: { key: seed.key }, select: { id: true } });
    const role = await prisma.role.upsert({
      where: { key: seed.key },
      create: {
        key: seed.key,
        name: seed.name,
        description: seed.description,
        audience: seed.audience,
        isSystem: seed.isSystem,
        isProtected: seed.isProtected,
        occupiesManagerSeat: seed.occupiesManagerSeat,
      },
      update: opts.resetRoles || !existing
        ? {
            name: seed.name,
            description: seed.description,
            audience: seed.audience,
            isSystem: seed.isSystem,
            isProtected: seed.isProtected,
            occupiesManagerSeat: seed.occupiesManagerSeat,
            isActive: true,
          }
        : {},
    });
    roleIds.set(seed.key, role.id);

    // Only (re)write grants for brand-new roles, or when a demo reset was requested.
    if (existing && !opts.resetRoles) continue;

    const grants: { permissionId: string; scope: "OWN" | "BRANCH" | "ALL" }[] = [];
    if (seed.permissions === "ALL") {
      for (const p of ALL_PERMISSIONS) grants.push({ permissionId: permissionId.get(p.key)!, scope: "ALL" });
    } else {
      for (const [key, scope] of Object.entries(seed.permissions) as [PermissionKey, "OWN" | "BRANCH" | "ALL"][]) {
        const id = permissionId.get(key);
        if (!id) throw new Error(`Default role "${seed.key}" references unknown permission ${key}`);
        grants.push({ permissionId: id, scope: normalizeScope(key, scope) });
      }
    }
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    if (grants.length) await prisma.rolePermission.createMany({ data: grants.map((g) => ({ roleId: role.id, ...g })) });
  }
  return roleIds;
}

export async function seedBranch(prisma: PrismaClient) {
  const branch = await prisma.salonBranch.upsert({
    where: { slug: "stellar-main" },
    create: {
      slug: "stellar-main",
      name: "Stellar Family Salon — Main Studio",
      tagline: "Hair · Skin · Nails · Grooming",
      description: "Sample branch details — edit under Admin → Branches & business info.",
      phone: "+91 90000 00000",
      whatsapp: "+91 90000 00000",
      email: "hello@stellar-demo.example",
      addressLine1: "Demo address — 12 Sample Street",
      addressLine2: "Replace with the salon's real address",
      city: "Your City",
      state: "Your State",
      postalCode: "000000",
      mapUrl: null,
      instagramUrl: brand.social.instagramUrl,
      facebookUrl: null,
      isPrimary: true,
    },
    update: {},
  });

  // Closed Mondays; Tue–Sat 10:00–20:00; Sun 11:00–18:00.
  const hours = [
    { weekday: 1, opensAt: "10:00", closesAt: "20:00", isClosed: true },
    { weekday: 2, opensAt: "10:00", closesAt: "20:00", isClosed: false },
    { weekday: 3, opensAt: "10:00", closesAt: "20:00", isClosed: false },
    { weekday: 4, opensAt: "10:00", closesAt: "20:00", isClosed: false },
    { weekday: 5, opensAt: "10:00", closesAt: "20:00", isClosed: false },
    { weekday: 6, opensAt: "10:00", closesAt: "20:00", isClosed: false },
    { weekday: 7, opensAt: "11:00", closesAt: "18:00", isClosed: false },
  ];
  for (const h of hours) {
    await prisma.businessHours.upsert({
      where: { branchId_weekday: { branchId: branch.id, weekday: h.weekday } },
      create: { branchId: branch.id, ...h },
      update: {},
    });
  }

  await prisma.bookingPolicy.upsert({
    where: { branchId: branch.id },
    create: {
      branchId: branch.id,
      slotIntervalMinutes: 15,
      bufferMinutes: 10,
      minLeadTimeMinutes: 120,
      maxAdvanceDays: 45,
      maxBookingMinutes: 360,
      cancellationWindowHours: 4,
      rescheduleWindowHours: 6,
      maxReschedules: 2,
      autoConfirmOnline: true,
      cancellationPolicyText:
        "You can cancel or reschedule online up to 4 hours before your appointment (rescheduling up to 6 hours, twice per booking). Inside that window, please call the salon so we can help.",
      noShowPolicyText: "Appointments missed without notice are recorded as no-shows. Repeated no-shows may require a call to confirm future bookings.",
      paymentNote: "Payment is taken at the salon after your service — cash, UPI or card at the desk. No online payment is collected.",
    },
    update: {},
  });

  const resources: { name: string; type: "STYLING_STATION" | "COLOUR_BAR" | "FACIAL_ROOM" | "NAIL_BAR" | "BRIDAL_SUITE" }[] = [
    { name: "Colour Bar 1", type: "COLOUR_BAR" },
    { name: "Colour Bar 2", type: "COLOUR_BAR" },
    { name: "Facial Room 1", type: "FACIAL_ROOM" },
    { name: "Facial Room 2", type: "FACIAL_ROOM" },
    { name: "Nail Bar 1", type: "NAIL_BAR" },
    { name: "Nail Bar 2", type: "NAIL_BAR" },
    { name: "Bridal Suite", type: "BRIDAL_SUITE" },
  ];
  for (const r of resources) {
    const found = await prisma.resource.findFirst({ where: { branchId: branch.id, name: r.name } });
    if (!found) await prisma.resource.create({ data: { branchId: branch.id, ...r } });
  }

  return branch;
}

export async function seedSettings(prisma: PrismaClient, opts: { resetSeatLimit: boolean }) {
  const existing = await prisma.appSetting.findUnique({ where: { key: "manager.seatLimit" } });
  if (!existing || opts.resetSeatLimit) {
    await prisma.appSetting.upsert({
      where: { key: "manager.seatLimit" },
      create: { key: "manager.seatLimit", value: 2, description: "Maximum number of ACTIVE users that may hold a manager-tier role." },
      update: { value: 2 },
    });
  }
}

export const mediaId = (key: string) => `media_${key}`;

export async function seedMedia(prisma: PrismaClient) {
  for (const [key, img] of Object.entries(LOCAL_IMAGES)) {
    await prisma.mediaAsset.upsert({
      where: { id: mediaId(key) },
      create: {
        id: mediaId(key),
        kind: "PHOTO",
        url: img.url,
        storage: "local",
        alt: img.alt,
        credit: "AI-generated demo imagery — replace with real photography",
        isDemoPlaceholder: true,
        width: img.w,
        height: img.h,
        mimeType: "image/jpeg",
      },
      update: { url: img.url, alt: img.alt, width: img.w, height: img.h },
    });
  }
}

export async function seedContent(prisma: PrismaClient) {
  for (const block of CONTENT_BLOCKS) {
    await prisma.websiteContent.upsert({
      where: { key: block.key },
      create: { key: block.key, title: block.title, published: block.value as unknown as Prisma.InputJsonValue, publishedAt: new Date() },
      update: { title: block.title, published: block.value as unknown as Prisma.InputJsonValue, draft: { null: true } },
    });
  }
}

/** Create (or update) a credential-based login the way Better Auth stores it. */
export async function upsertLoginUser(
  prisma: PrismaClient,
  input: { name: string; email: string; passwordHash: string; phone?: string; status?: "ACTIVE" | "INACTIVE" | "SUSPENDED" },
) {
  const email = input.email.toLowerCase();
  const user = await prisma.user.upsert({
    where: { email },
    create: { name: input.name, email, emailVerified: true, phone: input.phone, status: input.status ?? "ACTIVE" },
    update: { name: input.name, phone: input.phone, status: input.status ?? "ACTIVE", statusReason: null },
  });
  const hash = input.passwordHash;
  const account = await prisma.account.findFirst({ where: { userId: user.id, providerId: "credential" } });
  if (account) await prisma.account.update({ where: { id: account.id }, data: { password: hash, accountId: user.id } });
  else await prisma.account.create({ data: { userId: user.id, providerId: "credential", accountId: user.id, password: hash } });
  return user;
}

export async function setUserRoles(prisma: PrismaClient, userId: string, roleIds: string[]) {
  await prisma.userRole.deleteMany({ where: { userId } });
  await prisma.userRole.createMany({ data: roleIds.map((roleId) => ({ userId, roleId })) });
}
