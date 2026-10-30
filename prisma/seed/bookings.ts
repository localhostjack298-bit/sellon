/**
 * Booking seed. Uses the REAL availability engine (`features/booking/availability`) so every seeded booking
 * respects business hours, weekly schedules, shifts, approved leave, breaks, eligibility, buffers and shared
 * rooms — and therefore also satisfies the PostgreSQL exclusion constraints.
 *
 * Re-running the seed deletes previously seeded bookings (`createdById = "seed"`) and regenerates them
 * relative to today. Bookings created by real demo sessions are preserved and treated as busy time.
 */
import type { PrismaClient } from "@/generated/prisma/client";
import {
  computeSlotsForDate, pickResources,
  type BusyBlock, type DayHours, type ResourceBusy, type ResourceTypeKey, type StaffSchedule,
} from "@/features/booking/availability";
import { computeDiscountPaise } from "@/features/offers/pricing";
import { ACTIVE_STATUSES, type BookingStatusKey } from "@/features/booking/policy";
import { BUSINESS_TZ, addDays, dateToDateOnly, dayOf, hhmmToMinutes, hhmmOf, todayISO, zonedToDate } from "@/lib/dates";
import { seededRandom } from "@/lib/utils";
import { paiseToString } from "@/lib/money";
import type { PeopleResult } from "./people";
import { CUSTOMER_NAMES } from "./data/people";
import type { StaffKey } from "./data/catalogue";

type Status = BookingStatusKey;
type Source = "ONLINE" | "WALK_IN" | "STAFF";

const HOLDING: Status[] = [...ACTIVE_STATUSES, "COMPLETED"];

const SERVICE_WEIGHTS: Record<string, number> = {
  "signature-cut-finish": 10, "blow-dry-styling": 8, "occasion-updo": 3, "fringe-trim-refresh": 3, "global-colour": 5,
  "balayage-signature": 4, "root-touch-up": 4, "smoothing-treatment": 2, "deep-conditioning-ritual": 3, "radiance-facial": 5,
  "deep-cleanse-facial": 2, "express-glow": 3, "threading-brow-shaping": 4, "bridal-makeup-trial": 0.6, "bridal-makeup-hair": 0.4,
  "party-makeup": 3, "saree-draping-hair-set": 1.5, "classic-manicure": 3, "gel-manicure": 4, "spa-pedicure": 3,
  "gentleman-haircut": 6, "beard-sculpt-hot-towel": 3, "cut-and-beard-ritual": 4, "little-stars-cut": 4, "parent-child-cut": 2,
};

const CANCEL_REASONS = ["Schedule clash", "Feeling unwell", "Travel plans changed", "Rebooking for another day", "Family commitment"];
const CUSTOMER_NOTES = ["Please use gentle products.", "First visit — a little nervous!", "Running a few minutes late possibly.", "Would love a quiet chair.", "Bringing a reference photo."];
const INTERNAL_NOTES = ["Prefers the chair near the window.", "Allergic to ammonia-based dye — patch test done.", "Likes a short consultation first.", "Regular — offer rebooking at checkout."];

export interface BookingSeedContext {
  people: PeopleResult;
  branchId: string;
  adminUserId: string;
}

