"use server";
import { prisma } from "@/lib/prisma/client";
import { computeSlotsForDate, validateSlot, type StaffSchedule, type ResourceTypeKey } from "@/features/booking/availability";
import { BUSINESS_TZ, addDays, dayOf, diffDays, todayISO, zonedToDate } from "@/lib/dates";

export interface SlotSummary {
  time: string;
  startsAt: string; // ISO
  endsAt: string;   // ISO
  blockedUntil: string; // ISO
  staffIds: string[];
}

interface ScheduleInput {
  staffId: string;
  weekly: { weekday: number; start: string; end: string }[];
  breaks: { weekday?: number | null; date?: string | null; start: string; end: string }[];
  shifts: { date: string; start: string; end: string; type: "REGULAR" | "MORNING" | "EVENING" | "EXTRA" | "OFF" }[];
  leaves: { startDate: string; endDate: string }[];
}

/** Server-side availability: slots for a date, optionally scoped to services and a stylist. */
export async function getSlotsForDate(input: {
  date: string;
  serviceIds: string[];
  staffId?: string | null;
}): Promise<{ slots: SlotSummary[]; error?: string }> {
  const branch = await prisma.salonBranch.findFirst({ where: { isPrimary: true } });
  if (!branch) return { slots: [], error: "The salon is not configured yet." };
  const policy = await prisma.bookingPolicy.findUnique({ where: { branchId: branch.id } });
  if (!policy) return { slots: [], error: "Booking policies are not configured yet." };

  const today = todayISO();
  if (diffDays(today, input.date) < 0 || diffDays(today, input.date) > policy.maxAdvanceDays) {
    return { slots: [], error: "That date is outside the booking window." };
  }

  const services = await prisma.service.findMany({
    where: { id: { in: input.serviceIds }, isActive: true },
  });
  if (services.length !== input.serviceIds.length) {
    return { slots: [], error: "One or more services are no longer available." };
  }
  const durationMinutes = services.reduce((a, s) => a + s.durationMinutes, 0);

  const hoursRows = await prisma.businessHours.findMany({ where: { branchId: branch.id } });
  const hours: Record<number, { open: string; close: string; closed: boolean } | undefined> = Object.fromEntries(
    hoursRows.map((h) => [h.weekday, { open: h.opensAt, close: h.closesAt, closed: h.isClosed }]),
  );

  const staff = await prisma.employeeProfile.findMany({
    where: { branchId: branch.id, isBookable: true, employmentStatus: "ACTIVE", user: { status: "ACTIVE" } },
    include: {
      availability: { where: { isActive: true } },
      breaks: true,
      shifts: true,
      leaveRequests: { where: { status: "APPROVED" } },
      services: { include: { service: true } },
    },
  });

  // staff qualified for ALL selected services
  const serviceIdSet = new Set(input.serviceIds);
  const eligible = staff.filter((e) => {
    const qualified = new Set(e.services.map((s) => s.serviceId));
    return [...serviceIdSet].every((sid) => qualified.has(sid));
  });
  if (input.staffId && !eligible.some((e) => e.id === input.staffId)) {
    return { slots: [], error: "That stylist is not qualified for the selected services." };
  }

  const schedules: StaffSchedule[] = eligible.map((e) => ({
    staffId: e.id,
    weekly: e.availability.map((a) => ({ weekday: a.weekday, start: a.startTime, end: a.endTime })),
    breaks: e.breaks.map((b) => ({ weekday: b.weekday, date: b.date ? dayOf(b.date) : null, start: b.startTime, end: b.endTime })),
    shifts: e.shifts.map((s) => ({ date: dayOf(s.date), start: s.startTime, end: s.endTime, type: s.type })),
    leaves: e.leaveRequests.map((l) => ({ startDate: dayOf(l.startDate), endDate: dayOf(l.endDate) })),
  }));

  const resources = (await prisma.resource.findMany({ where: { branchId: branch.id, isActive: true } })).map((r) => ({ id: r.id, type: r.type }));
  const requiredResources = [...new Set(services.map((s) => s.requiredResource).filter((r): r is ResourceTypeKey => Boolean(r)))] as ResourceTypeKey[];

  const existingBookings = await prisma.booking.findMany({
    where: { branchId: branch.id, status: { in: ["PENDING", "CONFIRMED", "CHECKED_IN", "IN_PROGRESS"] } },
    include: { resources: true },
  });
  const busy = existingBookings.map((b) => ({ staffId: b.staffId, start: b.startsAt.getTime(), end: b.blockedUntil.getTime() }));
  const resourceBusy = existingBookings.flatMap((b) =>
    b.resources.map((r) => ({ resourceId: r.resourceId, start: r.startsAt.getTime(), end: r.blockedUntil.getTime() })),
  );

  const slots = computeSlotsForDate(
    {
      now: Date.now(),
    hours,
    policy: {
      slotIntervalMinutes: policy.slotIntervalMinutes,
      bufferMinutes: policy.bufferMinutes,
      minLeadTimeMinutes: policy.minLeadTimeMinutes,
      maxAdvanceDays: policy.maxAdvanceDays,
    },
    staff: schedules,
    busy,
    resources,
    resourceBusy,
    requiredResources,
    durationMinutes,
    },
    input.date,
  );

  const staffFilter = input.staffId ? new Set([input.staffId]) : null;
  return {
    slots: slots
      .filter((s) => !staffFilter || staffFilter!.has(s.staffIds[0]!))
      .map((s) => ({
        time: s.time,
        startsAt: s.startsAt.toISOString(),
        endsAt: s.endsAt.toISOString(),
        blockedUntil: s.blockedUntil.toISOString(),
        staffIds: s.staffIds,
      })),
  };
}

