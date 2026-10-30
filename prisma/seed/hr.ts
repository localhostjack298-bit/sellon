/**
 * HR seed: date-specific shifts, leave requests, ~35 days of attendance and two payroll periods.
 * All figures are fictional. Dates are generated relative to "today" so the demo always looks current.
 */
import type { PrismaClient } from "@/generated/prisma/client";
import {
  BUSINESS_TZ, addDays, dateOnlyToDate, dayOf, endOfMonth, eachDay, startOfMonth, todayISO, weekdayOf, zonedToDate, hhmmToMinutes,
} from "@/lib/dates";
import { seededRandom } from "@/lib/utils";
import { MANAGERS, STYLISTS, type StaffSeed } from "./data/people";
import type { PeopleResult } from "./people";
import { paiseToString } from "@/lib/money";

const STAFF = [...MANAGERS, ...STYLISTS];
const ATTENDANCE_STAFF = STAFF.filter((s) => s.key !== "neha"); // Neha is an inactive standby manager

function workWindow(person: StaffSeed, weekday: number) {
  if (!person.weekly.days.includes(weekday)) return null;
  return {
    start: weekday === 7 && person.weekly.sundayStart ? person.weekly.sundayStart : person.weekly.start,
    end: weekday === 7 && person.weekly.sundayEnd ? person.weekly.sundayEnd : person.weekly.end,
  };
}

function nextWeekday(fromISO: string, weekday: number, minOffset = 1): string {
  let d = addDays(fromISO, minOffset);
  while (weekdayOf(d) !== weekday) d = addDays(d, 1);
  return d;
}

/* ── Shifts & leave ─────────────────────────────────────────────────────────────────────── */

export async function seedShiftsAndLeave(prisma: PrismaClient, people: PeopleResult, branchId: string, adminUserId: string) {
  const today = todayISO();
  const emp = (key: StaffSeed["key"]) => people.employeeId.get(key)!;

  await prisma.shift.deleteMany({ where: { createdById: "seed" } });
  const shifts: { key: StaffSeed["key"]; date: string; type: "OFF" | "EXTRA" | "EVENING" | "MORNING"; start: string; end: string; notes: string }[] = [
    { key: "zoya", date: nextWeekday(today, 4, 6), type: "OFF", start: "10:00", end: "19:00", notes: "Personal day (approved)" },
    { key: "dev", date: nextWeekday(today, 2, 2), type: "EXTRA", start: "10:00", end: "16:00", notes: "Extra treatment day" },
    { key: "aarav", date: nextWeekday(today, 7, 2), type: "EXTRA", start: "11:00", end: "17:00", notes: "Sunday family-cuts cover" },
    { key: "kabir", date: nextWeekday(today, 5, 2), type: "EVENING", start: "12:00", end: "20:00", notes: "Evening cover" },
    { key: "rohan", date: nextWeekday(today, 3, 3), type: "MORNING", start: "10:00", end: "16:00", notes: "Early finish" },
  ];
  for (const s of shifts) {
    await prisma.shift.create({
      data: {
        employeeId: emp(s.key), branchId, date: dateOnlyToDate(s.date), startTime: s.start, endTime: s.end, type: s.type, notes: s.notes, createdById: "seed",
      },
    });
  }

  // ── leave requests ────────────────────────────────────────────────────────
  await prisma.leaveRequest.deleteMany({ where: { employee: { userId: { in: [...people.userIdByStaff.values()] } } } });

  const L = (key: StaffSeed["key"], type: "CASUAL" | "SICK" | "ANNUAL" | "UNPAID", from: number, to: number, status: "PENDING" | "APPROVED" | "REJECTED", reason: string, note?: string) => ({
    employeeId: emp(key),
    type,
    startDate: dateOnlyToDate(addDays(today, from)),
    endDate: dateOnlyToDate(addDays(today, to)),
    reason,
    status,
    decidedById: status === "PENDING" ? null : people.userIdByStaff.get("priya"),
    decidedAt: status === "PENDING" ? null : new Date(Date.now() - Math.abs(Math.min(from, -1)) * 3_600_000 * 6),
    decisionNote: note ?? null,
  });

  await prisma.leaveRequest.createMany({
    data: [
      L("meera", "ANNUAL", 9, 11, "APPROVED", "Family trip (sample request)", "Enjoy — bookings for those days are blocked."),
      L("kabir", "SICK", -12, -11, "APPROVED", "Fever (sample request)"),
      L("ishita", "ANNUAL", -20, -18, "APPROVED", "Cousin's wedding (sample request)"),
      L("ananya", "CASUAL", -5, -5, "APPROVED", "Personal errand (sample request)"),
      L("karan", "ANNUAL", 25, 27, "APPROVED", "Holiday (sample request)"),
      L("rohan", "SICK", -8, -8, "REJECTED", "Back pain (sample request)", "Please attach a doctor's note and resubmit."),
      L("zoya", "CASUAL", 15, 16, "PENDING", "Sister's engagement (sample request)"),
      L("aarav", "CASUAL", 20, 20, "PENDING", "Passport appointment (sample request)"),
      L("dev", "UNPAID", 6, 6, "PENDING", "Personal commitment (sample request)"),
      L("priya", "ANNUAL", 40, 44, "PENDING", "Planned holiday (sample request)"),
    ],
  });
  void adminUserId;
}

