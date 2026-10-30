/**
 * Stellar Family Salon — database seed.
 *
 *   npm run db:seed            full demo dataset (idempotent; regenerates transactional data relative to today)
 *   npm run db:seed:core       permissions, roles, branch/hours/policy, settings and the first Super Admin only
 *
 * Safe to run repeatedly. Refuses to run against NODE_ENV=production unless SEED_ALLOW_PRODUCTION=true.
 * Demo credentials come from DEMO_PASSWORD (never hard-coded).
 */
import "dotenv/config";
import { prisma } from "@/lib/prisma/client";
import { DEMO_ACCOUNTS } from "@/config/demo-accounts";
import { seedBranch, seedContent, seedMedia, seedRoles, seedSettings, syncPermissions, hashDemoPassword, upsertLoginUser, setUserRoles } from "./seed/core";
import { seedCatalogue, seedStaffServices } from "./seed/catalogue";
import { seedPeople } from "./seed/people";
import { seedShiftsAndLeave, seedAttendance, seedPayroll } from "./seed/hr";
import { seedBookings } from "./seed/bookings";
import { seedAuditNotes, seedEnquiries, seedGallery, seedNotifications, seedOffers } from "./seed/misc";
import { SUPER_ADMIN } from "./seed/data/people";

async function main() {
  const coreOnly = process.argv.includes("--core-only");
  const started = Date.now();

  if (process.env.NODE_ENV === "production" && process.env.SEED_ALLOW_PRODUCTION !== "true") {
    throw new Error("Refusing to seed demo data with NODE_ENV=production. Set SEED_ALLOW_PRODUCTION=true if you really mean it.");
  }
  const password = process.env.DEMO_PASSWORD ?? process.env.SEED_ADMIN_PASSWORD;
  if (!password || password.length < 8) throw new Error("Set DEMO_PASSWORD (min 8 chars) in your environment before seeding.");
  const log = (msg: string) => console.log(`  • ${msg}`);

  console.log(coreOnly ? "Seeding core data…" : "Seeding Stellar Family Salon demo data…");
  const passwordHash = await hashDemoPassword(password);

  const perms = await syncPermissions(prisma);
  log(`permission registry: ${perms.synced} synced, ${perms.removed} retired`);
  const roleIds = await seedRoles(prisma, { resetRoles: !coreOnly });
  log(`roles: ${roleIds.size}`);
  const branch = await seedBranch(prisma);
  await seedSettings(prisma, { resetSeatLimit: !coreOnly });
  log(`branch, hours, booking policy, resources, settings`);
  await seedMedia(prisma);
  await seedContent(prisma);
  log(`media library + website content blocks`);

  if (coreOnly) {
    const adminEmail = process.env.SEED_ADMIN_EMAIL ?? SUPER_ADMIN.email;
    const admin = await upsertLoginUser(prisma, { name: process.env.SEED_ADMIN_NAME ?? SUPER_ADMIN.name, email: adminEmail, passwordHash });
    await setUserRoles(prisma, admin.id, [roleIds.get("super_admin")!]);
    log(`super admin: ${adminEmail}`);
    await seedAuditNotes(prisma, "Core data seeded (permissions, roles, branch, settings, super admin)");
    console.log(`Done in ${((Date.now() - started) / 1000).toFixed(1)}s`);
    return;
  }

  const { categoryId, serviceId } = await seedCatalogue(prisma);
  log(`catalogue: ${categoryId.size} categories, ${serviceId.size} services`);

  const people = await seedPeople(prisma, { roleIds, branchId: branch.id, passwordHash });
  log(`people: 1 super admin, 3 managers, 8 employees, ${people.customerId.length} customers`);
  const links = await seedStaffServices(prisma, serviceId, people.employeeId as never);
  log(`service eligibility rows: ${links}`);

  await seedOffers(prisma, { categoryId, serviceId, adminUserId: people.superAdminUserId });
  await seedShiftsAndLeave(prisma, people, branch.id, people.superAdminUserId);
  log(`offers (5), shift overrides, leave requests`);

  const bookings = await seedBookings(prisma, { people, branchId: branch.id, adminUserId: people.superAdminUserId });
  log(`bookings: ${bookings.total} (${Object.entries(bookings.byStatus).map(([k, v]) => `${k.toLowerCase()} ${v}`).join(", ")})`);

  const attendanceRows = await seedAttendance(prisma, people, branch.id);
  await seedPayroll(prisma, people);
  log(`attendance rows: ${attendanceRows}; payroll periods: 2`);

  await seedGallery(prisma);
  await seedEnquiries(prisma, people, branch.id);
  await seedNotifications(prisma, people);
  await seedAuditNotes(prisma, "Full demo dataset generated relative to today (idempotent seed)");
  log(`gallery, enquiries, notifications`);

  console.log("\nDemo accounts (password = DEMO_PASSWORD):");
  for (const a of DEMO_ACCOUNTS) console.log(`  ${a.label.padEnd(30)} ${a.email}`);
  console.log(`\nDone in ${((Date.now() - started) / 1000).toFixed(1)}s`);
}

main()
  .catch((error) => {
    console.error("\nSeed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
