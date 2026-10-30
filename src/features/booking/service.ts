"use server";
import { z } from "zod";
import { generateRandomString } from "better-auth/crypto";
import { authedAction, publicAction, type ActionResult } from "@/lib/actions/define";
import { getActor } from "@/lib/auth/session";
import { assertCan, assertAuthenticated } from "@/lib/permissions/assert";
import { scopeFilter } from "@/lib/permissions/scope";
import { prisma, Prisma, isExclusionViolation } from "@/lib/prisma/client";
import {
  computeSlotsForDate,
  validateSlot,
  type BusyBlock,
  type ResourceBusy,
  type ResourceTypeKey,
  type Slot,
} from "@/features/booking/availability";
import { computeDiscountPaise } from "@/features/offers/pricing";
import { ACTIVE_STATUSES, generateReference, type BookingStatusKey } from "@/features/booking/policy";
import { toNumber, paiseToString } from "@/lib/money";
import { BUSINESS_TZ, dayOf, diffDays, hhmmToMinutes, todayISO, zonedToDate } from "@/lib/dates";
import { writeAudit } from "@/features/audit/audit";
import { recordAccessDenied } from "@/features/audit/audit";
import {
  BookingCancelSchema,
  BookingCheckInSchema,
  BookingConfirmSchema,
  BookingDetailsSchema,
  BookingRescheduleSchema,
  BookingServiceSelectionSchema,
  BookingSlotSelectionSchema,
  BookingStaffSelectionSchema,
  type BookingDetails,
  type BookingReschedule,
} from "@/features/booking/schema";

/* ── helpers ───────────────────────────────────────────────────────────────────────────── */

async function loadBranchContext(branchId: string) {
  const [hours, policy] = await Promise.all([
    prisma.businessHours.findMany({ where: { branchId } }),
    prisma.bookingPolicy.findUnique({ where: { branchId } }),
  ]);
  return { hours, policy };
}

function blocksFromBookings(bookings: { staffId: string; startsAt: Date; blockedUntil: Date; resources: { resourceId: string; startsAt: Date; blockedUntil: Date }[] }[]) {
  const busy: BusyBlock[] = bookings.map((b) => ({ staffId: b.staffId, start: b.startsAt.getTime(), end: b.blockedUntil.getTime() }));
  const resourceBusy: ResourceBusy[] = bookings.flatMap((b) =>
    b.resources.map((r) => ({ resourceId: r.resourceId, start: r.startsAt.getTime(), end: r.blockedUntil.getTime() })),
  );
  return { busy, resourceBusy };
}

/** Re-validate a requested slot against current DB state and pick a stylist. */
async function revalidateSlotInput({
  branchId,
  staffId,
  date,
  time,
  durationMinutes,
  requiredResources,
  policy,
  hoursMap,
  existingBookings,
}: {
  branchId: string;
  staffId?: string | null;
  date: string;
  time: string;
  durationMinutes: number;
  requiredResources: ResourceTypeKey[];
  policy: NonNullable<Awaited<ReturnType<typeof loadBranchContext>>["policy"]>;
  hoursMap: Record<number, { open: string; close: string; closed: boolean } | undefined>;
  existingBookings: { staffId: string; startsAt: Date; blockedUntil: Date; resources: { resourceId: string; startsAt: Date; blockedUntil: Date }[] }[];
}) {
  const { busy, resourceBusy } = blocksFromBookings(existingBookings);

  const staff = await prisma.employeeProfile.findMany({
    where: { branchId, isBookable: true, employmentStatus: "ACTIVE", user: { status: "ACTIVE" } },
    include: {
      availability: { where: { isActive: true } },
      breaks: true,
      shifts: true,
      leaveRequests: { where: { status: "APPROVED" } },
    },
  });

  const schedules = new Map<string, { staffId: string; weekly: { weekday: number; start: string; end: string }[]; breaks: { weekday?: number | null; date?: string | null; start: string; end: string }[]; shifts: { date: string; start: string; end: string; type: "REGULAR" | "MORNING" | "EVENING" | "EXTRA" | "OFF" }[]; leaves: { startDate: string; endDate: string }[] }>();
  for (const e of staff) {
    schedules.set(e.id, {
      staffId: e.id,
      weekly: e.availability.map((a) => ({ weekday: a.weekday, start: a.startTime, end: a.endTime })),
      breaks: e.breaks.map((b) => ({ weekday: b.weekday, date: b.date ? dayOf(b.date) : null, start: b.startTime, end: b.endTime })),
      shifts: e.shifts.map((s) => ({ date: dayOf(s.date), start: s.startTime, end: s.endTime, type: s.type })),
      leaves: e.leaveRequests.map((l) => ({ startDate: dayOf(l.startDate), endDate: dayOf(l.endDate) })),
    });
  }

  const resources = (await prisma.resource.findMany({ where: { branchId, isActive: true } })).map((r) => ({ id: r.id, type: r.type }));

  const params = {
    now: new Date(),
    hours: hoursMap,
    policy: {
      slotIntervalMinutes: policy.slotIntervalMinutes,
      bufferMinutes: policy.bufferMinutes,
      minLeadTimeMinutes: policy.minLeadTimeMinutes,
      maxAdvanceDays: policy.maxAdvanceDays,
    },
    staff: [...schedules.values()],
    busy,
    resources,
    resourceBusy,
    requiredResources,
    durationMinutes,
  };

  return validateSlot(params, date, time, staffId ?? "any");
}