/* ── Attendance ─────────────────────────────────────────────────────────────────────────── */

export async function seedAttendance(prisma: PrismaClient, people: PeopleResult, branchId: string) {
  const rng = seededRandom(7_001);
  const today = todayISO();
  const nowMs = Date.now();
  const from = addDays(today, -34);

  const employeeIds = ATTENDANCE_STAFF.map((s) => people.employeeId.get(s.key)!);
  await prisma.attendance.deleteMany({ where: { employeeId: { in: employeeIds }, date: { gte: dateOnlyToDate(from) } } });

  const leaves = await prisma.leaveRequest.findMany({ where: { status: "APPROVED", employeeId: { in: employeeIds } } });
  const onLeave = (employeeId: string, date: string) =>
    leaves.some((l) => l.employeeId === employeeId && l.startDate.toISOString().slice(0, 10) <= date && date <= l.endDate.toISOString().slice(0, 10));

  const rows: {
    employeeId: string; branchId: string; date: Date; status: "PRESENT" | "LATE" | "HALF_DAY" | "ABSENT" | "LEAVE";
    checkInAt: Date | null; checkOutAt: Date | null; lateMinutes: number; source: "SELF_CHECK_IN" | "MANAGER"; note: string | null;
  }[] = [];

  for (const person of ATTENDANCE_STAFF) {
    const employeeId = people.employeeId.get(person.key)!;
    for (const date of eachDay(from, today)) {
      const win = workWindow(person, weekdayOf(date));
      if (!win) continue;
      const isToday = date === today;

      if (onLeave(employeeId, date)) {
        rows.push({ employeeId, branchId, date: dateOnlyToDate(date), status: "LEAVE", checkInAt: null, checkOutAt: null, lateMinutes: 0, source: "MANAGER", note: "Approved leave" });
        continue;
      }
      // Demo story: Aarav and Kabir have not checked in today (so check-in can be demonstrated live).
      if (isToday && (person.key === "aarav" || person.key === "kabir")) continue;

      const shiftStart = zonedToDate(date, win.start, BUSINESS_TZ).getTime();
      const shiftEnd = zonedToDate(date, win.end, BUSINESS_TZ).getTime();
      if (isToday && nowMs < shiftStart) continue; // shift hasn't begun yet

      const roll = rng();
      let status: "PRESENT" | "LATE" | "HALF_DAY" | "ABSENT" = "PRESENT";
      if (!isToday) status = roll < 0.04 ? "ABSENT" : roll < 0.09 ? "HALF_DAY" : roll < 0.2 ? "LATE" : "PRESENT";
      else status = roll < 0.15 ? "LATE" : "PRESENT";

      if (status === "ABSENT") {
        rows.push({ employeeId, branchId, date: dateOnlyToDate(date), status, checkInAt: null, checkOutAt: null, lateMinutes: 0, source: "MANAGER", note: rng() < 0.5 ? "Informed manager in advance" : "No prior notice" });
        continue;
      }

      const lateMinutes = status === "LATE" ? 8 + Math.floor(rng() * 38) : 0;
      const checkInAt = new Date(shiftStart + (status === "LATE" ? lateMinutes : Math.floor(rng() * 16) - 12) * 60_000);
      let checkOutAt: Date | null = status === "HALF_DAY"
        ? new Date(shiftStart + 4 * 3_600_000)
        : new Date(shiftEnd + (Math.floor(rng() * 40) - 8) * 60_000);
      if (isToday && checkOutAt.getTime() > nowMs) checkOutAt = null;

      rows.push({
        employeeId, branchId, date: dateOnlyToDate(date), status, checkInAt, checkOutAt, lateMinutes,
        source: rng() < 0.82 ? "SELF_CHECK_IN" : "MANAGER",
        note: status === "LATE" ? "Traffic delay" : status === "HALF_DAY" ? "Left early — approved" : null,
      });
    }
  }
  await prisma.attendance.createMany({ data: rows, skipDuplicates: true });
  return rows.length;
}

/* ── Payroll ────────────────────────────────────────────────────────────────────────────── */

const toPaise = (n: number) => Math.round(n * 100);