/** Strict re-validation of a single slot (called inside the booking transaction). */
export async function revalidateSlot(input: {
  date: string;
  time: string;
  staffId: string;
  serviceIds: string[];
}): Promise<{ ok: true; startsAt: string; endsAt: string; blockedUntil: string; staffId: string } | { ok: false; reason: string }> {
  const branch = await prisma.salonBranch.findFirst({ where: { isPrimary: true } });
  if (!branch) return { ok: false, reason: "The salon is not configured yet." };
  const policy = await prisma.bookingPolicy.findUnique({ where: { branchId: branch.id } });
  if (!policy) return { ok: false, reason: "Booking policies are not configured yet." };

  const services = await prisma.service.findMany({ where: { id: { in: input.serviceIds }, isActive: true } });
  const durationMinutes = services.reduce((a, s) => a + s.durationMinutes, 0);

  const hoursRows = await prisma.businessHours.findMany({ where: { branchId: branch.id } });
  const hours: Record<number, { open: string; close: string; closed: boolean } | undefined> = Object.fromEntries(
    hoursRows.map((h) => [h.weekday, { open: h.opensAt, close: h.closesAt, closed: h.isClosed }]),
  );

  const staff = await prisma.employeeProfile.findUnique({
    where: { id: input.staffId },
    include: { availability: { where: { isActive: true } }, breaks: true, shifts: true, leaveRequests: { where: { status: "APPROVED" } } },
  });
  if (!staff) return { ok: false, reason: "Stylist not found." };

  const existingBookings = await prisma.booking.findMany({
    where: { branchId: branch.id, status: { in: ["PENDING", "CONFIRMED", "CHECKED_IN", "IN_PROGRESS"] }, staffId: input.staffId },
    include: { resources: true },
  });
  const busy = existingBookings.map((b) => ({ staffId: b.staffId, start: b.startsAt.getTime(), end: b.blockedUntil.getTime() }));
  const resources = (await prisma.resource.findMany({ where: { branchId: branch.id, isActive: true } })).map((r) => ({ id: r.id, type: r.type }));
  const resourceBusy: { resourceId: string; start: number; end: number }[] = [];

  const schedules: StaffSchedule[] = [{
    staffId: staff.id,
    weekly: staff.availability.map((a) => ({ weekday: a.weekday, start: a.startTime, end: a.endTime })),
    breaks: staff.breaks.map((b) => ({ weekday: b.weekday, date: b.date ? dayOf(b.date) : null, start: b.startTime, end: b.endTime })),
    shifts: staff.shifts.map((s) => ({ date: dayOf(s.date), start: s.startTime, end: s.endTime, type: s.type })),
    leaves: staff.leaveRequests.map((l) => ({ startDate: dayOf(l.startDate), endDate: dayOf(l.endDate) })),
  }];

  const result = validateSlot(
    {
      now: Date.now(),
      hours,
      policy: {
        slotIntervalMinutes: policy.slotIntervalMinutes,
        bufferMinutes: policy.bufferMinutes,
        minLeadTimeMinutes: policy.minLeadTimeMinutes,
        maxAdvanceDays: policy.maxAdvanceDays,
      },
      staff: schedules,
      busy,
      resources,
      resourceBusy,
      requiredResources: [...new Set(services.map((s) => s.requiredResource).filter(Boolean))] as ResourceTypeKey[],
      durationMinutes,
    },
    input.date,
    input.time,
    input.staffId,
  );
  if (!result.ok) return { ok: false, reason: result.reason };
  return { ok: true, startsAt: result.slot.startsAt.toISOString(), endsAt: result.slot.endsAt.toISOString(), blockedUntil: result.slot.blockedUntil.toISOString(), staffId: input.staffId };
}