/**
 * Create a booking. Open to guests (customer account linked if signed in).
 * Server-side revalidation of the slot happens here — the client never chooses a price or a time that we
 * don't re-check against live data. Overlap protection is enforced by PostgreSQL exclusion constraints;
 * if a concurrent booking took the slot first, the exclusion violation is surfaced as a conflict.
 */
export const createBooking = publicAction({
  name: "createBooking",
  schema: z.object({
    serviceIds: z.array(z.string().uuid()).min(1),
    staffId: z.string().uuid().optional(),
    date: z.string(),
    time: z.string(),
    couponCode: z.string().optional().nullish(),
    details: BookingDetailsSchema,
  }),
  handler: async ({ input }) => {
    const actor = await getActor();
    const customerId = actor?.customerId;

    const services = await prisma.service.findMany({
      where: { id: { in: input.serviceIds }, isActive: true },
      include: { category: true },
    });
    if (services.length !== input.serviceIds.length || services.some((s) => !s.isActive)) {
      return { ok: false, code: "VALIDATION", error: "One or more services are no longer available." };
    }
    const durationMinutes = services.reduce((a, s) => a + s.durationMinutes, 0);
    if (durationMinutes > 360) return { ok: false, code: "VALIDATION", error: "Combined services exceed the maximum booking length." };
    const subtotal = services.reduce((a, s) => a + toNumber(s.priceFrom) * 100, 0);

    const branch = await prisma.salonBranch.findFirst({ where: { isPrimary: true } });
    if (!branch) return { ok: false, code: "INTERNAL", error: "The salon is not configured yet." };
    const { hours, policy } = await loadBranchContext(branch.id);
    if (!policy) return { ok: false, code: "INTERNAL", error: "Booking policies are not configured yet." };
    const hoursMap = Object.fromEntries(hours.map((h) => [h.weekday, { open: h.opensAt, close: h.closesAt, closed: h.isClosed }]));
    const today = todayISO();
    if (diffDays(today, input.date) < 0 || diffDays(today, input.date) > policy.maxAdvanceDays) {
      return { ok: false, code: "VALIDATION", error: "That date is outside the booking window." };
    }

    const requiredResourceTypes = [...new Set(services.map((s) => s.requiredResource).filter(Boolean))] as ResourceTypeKey[];
    const resources = (await prisma.resource.findMany({ where: { branchId: branch.id, isActive: true } })).map((r) => ({ id: r.id, type: r.type }));
    const resourceBusy: ResourceBusy[] = [];

    // existing ACTIVE bookings (respects concurrency — cancelled bookings release their slots)
    const existingBookings = await prisma.booking.findMany({
      where: { branchId: branch.id, status: { in: ACTIVE_STATUSES } },
      include: { resources: true },
    });

    const slotValidation = await revalidateSlotInput({
      branchId: branch.id,
      staffId: input.staffId,
      date: input.date,
      time: input.time,
      durationMinutes,
      requiredResources: requiredResourceTypes,
      policy,
      hoursMap,
      existingBookings,
    });
    if (!slotValidation.ok) {
      return { ok: false, code: "CONFLICT", error: "That time slot is no longer available. Please pick another." };
    }

    const chosen = slotValidation as { ok: true; slot: Slot; staffId: string; resourceIds: string[] };
    const { slot: chosenSlot, staffId: chosenStaffId, resourceIds } = chosen;
    const requiresApproval = services.some((s) => s.requiresApproval);
    const initialStatus: BookingStatusKey = requiresApproval ? "PENDING" : "CONFIRMED";

    // pricing: offer applies to eligible services
    let discount = 0;
    let offerId: string | null = null;
    let couponCode: string | null = null;
    if (input.couponCode) {
      const offer = await prisma.offer.findFirst({
        where: { code: input.couponCode, status: "ACTIVE", startsAt: { lte: new Date() }, endsAt: { gte: new Date() } },
        include: { services: true, category: true },
      });
      if (offer) {
        const eligibleSubtotal = services
          .filter((s) =>
            offer.categoryId ? s.categoryId === offer.categoryId : offer.services.length ? offer.services.some((os) => os.serviceId === s.id) : true,
          )
          .reduce((a, s) => a + toNumber(s.priceFrom) * 100, 0);
        discount = computeDiscountPaise(
          { type: offer.type, value: toNumber(offer.value), maxDiscount: offer.maxDiscount ? toNumber(offer.maxDiscount) : null, minSpend: offer.minSpend ? toNumber(offer.minSpend) : null },
          eligibleSubtotal,
        );
        if (discount > 0) { offerId = offer.id; couponCode = offer.code; }
      }
    }
    const total = subtotal - discount;

    const startsAt = chosenSlot.startsAt;
    const endsAt = chosenSlot.endsAt;
    const blockedUntil = chosenSlot.blockedUntil;
    const reference = generateReference();
    const confirmToken = generateRandomString(28);

    const bookingData: Prisma.BookingUncheckedCreateInput = {
      reference,
      branchId: branch.id,
      staffId: chosenStaffId,
      customerId: (customerId ?? null) as unknown as string,
      status: initialStatus,
      source: "ONLINE",
      startsAt,
      endsAt,
      blockedUntil,
      durationMinutes,
      bufferMinutes: policy.bufferMinutes,
      subtotal: paiseToString(subtotal),
      discountAmount: paiseToString(discount),
      total: paiseToString(total),
      couponCode: couponCode ?? null,
      paymentMethod: "PAY_AT_SALON",
      paymentStatus: "UNPAID",
      customerNote: input.details.note ?? null,
      requestedAnyStaff: !input.staffId,
      createdById: actor?.userId ?? null,
      cancelledAt: null,
      cancelledById: null,
      cancellationReason: null,
      checkedInAt: null,
      startedAt: null,
      completedAt: null,
      services: {
        create: services.map((s, i) => ({
          serviceId: s.id,
          nameSnapshot: s.name,
          durationMinutes: s.durationMinutes,
          price: s.priceFrom.toString(),
          sortOrder: i,
        })),
      },
      history: {
        create: {
          fromStatus: null,
          toStatus: initialStatus,
          note: "Booked online",
          changedByName: actor?.name ?? "Guest",
        },
      },
      resources: { create: resourceIds.map((resourceId) => ({ resourceId, startsAt, blockedUntil })) },
      ...(offerId && customerId
        ? { redemption: { create: { discountAmount: paiseToString(discount), offerId, customerId } } }
        : {}),
    };

    let booking;
    try {
      booking = await prisma.$transaction(async (tx) => {
        const b = await tx.booking.create({ data: bookingData });
        return b;
      });
    } catch (error) {
      if (isExclusionViolation(error)) {
        return { ok: false, code: "CONFLICT", error: "That slot was just taken — please choose another time." };
      }
      throw error;
    }

    if (customerId && actor) {
      await writeAudit({
        actor: { userId: actor.userId, name: actor.name },
        action: "booking.created",
        entityType: "booking",
        entityId: booking.id,
        summary: `Created booking ${booking.reference}`,
      });
    }

    return { ok: true, data: { bookingId: booking.id, reference: booking.reference, confirmToken, total } };
  },
});