export async function seedPayroll(prisma: PrismaClient, people: PeopleResult) {
  const rng = seededRandom(9_113);
  const today = todayISO();
  const thisMonth = startOfMonth(today);
  const prevMonth = startOfMonth(addDays(thisMonth, -1));

  await prisma.payrollPeriod.deleteMany({ where: { OR: [{ startDate: dateOnlyToDate(thisMonth) }, { startDate: dateOnlyToDate(prevMonth) }] } });

  const staff = ATTENDANCE_STAFF;
  const attendance = await prisma.attendance.findMany({
    where: { employeeId: { in: staff.map((s) => people.employeeId.get(s.key)!) }, date: { gte: dateOnlyToDate(thisMonth) } },
  });

  for (const monthStart of [prevMonth, thisMonth]) {
    const monthEnd = endOfMonth(monthStart);
    const [year, month] = monthStart.split("-").map(Number);
    const isCurrent = monthStart === thisMonth;
    const period = await prisma.payrollPeriod.create({
      data: { year, month, startDate: dateOnlyToDate(monthStart), endDate: dateOnlyToDate(monthEnd), status: isCurrent ? "OPEN" : "CLOSED" },
    });

    for (const [idx, person] of staff.entries()) {
      const employeeId = people.employeeId.get(person.key)!;
      const base = toPaise(person.baseSalary);
      const allowance = toPaise(person.fixedAllowance);

      const scheduledDays = eachDay(monthStart, monthEnd).filter((d) => person.weekly.days.includes(weekdayOf(d))).length;
      let presentDays = scheduledDays;
      let absentDays = 0;
      if (isCurrent) {
        const mine = attendance.filter((a) => a.employeeId === employeeId);
        presentDays = mine.reduce((acc, a) => acc + (a.status === "PRESENT" || a.status === "LATE" ? 1 : a.status === "HALF_DAY" ? 0.5 : 0), 0);
        absentDays = mine.filter((a) => a.status === "ABSENT").length;
      } else {
        absentDays = rng() < 0.3 ? 1 + Math.floor(rng() * 2) : 0;
        presentDays = scheduledDays - absentDays;
      }

      const adjustments: { type: "ALLOWANCE" | "BONUS" | "DEDUCTION"; source: "MANUAL" | "ATTENDANCE"; label: string; amount: number }[] = [];
      if (allowance > 0) adjustments.push({ type: "ALLOWANCE", source: "MANUAL", label: "Fixed allowance", amount: allowance });

      if (rng() < (isCurrent ? 0.2 : 0.4) && person.bookable) {
        adjustments.push({ type: "BONUS", source: "MANUAL", label: "Performance bonus (sample)", amount: toPaise(2000 + Math.floor(rng() * 4) * 500) });
      }
      if (absentDays > 0) {
        const perDay = Math.round(base / 26 / 100) * 100;
        adjustments.push({ type: "DEDUCTION", source: "ATTENDANCE", label: `Absent days (${absentDays} × ₹${perDay / 100})`, amount: perDay * absentDays });
      }
      if (idx % 5 === 3) adjustments.push({ type: "DEDUCTION", source: "MANUAL", label: "Salary advance recovery (sample)", amount: toPaise(3000) });

      const sumOf = (t: "ALLOWANCE" | "BONUS" | "DEDUCTION") => adjustments.filter((a) => a.type === t).reduce((acc, a) => acc + a.amount, 0);
      const allowances = sumOf("ALLOWANCE");
      const bonuses = sumOf("BONUS");
      const deductions = sumOf("DEDUCTION");
      const net = base + allowances + bonuses - deductions;

      // statuses: previous month mostly PAID (two REVIEWED), current month mostly PENDING (three REVIEWED)
      const status = isCurrent ? (idx % 4 === 1 ? "REVIEWED" : "PENDING") : idx % 5 === 4 ? "REVIEWED" : "PAID";
      const decidedAt = new Date(Date.now() - (isCurrent ? 2 : 20) * 86_400_000);

      await prisma.salaryRecord.create({
        data: {
          periodId: period.id,
          employeeId,
          baseSalary: paiseToString(base),
          allowances: paiseToString(allowances),
          bonuses: paiseToString(bonuses),
          deductions: paiseToString(deductions),
          netPayable: paiseToString(net),
          workingDays: scheduledDays,
          presentDays: presentDays.toFixed(1),
          absentDays: absentDays.toFixed(1),
          status,
          note: "Fictional demo payroll — no real payment is made.",
          reviewedById: status !== "PENDING" ? people.userIdByStaff.get("priya") : null,
          reviewedAt: status !== "PENDING" ? decidedAt : null,
          paidMarkedAt: status === "PAID" ? decidedAt : null,
          adjustments: {
            create: adjustments.map((a) => ({ type: a.type, source: a.source, label: a.label, amount: paiseToString(a.amount), createdById: "seed" })),
          },
        },
      });
    }
  }
}

export const _internal = { dayOf, hhmmToMinutes };
