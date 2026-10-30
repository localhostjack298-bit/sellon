/**
 * Availability engine — PURE (no database, no framework), fully unit-tested.
 *
 * Slots are *computed*, never random. A start time is bookable for a stylist only if ALL hold:
 *   1. the branch is open (business hours for that weekday) and the date is inside [today, today + maxAdvanceDays]
 *   2. the stylist works then: weekly pattern, replaced by date-specific shifts (type OFF = day off,
 *      EXTRA adds hours), clipped to business hours
 *   3. the stylist is not on approved leave and not on a break
 *   4. the whole service fits inside one working window
 *   5. the start is at least `minLeadTimeMinutes` from now
 *   6. [start, start + duration + buffer) does not overlap any of the stylist's active bookings
 *      (this is exactly the range protected by the PostgreSQL exclusion constraint)
 *   7. every resource the service needs (room / station) has a free unit for that range
 *
 * Instants are epoch milliseconds in UTC; calendar days are branch-local `YYYY-MM-DD`; times are "HH:mm".
 */
import { BUSINESS_TZ, diffDays, dayOf, hhmmToMinutes, minutesToHHmm, weekdayOf, zonedToDate } from "@/lib/dates";

export type ResourceTypeKey = "STYLING_STATION" | "COLOUR_BAR" | "FACIAL_ROOM" | "NAIL_BAR" | "BRIDAL_SUITE";
export type ShiftTypeKey = "REGULAR" | "MORNING" | "EVENING" | "EXTRA" | "OFF";

export interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

export interface StaffSchedule {
  staffId: string;
  /** Recurring weekly working windows (ISO weekday 1–7). Multiple rows per day allow split shifts. */
  weekly: { weekday: number; start: string; end: string }[];
  /** Recurring (`weekday`) or one-off (`date`) breaks. */
  breaks: { weekday?: number | null; date?: string | null; start: string; end: string }[];
  /** Date-specific overrides of the weekly pattern. */
  shifts: { date: string; start: string; end: string; type: ShiftTypeKey }[];
  /** APPROVED leave only (inclusive date ranges). */
  leaves: { startDate: string; endDate: string }[];
}

export interface BusyBlock {
  staffId: string;
  /** Epoch ms, inclusive. */
  start: number;
  /** Epoch ms, exclusive — booking end + buffer (`blockedUntil`). */
  end: number;
}

export interface ResourceBusy {
  resourceId: string;
  start: number;
  end: number;
}

export interface AvailabilityPolicy {
  slotIntervalMinutes: number;
  bufferMinutes: number;
  minLeadTimeMinutes: number;
  maxAdvanceDays: number;
}

export interface AvailabilityParams {
  zone?: string;
  now: Date | number;
  hours: Record<number, DayHours | undefined>;
  policy: AvailabilityPolicy;
  /** Only stylists eligible for ALL selected services. */
  staff: StaffSchedule[];
  busy: BusyBlock[];
  resources: { id: string; type: ResourceTypeKey }[];
  resourceBusy: ResourceBusy[];
  requiredResources: ResourceTypeKey[];
  /** Combined service duration, excluding buffer. */
  durationMinutes: number;
}

export interface Slot {
  /** Branch-local "HH:mm". */
  time: string;
  startsAt: Date;
  endsAt: Date;
  blockedUntil: Date;
  /** Stylists who can take this slot. */
  staffIds: string[];
}

type Win = [number, number]; // minutes-of-day, [start, end)

/* ── window arithmetic ────────────────────────────────────────────────────────────────── */

function normalise(windows: Win[]): Win[] {
  const sorted = windows.filter(([a, b]) => b > a).sort((x, y) => x[0] - y[0]);
  const out: Win[] = [];
  for (const w of sorted) {
    const last = out[out.length - 1];
    if (last && w[0] <= last[1]) last[1] = Math.max(last[1], w[1]);
    else out.push([w[0], w[1]]);
  }
  return out;
}

function clip(windows: Win[], lo: number, hi: number): Win[] {
  return normalise(windows.map(([a, b]) => [Math.max(a, lo), Math.min(b, hi)] as Win));
}