export const cancelBooking = authedAction({
  name: "cancelBooking",
  schema: BookingCancelSchema,
  permission: ["appointments.cancel", "appointments.update"],
  handler: async ({ input, actor }) => {
    assertAuthenticated(actor);
    const booking = await prisma.booking.findUnique({ where: { id: input.bookingId }, include: { customer: true } });
    if (!booking) return { ok: false, code: "NOT_FOUND", error: "Booking not found." };

    const scope = scopeFilter(actor, "appointments.cancel");
    if (scope.kind === "own" && booking.staffId !== actor.employeeId) return { ok: false, code: "FORBIDDEN", error: "You can only cancel your own appointments." };
    if (scope.kind === "branch" && booking.branchId !== actor.branchId) return { ok: false, code: "FORBIDDEN", error: "That booking belongs to another branch." };

    const { customerCanCancel } = await import("@/features/booking/policy");
    const decision = customerCanCancel(
      { status: booking.status as BookingStatusKey, startsAt: booking.startsAt },
      { cancellationWindowHours: 4, rescheduleWindowHours: 6, maxReschedules: 2 },
    );
    // staff with appointments.cancel may override the time window
    const canOverride = scope.kind !== "none";
    if (!decision.allowed && !canOverride) return { ok: false, code: "POLICY", error: decision.reason ?? "This appointment cannot be cancelled." };

    const updated = await prisma.booking.update({
      where: { id: input.bookingId },
      data: { status: "CANCELLED", cancelledAt: new Date(), cancelledById: actor.userId, cancellationReason: "Cancelled by staff" },
    });
    await writeAudit({ actor: { userId: actor.userId, name: actor.name }, action: "booking.cancelled", entityType: "booking", entityId: booking.id, summary: `Cancelled booking ${booking.reference}` });
    await prisma.notification.create({
      data: {
        userId: booking.customer.userId!,
        type: "BOOKING_CANCELLED",
        title: "Appointment cancelled",
        body: `Your booking ${booking.reference} has been cancelled.`,
        href: "/account/bookings",
      },
    });
    return { ok: true, data: { reference: updated.reference } };
  },
});

