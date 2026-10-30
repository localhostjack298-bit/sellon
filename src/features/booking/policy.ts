/**
 * Booking lifecycle rules — pure functions shared by the UI (to enable/disable buttons and explain why)
 * and by the server actions (to enforce them).
 */
export type BookingStatusKey = "PENDING" | "CONFIRMED" | "CHECKED_IN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

export const BOOKING_STATUSES: BookingStatusKey[] = ["PENDING", "CONFIRMED", "CHECKED_IN", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"];

export const STATUS_LABEL: Record<BookingStatusKey, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  CHECKED_IN: "Checked in",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No-show",
};

/** Statuses that hold a stylist's time (and a resource). */
export const ACTIVE_STATUSES: BookingStatusKey[] = ["PENDING", "CONFIRMED", "CHECKED_IN", "IN_PROGRESS"];
export const OPEN_STATUSES: BookingStatusKey[] = ["PENDING", "CONFIRMED"];
export const FINAL_STATUSES: BookingStatusKey[] = ["COMPLETED", "CANCELLED", "NO_SHOW"];

/** Allowed manual transitions (staff). Anything else is rejected server-side. */
export const STATUS_TRANSITIONS: Record<BookingStatusKey, BookingStatusKey[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["CHECKED_IN", "IN_PROGRESS", "CANCELLED", "NO_SHOW"],
  CHECKED_IN: ["IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"],
  IN_PROGRESS: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: ["CONFIRMED"], // an accidental no-show can be reverted
};

export function canTransition(from: BookingStatusKey, to: BookingStatusKey): boolean {
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export interface PolicyLike {
  cancellationWindowHours: number;
  rescheduleWindowHours: number;
  maxReschedules: number;
}

export interface Decision {
  allowed: boolean;
  reason?: string;
}

const HOUR = 3_600_000;

/** Customer-facing cancellation rule. Staff with `appointments.cancel` bypass the time window. */
export function customerCanCancel(
  booking: { status: BookingStatusKey; startsAt: Date | number },
  policy: PolicyLike,
  now: Date | number = Date.now(),
): Decision {
  if (!OPEN_STATUSES.includes(booking.status)) return { allowed: false, reason: "This appointment can no longer be cancelled online." };
  const msUntil = new Date(booking.startsAt).getTime() - new Date(now).getTime();
  if (msUntil <= 0) return { allowed: false, reason: "This appointment has already started." };
  if (msUntil < policy.cancellationWindowHours * HOUR) {
    return {
      allowed: false,
      reason: `Online cancellation closes ${policy.cancellationWindowHours} hours before your appointment. Please call the salon.`,
    };
  }
  return { allowed: true };
}

export function customerCanReschedule(
  booking: { status: BookingStatusKey; startsAt: Date | number; rescheduleCount: number },
  policy: PolicyLike,
  now: Date | number = Date.now(),
): Decision {
  if (!OPEN_STATUSES.includes(booking.status)) return { allowed: false, reason: "This appointment can no longer be rescheduled." };
  if (booking.rescheduleCount >= policy.maxReschedules) {
    return { allowed: false, reason: `You've reached the limit of ${policy.maxReschedules} reschedules. Please call the salon.` };
  }
  const msUntil = new Date(booking.startsAt).getTime() - new Date(now).getTime();
  if (msUntil <= 0) return { allowed: false, reason: "This appointment has already started." };
  if (msUntil < policy.rescheduleWindowHours * HOUR) {
    return { allowed: false, reason: `Rescheduling closes ${policy.rescheduleWindowHours} hours before your appointment. Please call the salon.` };
  }
  return { allowed: true };
}

/** Booking reference like SFS-7K3M9Q (unambiguous alphabet: no 0/O/1/I). */
const REF_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
export function generateReference(random: () => number = Math.random): string {
  let out = "";
  for (let i = 0; i < 6; i++) out += REF_ALPHABET[Math.floor(random() * REF_ALPHABET.length)];
  return `SFS-${out}`;
}
