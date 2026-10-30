import type { PrismaClient } from "@/generated/prisma/client";
import { dateOnlyToDate } from "@/lib/dates";
import {
  CUSTOMER_NAMES, MANAGERS, STYLISTS, SUPER_ADMIN, customerEmail, customerPhone, type StaffSeed,
} from "./data/people";
import { setUserRoles, upsertLoginUser } from "./core";
import type { StaffKey } from "./data/catalogue";

export interface PeopleResult {
  superAdminUserId: string;
  employeeId: Map<StaffSeed["key"], string>;
  userIdByStaff: Map<StaffSeed["key"], string>;
  customerId: string[]; // index-aligned with CUSTOMER_NAMES
  customerUserId: string[];
}

export async function seedPeople(
  prisma: PrismaClient,
  args: { roleIds: Map<string, string>; branchId: string; passwordHash: string },
): Promise<PeopleResult> {
  const { roleIds, branchId, passwordHash } = args;

  // ── Super Admin ────────────────────────────────────────────────────────────
  const admin = await upsertLoginUser(prisma, { ...SUPER_ADMIN, passwordHash });
  await setUserRoles(prisma, admin.id, [roleIds.get("super_admin")!]);

  // ── Staff & managers ───────────────────────────────────────────────────────
  const employeeId = new Map<StaffSeed["key"], string>();
  const userIdByStaff = new Map<StaffSeed["key"], string>();

  for (const [index, person] of [...MANAGERS, ...STYLISTS].entries()) {
    const user = await upsertLoginUser(prisma, {
      name: person.name,
      email: person.email,
      phone: person.phone,
      passwordHash,
      status: person.status ?? "ACTIVE",
    });
    await setUserRoles(prisma, user.id, [roleIds.get(person.roleKey)!]);
    userIdByStaff.set(person.key, user.id);

    const profileData = {
      branchId,
      jobTitle: person.jobTitle,
      bio: person.bio,
      specialties: person.specialties,
      skillCategories: person.skillCategories,
      languages: person.languages,
      yearsExperience: person.years,
      employmentStatus: "ACTIVE" as const,
      employmentType: person.employmentType,
      startDate: dateOnlyToDate(person.startDate),
      isBookable: person.bookable,
      isFeatured: person.featured,
      displayOrder: index,
    };
    const employee = await prisma.employeeProfile.upsert({
      where: { userId: user.id },
      create: { userId: user.id, employeeCode: person.code, ...profileData },
      update: profileData,
    });
    employeeId.set(person.key, employee.id);

    // weekly availability
    await prisma.staffAvailability.deleteMany({ where: { employeeId: employee.id } });
    await prisma.staffAvailability.createMany({
      data: person.weekly.days.map((weekday) => ({
        employeeId: employee.id,
        weekday,
        startTime: weekday === 7 && person.weekly.sundayStart ? person.weekly.sundayStart : person.weekly.start,
        endTime: weekday === 7 && person.weekly.sundayEnd ? person.weekly.sundayEnd : person.weekly.end,
      })),
    });

    // lunch break (recurring) — bookable stylists only
    await prisma.staffBreak.deleteMany({ where: { employeeId: employee.id } });
    if (person.bookable) {
      const lateStart = person.weekly.start >= "11:00";
      await prisma.staffBreak.createMany({
        data: person.weekly.days.map((weekday) => ({
          employeeId: employee.id,
          weekday,
          startTime: weekday === 7 ? "14:00" : lateStart ? "15:00" : "13:30",
          endTime: weekday === 7 ? "14:30" : lateStart ? "15:45" : "14:15",
          label: "Lunch break",
        })),
      });
    }

    await prisma.salaryStructure.upsert({
      where: { employeeId: employee.id },
      create: {
        employeeId: employee.id,
        baseSalary: person.baseSalary.toFixed(2),
        fixedAllowance: person.fixedAllowance.toFixed(2),
        effectiveFrom: dateOnlyToDate(person.startDate),
        notes: "Fictional demo salary — not real payroll data.",
      },
      update: { baseSalary: person.baseSalary.toFixed(2), fixedAllowance: person.fixedAllowance.toFixed(2) },
    });
  }

  // ── Customers ──────────────────────────────────────────────────────────────
  const customerId: string[] = [];
  const customerUserId: string[] = [];
  const customerRole = roleIds.get("customer")!;
  const hairTypes = ["straight", "wavy", "curly", "fine", "thick"];
  const skinTypes = ["dry", "combination", "oily", "sensitive", "normal"];

  for (const [i, name] of CUSTOMER_NAMES.entries()) {
    const email = customerEmail(name);
    const user = await upsertLoginUser(prisma, { name, email, phone: customerPhone(i + 1), passwordHash });
    await setUserRoles(prisma, user.id, [customerRole]);
    const profileFields = {
      userId: user.id,
      branchId,
      fullName: name,
      phone: customerPhone(i + 1),
      marketingOptIn: i % 3 === 0,
      beautyPreferences: {
        hairType: hairTypes[i % hairTypes.length],
        skinType: skinTypes[(i + 2) % skinTypes.length],
        allergies: i % 7 === 3 ? "Sensitive to strong fragrance" : "",
        preferredDays: i % 2 === 0 ? ["Sat", "Sun"] : ["Wed", "Thu"],
        preferredTime: i % 3 === 0 ? "morning" : i % 3 === 1 ? "afternoon" : "evening",
        notes: "",
      },
    };
    const profile = await prisma.customerProfile.upsert({
      where: { email },
      create: { email, ...profileFields },
      update: profileFields,
    });
    customerId.push(profile.id);
    customerUserId.push(user.id);
  }

  return { superAdminUserId: admin.id, employeeId, userIdByStaff, customerId, customerUserId };
}

export type { StaffKey };