export const checkInBooking = authedAction({
  name: "checkInBooking",
  schema: BookingCheckInSchema,
  permission: ["appointments.update"],
  handler: async ({ input, actor }) => {
    assertAuthenticated(actor);
    const booking = await prisma.booking.findUnique({ where: { id: input.bookingId } });
    if (!booking) return { ok: false, code: "NOT_FOUND", error: "Booking not found." };
    const scope = scopeFilter(actor, "appointments.update");
    if (scope.kind === "own" && booking.staffId !== actor.employeeId) return { ok: false, code: "FORBIDDEN", error: "Not your appointment." };
    if (scope.kind === "branch" && booking.branchId !== actor.branchId) return { ok: false, code: "FORBIDDEN", error: "That booking belongs to another branch." };
    if (booking.status !== "CONFIRMED") return { ok: false, code: "CONFLICT", error: "Only confirmed appointments can be checked in." };
    const updated = await prisma.booking.update({
      where: { id: input.bookingId },
      data: { status: "CHECKED_IN", checkedInAt: new Date() },
    });
    await writeAudit({ actor: { userId: actor.userId, name: actor.name }, action: "booking.checked_in", entityType: "booking", entityId: booking.id, summary: `Checked in booking ${booking.reference}` });
    return { ok: true, data: { reference: updated.reference } };
  },
});

export const rescheduleBooking = authedAction({
  name: "rescheduleBooking",
  schema: BookingRescheduleSchema,
  permission: ["appointments.update"],
  handler: async ({ input, actor }) => {
    assertAuthenticated(actor);
    const booking = await prisma.booking.findUnique({ where: { id: input.bookingId }, include: { services: true } });
    if (!booking) return { ok: false, code: "NOT_FOUND", error: "Booking not found." };
    const scope = scopeFilter(actor, "appointments.update");
    if (scope.kind === "own" && booking.staffId !== actor.employeeId) return { ok: false, code: "FORBIDDEN", error: "Not your appointment." };
    if (scope.kind === "branch" && booking.branchId !== actor.branchId) return { ok: false, code: "FORBIDDEN", error: "That booking belongs to another branch." };
    const { customerCanReschedule } = await import("@/features/booking/policy");
    const decision = customerCanReschedule(
      { status: booking.status as BookingStatusKey, startsAt: booking.startsAt, rescheduleCount: booking.rescheduleCount },
      { cancellationWindowHours: 4, rescheduleWindowHours: 6, maxReschedules: 2 },
    );
    if (!decision.allowed && scope.kind === "own") return { ok: false, code: "POLICY", error: decision.reason ?? "This appointment cannot be rescheduled." };

    const branch = await prisma.salonBranch.findFirst({ where: { isPrimary: true } });
    const { hours, policy } = await loadBranchContext(branch!.id);
    if (!policy) return { ok: false, code: "INTERNAL", error: "Booking policies are not configured yet." };
    const hoursMap = Object.fromEntries(hours.map((h) => [h.weekday, { open: h.opensAt, close: h.closesAt, closed: h.isClosed }]));
    const durationMinutes = booking.services.reduce((a, s) => a + s.durationMinutes, 0);

    const existingBookings = await prisma.booking.findMany({
      where: { branchId: branch!.id, status: { in: ACTIVE_STATUSES }, id: { not: booking.id } },
      include: { resources: true },
    });
    const svcRows = await prisma.service.findMany({ where: { id: { in: booking.services.map((s) => s.serviceId) } } });
    const requiredResources = [...new Set(svcRows.map((s) => s.requiredResource).filter(Boolean))] as ResourceTypeKey[];

    const slotValidation = await revalidateSlotInput({
      branchId: branch!.id,
      staffId: booking.staffId,
      date: input.date,
      time: input.time,
      durationMinutes,
      requiredResources,
      policy,
      hoursMap,
      existingBookings,
    });
    if (!slotValidation.ok) return { ok: false, code: "CONFLICT", error: "That time slot is no longer available." };
    const { slot: rsSlot, staffId: rsStaffId, resourceIds: rsResourceIds } = slotValidation;

    const updated = await prisma.$transaction(async (tx) => {
      const oldBlocked = booking.blockedUntil;
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          startsAt: rsSlot.startsAt,
          endsAt: rsSlot.endsAt,
          blockedUntil: rsSlot.blockedUntil,
          rescheduleCount: { increment: 1 },
          resources: { deleteMany: {}, create: rsResourceIds.map((resourceId) => ({ resourceId, startsAt: rsSlot.startsAt, blockedUntil: rsSlot.blockedUntil })) },
          history: {
            create: {
              fromStatus: booking.status,
              toStatus: booking.status,
              note: "Rescheduled",
              changedByName: actor.name,
            },
          },
        },
      });
      await tx.bookingStatusHistory.create({
        data: { bookingId: booking.id, fromStatus: booking.status, toStatus: booking.status, note: "Rescheduled", changedByName: actor.name },
      });
      return tx.booking.findUnique({ where: { id: booking.id } });
    });
    await writeAudit({ actor: { userId: actor.userId, name: actor.name }, action: "booking.rescheduled", entityType: "booking", entityId: booking.id, summary: `Rescheduled booking ${booking.reference}` });
    return { ok: true, data: { reference: booking.reference } };
  },
});

