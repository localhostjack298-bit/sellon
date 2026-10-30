import { describe, expect, it } from "vitest";
import {
  chooseAnyStaff,
  computeSlotsForDate,
  pickResources,
  validateSlot,
  workingWindows,
  type AvailabilityParams,
  type DayHours,
  type StaffSchedule,
} from "@/features/booking/availability";
import { zonedToDate } from "@/lib/dates";

// 2026-11-04 is a Wednesday (ISO weekday 3). "Now" = Monday 2 Nov 2026, 09:00 IST.
const NOW = zonedToDate("2026-11-02", "09:00");
const WED = "2026-11-04";
const SUN = "2026-11-08";

const open: DayHours = { open: "10:00", close: "20:00", closed: false };
const HOURS: Record<number, DayHours> = {
  1: open, 2: open, 3: open, 4: open, 5: open, 6: open,
  7: { open: "11:00", close: "18:00", closed: true },
};

const stylist = (id: string, extra: Partial<StaffSchedule> = {}): StaffSchedule => ({
  staffId: id,
  weekly: [1, 2, 3, 4, 5, 6].map((weekday) => ({ weekday, start: "10:00", end: "19:00" })),
  breaks: [{ weekday: 3, start: "13:00", end: "14:00" }],
  shifts: [],
  leaves: [],
  ...extra,
});

const base = (overrides: Partial<AvailabilityParams> = {}): AvailabilityParams => ({
  now: NOW,
  hours: HOURS,
  policy: { slotIntervalMinutes: 15, bufferMinutes: 10, minLeadTimeMinutes: 120, maxAdvanceDays: 45 },
  staff: [stylist("a")],
  busy: [],
  resources: [],
  resourceBusy: [],
  requiredResources: [],
  durationMinutes: 60,
  ...overrides,
});

const times = (p: AvailabilityParams, date = WED) => computeSlotsForDate(p, date).map((s) => s.time);