function subtract(windows: Win[], cuts: Win[]): Win[] {
  let result = windows;
  for (const [ca, cb] of cuts) {
    const next: Win[] = [];
    for (const [a, b] of result) {
      if (cb <= a || ca >= b) next.push([a, b]);
      else {
        if (ca > a) next.push([a, ca]);
        if (cb < b) next.push([cb, b]);
      }
    }
    result = next;
  }
  return normalise(result);
}

function isOnLeave(staff: StaffSchedule, dateISO: string): boolean {
  return staff.leaves.some((l) => l.startDate <= dateISO && dateISO <= l.endDate);
}

/** The stylist's free working windows (minutes-of-day) on a date, before existing bookings are considered. */
export function workingWindows(staff: StaffSchedule, dateISO: string, hours: DayHours | undefined): Win[] {
  if (!hours || hours.closed) return [];
  if (isOnLeave(staff, dateISO)) return [];

  const weekday = weekdayOf(dateISO);
  const todaysShifts = staff.shifts.filter((s) => s.date === dateISO);
  if (todaysShifts.some((s) => s.type === "OFF")) return [];

  let windows: Win[];
  const replacing = todaysShifts.filter((s) => s.type !== "EXTRA");
  if (replacing.length > 0) {
    windows = replacing.map((s) => [hhmmToMinutes(s.start), hhmmToMinutes(s.end)] as Win);
  } else {
    windows = staff.weekly.filter((w) => w.weekday === weekday).map((w) => [hhmmToMinutes(w.start), hhmmToMinutes(w.end)] as Win);
  }
  windows.push(...todaysShifts.filter((s) => s.type === "EXTRA").map((s) => [hhmmToMinutes(s.start), hhmmToMinutes(s.end)] as Win));

  const clipped = clip(windows, hhmmToMinutes(hours.open), hhmmToMinutes(hours.close));
  const cuts = staff.breaks
    .filter((b) => (b.date ? b.date === dateISO : b.weekday === weekday))
    .map((b) => [hhmmToMinutes(b.start), hhmmToMinutes(b.end)] as Win);
  return subtract(clipped, cuts);
}

function rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && bStart < aEnd;
}

/* ── resources ────────────────────────────────────────────────────────────────────────── */

/** Pick one free unit per required resource type for [start, end). Returns null if any type is exhausted. */
export function pickResources(
  params: Pick<AvailabilityParams, "resources" | "resourceBusy" | "requiredResources">,
  start: number,
  end: number,
): string[] | null {
  const picked: string[] = [];
  for (const type of new Set(params.requiredResources)) {
    const candidates = params.resources.filter((r) => r.type === type);
    const free = candidates.find((r) => !params.resourceBusy.some((b) => b.resourceId === r.id && rangesOverlap(start, end, b.start, b.end)));
    if (!free) return null;
    picked.push(free.id);
  }
  return picked;
}

/* ── slot computation ─────────────────────────────────────────────────────────────────── */

export function computeSlotsForDate(params: AvailabilityParams, dateISO: string): Slot[] {
  const zone = params.zone ?? BUSINESS_TZ;
  const nowMs = typeof params.now === "number" ? params.now : params.now.getTime();
  const { policy, durationMinutes } = params;
  if (durationMinutes <= 0) return [];

  const today = dayOf(nowMs, zone);
  if (dateISO < today) return [];
  if (diffDays(today, dateISO) > policy.maxAdvanceDays) return [];

  const hours = params.hours[weekdayOf(dateISO)];
  if (!hours || hours.closed) return [];

  const openMin = hhmmToMinutes(hours.open);
  const interval = Math.max(5, policy.slotIntervalMinutes);
  const earliestMs = nowMs + policy.minLeadTimeMinutes * 60_000;
  const holdMinutes = durationMinutes + policy.bufferMinutes;

  const msCache = new Map<number, number>();
  const toMs = (minute: number) => {
    let ms = msCache.get(minute);
    if (ms === undefined) {
      ms = zonedToDate(dateISO, minutesToHHmm(minute), zone).getTime();
      msCache.set(minute, ms);
    }
    return ms;
  };

  const byTime = new Map<number, Set<string>>();

  for (const staff of params.staff) {
    const windows = workingWindows(staff, dateISO, hours);
    if (windows.length === 0) continue;
    const staffBusy = params.busy.filter((b) => b.staffId === staff.staffId);

    for (const [winStart, winEnd] of windows) {
      // grid is anchored to opening time so slots read 10:00, 10:15, … regardless of shift start
      let t = openMin + Math.ceil((winStart - openMin) / interval) * interval;
      for (; t + durationMinutes <= winEnd; t += interval) {
        const startMs = toMs(t);
        if (startMs < earliestMs) continue;
        const blockedUntilMs = startMs + holdMinutes * 60_000;
        if (staffBusy.some((b) => rangesOverlap(startMs, blockedUntilMs, b.start, b.end))) continue;
        if (params.requiredResources.length > 0 && !pickResources(params, startMs, blockedUntilMs)) continue;
        let set = byTime.get(t);
        if (!set) byTime.set(t, (set = new Set()));
        set.add(staff.staffId);
      }
    }
  }

  return [...byTime.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([minute, staffSet]) => {
      const startMs = toMs(minute);
      return {
        time: minutesToHHmm(minute),
        startsAt: new Date(startMs),
        endsAt: new Date(startMs + durationMinutes * 60_000),
        blockedUntil: new Date(startMs + holdMinutes * 60_000),
        staffIds: [...staffSet],
      };
    });
}