export const updateBookingStatus = authedAction({
  name: "updateBookingStatus",
  schema: z.object({ bookingId: z.string().uuid(), status: z.enum(["CONFIRMED", "CHECKED_IN", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"]), note: z.string().optional() }),
  permission: ["appointments.update"],
  handler: async ({ input, actor }) => {
    assertAuthenticated(actor);
    const booking = await prisma.booking.findUnique({ where: { id: input.bookingId } });
    if (!booking) return { ok: false, code: "NOT_FOUND", error: "Booking not found." };
    const scope = scopeFilter(actor, "appointments.update");
    if (scope.kind === "own" && booking.staffId !== actor.employeeId) return { ok: false, code: "FORBIDDEN", error: "Not your appointment." };
    if (scope.kind === "branch" && booking.branchId !== actor.branchId) return { ok: false, code: "FORBIDDEN", error: "That booking belongs to another branch." };
    const from = booking.status as BookingStatusKey;
    if (!ACTIVE_STATUSES.includes(from as BookingStatusKey) && input.status !== "CONFIRMED") return { ok: false, code: "CONFLICT", error: "That transition is not allowed." };
    const updated = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.update({ where: { id: input.bookingId }, data: { status: input.status, ...(input.status === "CHECKED_IN" ? { checkedInAt: new Date() } : {}), ...(input.status === "COMPLETED" ? { completedAt: new Date() } : {}) } });
      await tx.bookingStatusHistory.create({ data: { bookingId: booking.id, fromStatus: from, toStatus: input.status, note: input.note ?? null, changedByName: actor.name } });
      return b;
    });
    await writeAudit({ actor: { userId: actor.userId, name: actor.name }, action: "booking.status_changed", entityType: "booking", entityId: booking.id, summary: `${from} → ${input.status} for ${booking.reference}` });
    return { ok: true, data: { reference: updated.reference } };
  },
});

/** Public summary for the confirmation page — no auth required, but the booking must exist. */
export async function getPublicBookingSummary(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { services: { include: { service: true } }, staff: { include: { user: true } }, offer: true, customer: true },
  });
  if (!booking) return null;
  return {
    reference: booking.reference,
    status: booking.status,
    staff: booking.staff.user.name,
    startsAt: booking.startsAt,
    endsAt: booking.endsAt,
    durationMinutes: booking.durationMinutes,
    services: booking.services.map((s) => ({ name: s.nameSnapshot, duration: s.durationMinutes, price: toNumber(s.price) })),
    subtotal: toNumber(booking.subtotal),
    discount: toNumber(booking.discountAmount),
    total: toNumber(booking.total),
    offer: booking.offer ? { title: booking.offer.title, code: booking.offer.code } : null,
  };
}