describe("availability engine", () => {
  it("generates slots on the opening-anchored grid and respects the working window end", () => {
    const t = times(base());
    expect(t[0]).toBe("10:00");
    expect(t).toContain("10:15");
    // 60-minute service must finish by 19:00 → last start 18:00
    expect(t.at(-1)).toBe("18:00");
    expect(t).not.toContain("18:15");
  });

  it("removes slots that would overlap the lunch break", () => {
    const t = times(base());
    expect(t).toContain("12:00"); // 12:00–13:00 fits before lunch
    expect(t).not.toContain("12:15"); // would run into the 13:00 break
    expect(t).not.toContain("13:00");
    expect(t).toContain("14:00");
  });

  it("blocks a day when the branch is closed", () => {
    expect(times(base(), SUN)).toEqual([]);
  });

  it("blocks days in the past and beyond the booking horizon", () => {
    expect(times(base(), "2026-11-01")).toEqual([]);
    expect(times(base(), "2027-01-30")).toEqual([]);
  });

  it("applies the minimum lead time on the same day", () => {
    // now = 09:00 on the day itself; lead 120 min → first slot 11:00
    const sameDay = base({ now: zonedToDate(WED, "09:00") });
    expect(times(sameDay)[0]).toBe("11:00");
  });

  it("treats approved leave as unavailable", () => {
    const p = base({ staff: [stylist("a", { leaves: [{ startDate: "2026-11-03", endDate: "2026-11-05" }] })] });
    expect(times(p)).toEqual([]);
  });

  it("honours date-specific OFF shifts and EXTRA shifts", () => {
    const off = base({ staff: [stylist("a", { shifts: [{ date: WED, start: "10:00", end: "19:00", type: "OFF" }] })] });
    expect(times(off)).toEqual([]);

    const extra = base({ now: NOW, staff: [stylist("a", { shifts: [{ date: SUN, start: "11:00", end: "15:00", type: "EXTRA" }] })], hours: { ...HOURS, 7: { open: "11:00", close: "18:00", closed: false } } });
    expect(times(extra, SUN)[0]).toBe("11:00");
    expect(times(extra, SUN).at(-1)).toBe("14:00");
  });

  it("subtracts existing bookings including their buffer", () => {
    const booked = zonedToDate(WED, "11:00").getTime();
    // existing booking 11:00–12:00 + 10 min buffer → blocked until 12:10
    const p = base({ busy: [{ staffId: "a", start: booked, end: booked + 70 * 60_000 }] });
    const t = times(p);
    expect(t).not.toContain("10:00"); // 10:00–11:00 + its own 10-min buffer would touch the 11:00 booking
    expect(t).not.toContain("10:15");
    expect(t).not.toContain("12:00"); // starts inside the existing booking's buffer
    // the next free start is after the 13:00–14:00 lunch break (12:15 would run into lunch)
    expect(t[0]).toBe("14:00");
  });

  it("only offers stylists who are free and merges them per slot", () => {
    const booked = zonedToDate(WED, "10:00").getTime();
    const p = base({
      staff: [stylist("a"), stylist("b")],
      busy: [{ staffId: "a", start: booked, end: booked + 70 * 60_000 }],
    });
    const first = computeSlotsForDate(p, WED)[0]!;
    expect(first.time).toBe("10:00");
    expect(first.staffIds).toEqual(["b"]);
    const later = computeSlotsForDate(p, WED).find((s) => s.time === "14:00")!;
    expect(later.staffIds.sort()).toEqual(["a", "b"]);
  });

  it("requires a free resource unit for resource-bound services", () => {
    const start = zonedToDate(WED, "10:00").getTime();
    const resources = [{ id: "room-1", type: "FACIAL_ROOM" as const }];
    const p = base({
      requiredResources: ["FACIAL_ROOM"],
      resources,
      resourceBusy: [{ resourceId: "room-1", start, end: start + 70 * 60_000 }],
    });
    const t = times(p);
    expect(t).not.toContain("10:00");
    expect(t).not.toContain("10:45"); // still overlaps the room's 10:00–11:10 hold
    expect(t).toContain("11:15"); // room is free again
    // with a second room the original slot comes back
    const two = base({ requiredResources: ["FACIAL_ROOM"], resources: [...resources, { id: "room-2", type: "FACIAL_ROOM" as const }], resourceBusy: p.resourceBusy });
    expect(times(two)).toContain("10:00");
  });

  it("pickResources returns null when a required type has no free unit", () => {
    const params = { resources: [{ id: "x", type: "BRIDAL_SUITE" as const }], resourceBusy: [{ resourceId: "x", start: 0, end: 100 }], requiredResources: ["BRIDAL_SUITE" as const] };
    expect(pickResources(params, 50, 60)).toBeNull();
    expect(pickResources(params, 100, 160)).toEqual(["x"]);
  });

  it("validateSlot revalidates server-side and rejects a stale slot", () => {
    const booked = zonedToDate(WED, "11:00").getTime();
    const p = base({ busy: [{ staffId: "a", start: booked, end: booked + 70 * 60_000 }] });
    expect(validateSlot(p, WED, "11:00", "a").ok).toBe(false);
    const ok = validateSlot(p, WED, "14:00", "a");
    expect(ok.ok).toBe(true);
    expect(validateSlot(base(), WED, "14:00", "zzz")).toEqual({ ok: false, reason: "STAFF_UNAVAILABLE" });
  });

  it("longer services need a longer free window", () => {
    const t = times(base({ durationMinutes: 180 }));
    expect(t).toContain("14:00"); // 14:00–17:00
    expect(t).not.toContain("10:30"); // would cross the 13:00 lunch
    expect(t.at(-1)).toBe("16:00");
  });

  it("workingWindows clips to business hours and splits around breaks", () => {
    const w = workingWindows(stylist("a", { weekly: [{ weekday: 3, start: "09:00", end: "21:00" }] }), WED, HOURS[3]);
    expect(w).toEqual([[600, 780], [840, 1200]]);
  });

  it("chooseAnyStaff prefers the favourite, then the least busy stylist", () => {
    expect(chooseAnyStaff(["a", "b", "c"], { favouriteIds: ["c"] })).toBe("c");
    expect(chooseAnyStaff(["a", "b", "c"], { bookingsToday: { a: 3, b: 1, c: 2 } })).toBe("b");
    expect(chooseAnyStaff(["b", "a"], { order: ["a", "b"] })).toBe("a");
  });
});