/** Slot counts per day for a date range — drives the calendar's enabled/disabled days. */
export function computeRangeAvailability(params: AvailabilityParams, fromISO: string, toISO: string): Record<string, number> {
  const out: Record<string, number> = {};
  let cursor = fromISO;
  let guard = 0;
  while (cursor <= toISO && guard++ < 400) {
    out[cursor] = computeSlotsForDate(params, cursor).length;
    const [y, m, d] = cursor.split("-").map(Number);
    const next = new Date(Date.UTC(y, m - 1, d + 1));
    cursor = next.toISOString().slice(0, 10);
  }
  return out;
}

export type SlotValidation =
  | { ok: true; slot: Slot; staffId: string; resourceIds: string[] }
  | { ok: false; reason: "UNAVAILABLE" | "STAFF_UNAVAILABLE" };

/**
 * Server-side revalidation: is exactly this start time still bookable (optionally with this stylist)?
 * Called inside the booking transaction with freshly-loaded data, so the UI can never book a stale slot.
 */
export function validateSlot(params: AvailabilityParams, dateISO: string, time: string, staffId: string | "any", pickStaff?: (ids: string[]) => string): SlotValidation {
  const slot = computeSlotsForDate(params, dateISO).find((s) => s.time === time);
  if (!slot) return { ok: false, reason: "UNAVAILABLE" };
  let chosen: string;
  if (staffId === "any") {
    chosen = pickStaff ? pickStaff(slot.staffIds) : slot.staffIds[0]!;
  } else {
    if (!slot.staffIds.includes(staffId)) return { ok: false, reason: "STAFF_UNAVAILABLE" };
    chosen = staffId;
  }
  const resourceIds = pickResources(params, slot.startsAt.getTime(), slot.blockedUntil.getTime()) ?? [];
  return { ok: true, slot, staffId: chosen, resourceIds };
}

/**
 * Deterministic "any available stylist" rule (documented in the README):
 *   1. the customer's favourite stylist, if free
 *   2. otherwise the stylist with the fewest bookings that day (balances the workload)
 *   3. ties break on display order
 */
export function chooseAnyStaff(
  freeStaffIds: string[],
  ctx: { favouriteIds?: string[]; bookingsToday?: Record<string, number>; order?: string[] } = {},
): string {
  const fav = freeStaffIds.find((id) => ctx.favouriteIds?.includes(id));
  if (fav) return fav;
  const order = ctx.order ?? [];
  return [...freeStaffIds].sort((a, b) => {
    const diff = (ctx.bookingsToday?.[a] ?? 0) - (ctx.bookingsToday?.[b] ?? 0);
    if (diff !== 0) return diff;
    const ia = order.indexOf(a);
    const ib = order.indexOf(b);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib) || a.localeCompare(b);
  })[0]!;
}

/** Convenience used by the seed and tests to turn a Booking-like row into a busy block. */
export function toBusyBlock(b: { staffId: string; startsAt: Date; blockedUntil: Date }): BusyBlock {
  return { staffId: b.staffId, start: b.startsAt.getTime(), end: b.blockedUntil.getTime() };
}