export async function seedBookings(prisma: PrismaClient, ctx: BookingSeedContext) {
  const rng = seededRandom(20_261_029);
  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rng() * arr.length)]!;
  const today = todayISO();
  const nowMs = Date.now();
  const { people, branchId } = ctx;

  // ── clean previously seeded transactional data ───────────────────────────
  const seededCustomerIds = people.customerId;
  await prisma.offerRedemption.deleteMany({ where: { booking: { createdById: "seed" } } });
  await prisma.booking.deleteMany({ where: { createdById: "seed" } });
  await prisma.loyaltyTransaction.deleteMany({ where: { account: { customerId: { in: seededCustomerIds } } } });

  // ── load inputs ──────────────────────────────────────────────────────────
  const services = await prisma.service.findMany({ include: { staff: { select: { employeeId: true } } } });
  const svc = new Map(services.map((s) => [s.slug, s]));
  const hoursRows = await prisma.businessHours.findMany({ where: { branchId } });
  const hours: Record<number, DayHours> = Object.fromEntries(
    hoursRows.map((h) => [h.weekday, { open: h.opensAt, close: h.closesAt, closed: h.isClosed } satisfies DayHours]),
  );
  const policyRow = await prisma.bookingPolicy.findUniqueOrThrow({ where: { branchId } });
  const policy = {
    slotIntervalMinutes: policyRow.slotIntervalMinutes,
    bufferMinutes: policyRow.bufferMinutes,
    minLeadTimeMinutes: policyRow.minLeadTimeMinutes,
    maxAdvanceDays: 400,
  };
  const resources = (await prisma.resource.findMany({ where: { branchId, isActive: true } })).map((r) => ({ id: r.id, type: r.type as ResourceTypeKey }));

  const employees = await prisma.employeeProfile.findMany({
    where: { branchId, isBookable: true },
    orderBy: { displayOrder: "asc" },
    include: { availability: true, breaks: true, shifts: true, leaveRequests: { where: { status: "APPROVED" } } },
  });
  const schedules = new Map<string, StaffSchedule>(
    employees.map((e) => [
      e.id,
      {
        staffId: e.id,
        weekly: e.availability.filter((a) => a.isActive).map((a) => ({ weekday: a.weekday, start: a.startTime, end: a.endTime })),
        breaks: e.breaks.map((b) => ({ weekday: b.weekday, date: b.date ? dateToDateOnly(b.date) : null, start: b.startTime, end: b.endTime })),
        shifts: e.shifts.map((s) => ({ date: dateToDateOnly(s.date), start: s.startTime, end: s.endTime, type: s.type })),
        leaves: e.leaveRequests.map((l) => ({ startDate: dateToDateOnly(l.startDate), endDate: dateToDateOnly(l.endDate) })),
      } satisfies StaffSchedule,
    ]),
  );
  const employeeByKey = (key: StaffKey) => people.employeeId.get(key)!;

  // Real (non-seed) bookings already in the database are respected as busy time.
  const busy: BusyBlock[] = [];
  const resourceBusy: ResourceBusy[] = [];
  const countByDayStaff = new Map<string, number>();
  const existing = await prisma.booking.findMany({
    where: { status: { in: ACTIVE_STATUSES }, OR: [{ createdById: null }, { createdById: { not: "seed" } }] },
    include: { resources: true },
  });
  for (const b of existing) {
    busy.push({ staffId: b.staffId, start: b.startsAt.getTime(), end: b.blockedUntil.getTime() });
    for (const r of b.resources) resourceBusy.push({ resourceId: r.resourceId, start: r.startsAt.getTime(), end: r.blockedUntil.getTime() });
  }

  // offers (created earlier in the seed) for redemptions
  const offers = await prisma.offer.findMany({ include: { services: true } });
  const offerByCode = new Map(offers.filter((o) => o.code).map((o) => [o.code!, o]));

  let counter = 0;
  const created: { id: string; status: Status; customerIndex: number; total: number }[] = [];

  function autoStatus(startsAt: Date, endsAt: Date, requiresApproval: boolean): Status {
    const r = rng();
    if (endsAt.getTime() < nowMs) return r < 0.78 ? "COMPLETED" : r < 0.9 ? "CANCELLED" : "NO_SHOW";
    if (startsAt.getTime() <= nowMs) return "IN_PROGRESS";
    if (requiresApproval) return "PENDING";
    return r < 0.9 ? "CONFIRMED" : "CANCELLED";
  }

  async function place(opts: {
    customerIndex: number; services: string[]; staffKey?: StaffKey; date: string; near?: string;
    status?: Status; source?: Source; offerCode?: string; customerNote?: string; internalNote?: string;
  }) {
    const rows = opts.services.map((s) => svc.get(s)!);
    const duration = rows.reduce((a, r) => a + r.durationMinutes, 0);
    const required = [...new Set(rows.map((r) => r.requiredResource).filter(Boolean))] as ResourceTypeKey[];
    let eligible = rows.map((r) => new Set(r.staff.map((s) => s.employeeId))).reduce((a, b) => new Set([...a].filter((x) => b.has(x))));
    if (opts.staffKey) eligible = new Set([...eligible].filter((id) => id === employeeByKey(opts.staffKey!)));
    const staffSchedules = [...eligible].map((id) => schedules.get(id)).filter(Boolean) as StaffSchedule[];
    if (staffSchedules.length === 0) return null;

    let chosen: { date: string; slot: ReturnType<typeof computeSlotsForDate>[number] } | null = null;
    for (let attempt = 0; attempt < 16 && !chosen; attempt++) {
      const date = addDays(opts.date, attempt);
      const virtualNow = date < today ? zonedToDate(addDays(date, -2), "09:00").getTime() : nowMs;
      const slots = computeSlotsForDate(
        { now: virtualNow, hours, policy, staff: staffSchedules, busy, resources, resourceBusy, requiredResources: required, durationMinutes: duration },
        date,
      );
      if (slots.length === 0) continue;
      const nearMin = hhmmToMinutes(opts.near ?? pick(["10:30", "11:15", "12:00", "14:30", "15:30", "16:15", "17:00"]));
      const ranked = [...slots].sort((a, b) => Math.abs(hhmmToMinutes(a.time) - nearMin) - Math.abs(hhmmToMinutes(b.time) - nearMin));
      chosen = { date, slot: ranked[Math.floor(rng() * Math.min(3, ranked.length))]! };
    }
    if (!chosen) return null;

    const { slot, date } = chosen;
    // "Any stylist": pick from the less-loaded half of the free stylists (keeps the demo schedule varied but balanced).
    const byLoad = [...slot.staffIds].sort((a, b) => (countByDayStaff.get(`${date}|${a}`) ?? 0) - (countByDayStaff.get(`${date}|${b}`) ?? 0));
    const staffId = opts.staffKey ? employeeByKey(opts.staffKey) : pick(byLoad.slice(0, Math.max(1, Math.ceil(byLoad.length / 2))));

    const requiresApproval = rows.some((r) => r.requiresApproval);
    const status = opts.status ?? autoStatus(slot.startsAt, slot.endsAt, requiresApproval);
    const holds = HOLDING.includes(status);

    // pricing
    const subtotal = rows.reduce((a, r) => a + Math.round(Number(r.priceFrom) * 100), 0);
    let discount = 0;
    let offerId: string | null = null;
    let couponCode: string | null = null;
    const offer = opts.offerCode ? offerByCode.get(opts.offerCode) : undefined;
    if (offer) {
      const eligibleSubtotal = rows
        .filter((r) => (offer.categoryId ? r.categoryId === offer.categoryId : offer.services.length ? offer.services.some((s) => s.serviceId === r.id) : true))
        .reduce((a, r) => a + Math.round(Number(r.priceFrom) * 100), 0);
      discount = computeDiscountPaise(
        { type: offer.type, value: Number(offer.value), maxDiscount: offer.maxDiscount ? Number(offer.maxDiscount) : null, minSpend: offer.minSpend ? Number(offer.minSpend) : null },
        eligibleSubtotal,
      );
      if (discount > 0) { offerId = offer.id; couponCode = offer.code; }
    }
    const total = subtotal - discount;

    // timeline
    const source: Source = opts.source ?? (rng() < 0.62 ? "ONLINE" : rng() < 0.55 ? "STAFF" : "WALK_IN");
    const startMs = slot.startsAt.getTime();
    const createdAt = new Date(source === "WALK_IN" ? startMs - 30 * 60_000 : Math.min(nowMs - 3_600_000, startMs - (1 + Math.floor(rng() * 9)) * 86_400_000));
    const customerUserId = people.customerUserId[opts.customerIndex];
    const t = (ms: number) => new Date(ms);
    const checkedInAt = ["CHECKED_IN", "IN_PROGRESS", "COMPLETED"].includes(status) ? t(startMs - (4 + Math.floor(rng() * 10)) * 60_000) : null;
    const startedAt = ["IN_PROGRESS", "COMPLETED"].includes(status) ? t(startMs + Math.floor(rng() * 8) * 60_000) : null;
    const completedAt = status === "COMPLETED" ? t(slot.endsAt.getTime() + (Math.floor(rng() * 20) - 5) * 60_000) : null;
    const cancelledAt = status === "CANCELLED"
      ? t(Math.min(nowMs - 60_000, startMs - (8 + Math.floor(rng() * 60)) * 3_600_000))
      : null;

    const initial: Status = requiresApproval ? "PENDING" : "CONFIRMED";
    const history: { fromStatus: Status | null; toStatus: Status; at: Date; note: string }[] = [
      { fromStatus: null, toStatus: initial, at: createdAt, note: source === "WALK_IN" ? "Walk-in added at the desk" : requiresApproval ? "Booking request received — awaiting confirmation" : source === "STAFF" ? "Booked by the front desk" : "Booked online" },
    ];
    if (requiresApproval && status !== "PENDING" && status !== "CANCELLED") history.push({ fromStatus: "PENDING", toStatus: "CONFIRMED", at: new Date(createdAt.getTime() + 3_600_000), note: "Confirmed by the salon" });
    if (checkedInAt) history.push({ fromStatus: "CONFIRMED", toStatus: "CHECKED_IN", at: checkedInAt, note: "Guest arrived" });
    if (startedAt) history.push({ fromStatus: "CHECKED_IN", toStatus: "IN_PROGRESS", at: startedAt, note: "Service started" });
    if (completedAt) history.push({ fromStatus: "IN_PROGRESS", toStatus: "COMPLETED", at: completedAt, note: "Service completed — paid at salon" });
    if (status === "NO_SHOW") history.push({ fromStatus: "CONFIRMED", toStatus: "NO_SHOW", at: new Date(startMs + 20 * 60_000), note: "Guest did not arrive" });
    if (cancelledAt) history.push({ fromStatus: initial, toStatus: "CANCELLED", at: cancelledAt, note: "Cancelled by guest" });

    const resourceIds = holds && required.length ? pickResources({ resources, resourceBusy, requiredResources: required }, startMs, slot.blockedUntil.getTime()) ?? [] : [];
    if (holds && required.length && resourceIds.length === 0) return null;

    counter++;
    const booking = await prisma.booking.create({
      data: {
        reference: `SFS-D${counter.toString(36).toUpperCase().padStart(5, "0")}`,
        branchId,
        customerId: people.customerId[opts.customerIndex]!,
        staffId,
        status,
        source,
        startsAt: slot.startsAt,
        endsAt: slot.endsAt,
        blockedUntil: slot.blockedUntil,
        durationMinutes: duration,
        bufferMinutes: policy.bufferMinutes,
        subtotal: paiseToString(subtotal),
        discountAmount: paiseToString(discount),
        total: paiseToString(total),
        offerId,
        couponCode,
        paymentStatus: status === "COMPLETED" ? "PAID" : "UNPAID",
        paidAt: completedAt,
        customerNote: opts.customerNote ?? (rng() < 0.12 ? pick(CUSTOMER_NOTES) : null),
        internalNote: opts.internalNote ?? (rng() < 0.1 ? pick(INTERNAL_NOTES) : null),
        requestedAnyStaff: !opts.staffKey && rng() < 0.5,
        rescheduleCount: rng() < 0.08 ? 1 : 0,
        cancelledAt,
        cancelledById: cancelledAt ? customerUserId ?? null : null,
        cancellationReason: cancelledAt ? pick(CANCEL_REASONS) : null,
        checkedInAt, startedAt, completedAt,
        createdById: "seed",
        createdAt,
        services: { create: rows.map((r, i) => ({ serviceId: r.id, nameSnapshot: r.name, durationMinutes: r.durationMinutes, price: r.priceFrom.toString(), sortOrder: i })) },
        history: {
          create: history.map((h) => ({ fromStatus: h.fromStatus, toStatus: h.toStatus, note: h.note, changedByName: "System (seed)", createdAt: h.at })),
        },
        resources: { create: resourceIds.map((resourceId) => ({ resourceId, startsAt: slot.startsAt, blockedUntil: slot.blockedUntil })) },
        ...(offerId && !["CANCELLED", "NO_SHOW"].includes(status)
          ? { redemption: { create: { offerId, customerId: people.customerId[opts.customerIndex]!, discountAmount: paiseToString(discount) } } }
          : {}),
      },
    });

    if (holds) {
      busy.push({ staffId, start: startMs, end: slot.blockedUntil.getTime() });
      for (const resourceId of resourceIds) resourceBusy.push({ resourceId, start: startMs, end: slot.blockedUntil.getTime() });
      const key = `${date}|${staffId}`;
      countByDayStaff.set(key, (countByDayStaff.get(key) ?? 0) + 1);
    }
    created.push({ id: booking.id, status, customerIndex: opts.customerIndex, total });
    return booking;
  }

  // ── storyline: demo customer Riya (index 0) ─────────────────────────────
  const riya = 0;
  await place({ customerIndex: riya, services: ["signature-cut-finish"], staffKey: "aarav", date: addDays(today, -28), near: "11:00", status: "COMPLETED", source: "ONLINE", offerCode: "WELCOME15", customerNote: "First visit — love a soft layered look." });
  await place({ customerIndex: riya, services: ["gel-manicure"], staffKey: "ishita", date: addDays(today, -14), near: "15:00", status: "COMPLETED", source: "ONLINE" });
  await place({ customerIndex: riya, services: ["radiance-facial", "threading-brow-shaping"], staffKey: "ananya", date: addDays(today, -6), near: "12:00", status: "COMPLETED", source: "ONLINE" });
  await place({ customerIndex: riya, services: ["blow-dry-styling"], staffKey: "aarav", date: addDays(today, -3), near: "16:00", status: "CANCELLED", source: "ONLINE" });
  await place({ customerIndex: riya, services: ["signature-cut-finish", "deep-conditioning-ritual"], staffKey: "aarav", date: addDays(today, 5), near: "11:00", status: "CONFIRMED", source: "ONLINE", customerNote: "Same as last time please." });
  await place({ customerIndex: riya, services: ["bridal-makeup-trial"], staffKey: "zoya", date: addDays(today, 12), near: "11:00", status: "PENDING", source: "ONLINE", customerNote: "Trial for my cousin's wedding in the new year." });

  // ── storyline: demo employee Aarav — a busy today / tomorrow / day after ──
  const regulars = [1, 2, 3, 4, 5, 6, 7];
  const aaravLoad: [number, string, string[]][] = [
    [0, "10:30", ["signature-cut-finish"]], [0, "12:00", ["gentleman-haircut"]], [0, "16:00", ["blow-dry-styling"]],
    [1, "10:30", ["signature-cut-finish"]], [1, "14:30", ["parent-child-cut"]], [1, "17:00", ["occasion-updo"]],
    [2, "11:30", ["signature-cut-finish", "deep-conditioning-ritual"]], [2, "15:00", ["fringe-trim-refresh"]],
    [3, "12:00", ["gentleman-haircut"]],
  ];
  for (const [i, [offset, near, list]] of aaravLoad.entries()) {
    await place({ customerIndex: regulars[i % regulars.length]!, services: list, staffKey: "aarav", date: addDays(today, offset), near });
  }

  // a second bridal request so the manager has more than one pending item
  await place({ customerIndex: 2, services: ["bridal-makeup-hair"], staffKey: "zoya", date: addDays(today, 24), near: "09:00", status: "PENDING", source: "ONLINE", customerNote: "Wedding morning — family of four to style." });
  await place({ customerIndex: 5, services: ["global-colour"], date: addDays(today, 3), near: "12:00", offerCode: "FESTIVE12" });
  await place({ customerIndex: 8, services: ["radiance-facial"], date: addDays(today, 2), near: "11:00", offerCode: "GLOW400" });
  await place({ customerIndex: 9, services: ["little-stars-cut"], date: addDays(today, 4), near: "10:30", offerCode: "FAMILYWEEKEND" });

  // ── random fill up to ~72 bookings ───────────────────────────────────────
  const slugs = Object.keys(SERVICE_WEIGHTS);
  const totalWeight = slugs.reduce((a, s) => a + SERVICE_WEIGHTS[s]!, 0);
  const pickService = () => {
    let r = rng() * totalWeight;
    for (const s of slugs) { r -= SERVICE_WEIGHTS[s]!; if (r <= 0) return s; }
    return slugs[0]!;
  };
  const pairs: Record<string, string> = {
    "signature-cut-finish": "deep-conditioning-ritual", "global-colour": "blow-dry-styling", "gentleman-haircut": "beard-sculpt-hot-towel",
    "radiance-facial": "threading-brow-shaping", "classic-manicure": "spa-pedicure", "gel-manicure": "spa-pedicure",
  };
  const pickOffset = () => {
    const r = rng();
    if (r < 0.6) return -Math.floor(1 + rng() * 34);
    if (r < 0.66) return 0;
    if (r < 0.82) return Math.floor(1 + rng() * 3);
    return Math.floor(4 + rng() * 17);
  };

  let safety = 0;
  while (created.length < 98 && safety++ < 600) {
    const primary = pickService();
    const list = rng() < 0.28 && pairs[primary] ? [primary, pairs[primary]!] : [primary];
    const customerIndex = rng() < 0.4 ? 1 + Math.floor(rng() * 8) : 1 + Math.floor(rng() * (CUSTOMER_NAMES.length - 1));
    const offerCode = rng() < 0.08
      ? (list.some((s) => ["radiance-facial", "express-glow", "deep-cleanse-facial"].includes(s)) ? "GLOW400" : list.includes("global-colour") ? "FESTIVE12" : undefined)
      : undefined;
    await place({ customerIndex, services: list, date: addDays(today, pickOffset()), offerCode });
  }

  // ── redemption counters & loyalty ────────────────────────────────────────
  for (const o of offers) {
    const n = await prisma.offerRedemption.count({ where: { offerId: o.id, status: "APPLIED" } });
    await prisma.offer.update({ where: { id: o.id }, data: { redemptionCount: n } });
  }

  const WELCOME = 50;
  for (const [index, customerId] of people.customerId.entries()) {
    const completed = created.filter((c) => c.customerIndex === index && c.status === "COMPLETED");
    const earned = completed.reduce((a, c) => a + Math.floor(c.total / 100 / 100), 0);
    const lifetime = WELCOME + earned;
    const tier = lifetime >= 1500 ? "CELESTIAL" : lifetime >= 500 ? "RADIANT" : "STARLIGHT";
    const account = await prisma.loyaltyAccount.upsert({
      where: { customerId },
      create: { customerId, pointsBalance: lifetime, lifetimePoints: lifetime, tier },
      update: { pointsBalance: lifetime, lifetimePoints: lifetime, tier },
    });
    let running = WELCOME;
    await prisma.loyaltyTransaction.create({
      data: { accountId: account.id, type: "BONUS", points: WELCOME, balanceAfter: running, description: "Welcome to Stellar Rewards (demo points)", createdAt: new Date(nowMs - 40 * 86_400_000) },
    });
    for (const c of completed) {
      const pts = Math.floor(c.total / 100 / 100);
      if (pts <= 0) continue;
      running += pts;
      await prisma.loyaltyTransaction.create({
        data: { accountId: account.id, bookingId: c.id, type: "EARN", points: pts, balanceAfter: running, description: "Points for a completed visit (demo points)" },
      });
    }
  }

  const byStatus = created.reduce<Record<string, number>>((acc, c) => ((acc[c.status] = (acc[c.status] ?? 0) + 1), acc), {});
  return { total: created.length, byStatus };
}

export const _utils = { dayOf, hhmmOf, BUSINESS_TZ };
