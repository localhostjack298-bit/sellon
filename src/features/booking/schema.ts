/**
 * Zod schemas for the multi-step booking flow. Server actions validate every submission;
 * the client form uses the same schemas via react-hook-form/zod resolver.
 */
import { z } from "zod";
import { todayISO } from "@/lib/dates";

const referenceLike = z.string().min(1);

export const BookingServiceSelectionSchema = z.object({
  serviceIds: z.array(z.string().uuid()).min(1, "Select at least one service."),
});

export const BookingStaffSelectionSchema = z.object({
  staffId: z.string().uuid(),
});

export const BookingSlotSelectionSchema = z.object({
  date: z.string().refine((d) => /^\d{4}-\d{2}-\d{2}$/.test(d), "Pick a valid date."),
  time: z.string().refine((t) => /^\d{2}:\d{2}$/.test(t), "Pick a valid time."),
});

export const BookingDetailsSchema = z.object({
  fullName: z.string().min(2, "Tell us your name.").optional(),
  email: z.string().email("Enter a valid email address.").optional(),
  phone: z.string().min(6, "Enter a phone number.").optional(),
  note: z.string().max(500).optional(),
  /** Applied coupon code, if any. */
  couponCode: z.string().optional(),
});

export const BookingConfirmSchema = z.object({
  bookingId: referenceLike,
  /** Idempotency-ish token the client echoes back; the action checks the booking is still open. */
  confirmToken: referenceLike,
});

export const BookingRescheduleSchema = z.object({
  bookingId: referenceLike,
  date: z.string(),
  time: z.string(),
});

export const BookingCancelSchema = z.object({
  bookingId: referenceLike,
});

export const BookingCheckInSchema = z.object({
  bookingId: referenceLike,
});

export const BookingStatusSchema = z.object({
  bookingId: referenceLike,
  status: z.enum(["CONFIRMED", "CHECKED_IN", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"]),
  note: z.string().optional(),
});

export type BookingServiceSelection = z.infer<typeof BookingServiceSelectionSchema>;
export type BookingStaffSelection = z.infer<typeof BookingStaffSelectionSchema>;
export type BookingSlotSelection = z.infer<typeof BookingSlotSelectionSchema>;
export type BookingDetails = z.infer<typeof BookingDetailsSchema>;
export type BookingConfirm = z.infer<typeof BookingConfirmSchema>;
export type BookingReschedule = z.infer<typeof BookingRescheduleSchema>;
export type BookingCancel = z.infer<typeof BookingCancelSchema>;
export type BookingCheckIn = z.infer<typeof BookingCheckInSchema>;
export type BookingStatusInput = z.infer<typeof BookingStatusSchema>;
