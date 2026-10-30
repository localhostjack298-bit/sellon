import { describe, expect, it } from "vitest";
import { canTransition, customerCanCancel, customerCanReschedule, generateReference } from "@/features/booking/policy";

const policy = { cancellationWindowHours: 4, rescheduleWindowHours: 6, maxReschedules: 2 };
const now = new Date("2026-11-02T04:00:00Z");
const inHours = (h: number) => new Date(now.getTime() + h * 3_600_000);

describe("booking policy", () => {
  it("allows cancellation outside the window and blocks it inside", () => {
    expect(customerCanCancel({ status: "CONFIRMED", startsAt: inHours(10) }, policy, now).allowed).toBe(true);
    const late = customerCanCancel({ status: "CONFIRMED", startsAt: inHours(2) }, policy, now);
    expect(late.allowed).toBe(false);
    expect(late.reason).toMatch(/4 hours/);
  });

  it("blocks cancelling finished or already-cancelled bookings", () => {
    for (const status of ["COMPLETED", "CANCELLED", "NO_SHOW", "IN_PROGRESS", "CHECKED_IN"] as const) {
      expect(customerCanCancel({ status, startsAt: inHours(48) }, policy, now).allowed).toBe(false);
    }
  });

  it("enforces reschedule window and maximum reschedules", () => {
    expect(customerCanReschedule({ status: "PENDING", startsAt: inHours(24), rescheduleCount: 0 }, policy, now).allowed).toBe(true);
    expect(customerCanReschedule({ status: "PENDING", startsAt: inHours(3), rescheduleCount: 0 }, policy, now).allowed).toBe(false);
    expect(customerCanReschedule({ status: "CONFIRMED", startsAt: inHours(24), rescheduleCount: 2 }, policy, now).allowed).toBe(false);
  });

  it("only permits sensible status transitions", () => {
    expect(canTransition("CONFIRMED", "CHECKED_IN")).toBe(true);
    expect(canTransition("CHECKED_IN", "COMPLETED")).toBe(true);
    expect(canTransition("COMPLETED", "CANCELLED")).toBe(false);
    expect(canTransition("CANCELLED", "CONFIRMED")).toBe(false);
    expect(canTransition("NO_SHOW", "CONFIRMED")).toBe(true);
  });

  it("generates readable, unambiguous references", () => {
    const ref = generateReference();
    expect(ref).toMatch(/^SFS-[2-9A-HJ-NP-Z]{6}$/);
  });
});
