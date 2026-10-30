-- Booking & data integrity guarantees that Prisma's schema language cannot express.
-- Hand-written migration. Requires the `btree_gist` extension (a *trusted* extension in
-- PostgreSQL 13+, so the database owner can create it without superuser rights).

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Double-booking protection (concurrency-safe, enforced by the database itself)
-- ─────────────────────────────────────────────────────────────────────────────

-- A stylist can never hold two ACTIVE bookings whose [startsAt, blockedUntil) ranges overlap.
-- "blockedUntil" = end of service + configured buffer. Cancelled / no-show bookings release the slot.
ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_no_staff_overlap"
  EXCLUDE USING gist (
    "staffId" WITH =,
    tstzrange("startsAt", "blockedUntil", '[)') WITH &&
  ) WHERE ("status" NOT IN ('CANCELLED', 'NO_SHOW'));

-- A room / station can never be held by two bookings at the same time.
-- Rows are deleted when a booking is cancelled or rescheduled, which releases the resource.
ALTER TABLE "booking_resources"
  ADD CONSTRAINT "booking_resources_no_overlap"
  EXCLUDE USING gist (
    "resourceId" WITH =,
    tstzrange("startsAt", "blockedUntil", '[)') WITH &&
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Sanity constraints
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_time_order_chk" CHECK ("endsAt" > "startsAt" AND "blockedUntil" >= "endsAt"),
  ADD CONSTRAINT "bookings_money_chk" CHECK ("subtotal" >= 0 AND "discountAmount" >= 0 AND "total" >= 0),
  ADD CONSTRAINT "bookings_duration_chk" CHECK ("durationMinutes" > 0 AND "bufferMinutes" >= 0);

ALTER TABLE "booking_resources"
  ADD CONSTRAINT "booking_resources_time_order_chk" CHECK ("blockedUntil" > "startsAt");

ALTER TABLE "business_hours"
  ADD CONSTRAINT "business_hours_weekday_chk" CHECK ("weekday" BETWEEN 1 AND 7),
  ADD CONSTRAINT "business_hours_time_chk" CHECK (
    "opensAt" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' AND "closesAt" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
  );

ALTER TABLE "staff_availability"
  ADD CONSTRAINT "staff_availability_weekday_chk" CHECK ("weekday" BETWEEN 1 AND 7),
  ADD CONSTRAINT "staff_availability_time_chk" CHECK (
    "startTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' AND "endTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' AND "startTime" < "endTime"
  );

ALTER TABLE "staff_breaks"
  ADD CONSTRAINT "staff_breaks_time_chk" CHECK (
    "startTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' AND "endTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' AND "startTime" < "endTime"
  ),
  ADD CONSTRAINT "staff_breaks_scope_chk" CHECK ("weekday" IS NOT NULL OR "date" IS NOT NULL);

ALTER TABLE "shifts"
  ADD CONSTRAINT "shifts_time_chk" CHECK (
    "startTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' AND "endTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' AND "startTime" < "endTime"
  );

ALTER TABLE "attendance"
  ADD CONSTRAINT "attendance_late_chk" CHECK ("lateMinutes" >= 0);

ALTER TABLE "leave_requests"
  ADD CONSTRAINT "leave_requests_dates_chk" CHECK ("endDate" >= "startDate");

ALTER TABLE "payroll_periods"
  ADD CONSTRAINT "payroll_periods_month_chk" CHECK ("month" BETWEEN 1 AND 12);

ALTER TABLE "salary_records"
  ADD CONSTRAINT "salary_records_money_chk" CHECK (
    "baseSalary" >= 0 AND "allowances" >= 0 AND "bonuses" >= 0 AND "deductions" >= 0
  );

ALTER TABLE "salary_adjustments"
  ADD CONSTRAINT "salary_adjustments_amount_chk" CHECK ("amount" >= 0);

ALTER TABLE "offers"
  ADD CONSTRAINT "offers_window_chk" CHECK ("endsAt" > "startsAt"),
  ADD CONSTRAINT "offers_value_chk" CHECK ("value" > 0),
  ADD CONSTRAINT "offers_percentage_chk" CHECK ("type" <> 'PERCENTAGE' OR "value" <= 100);

ALTER TABLE "loyalty_accounts"
  ADD CONSTRAINT "loyalty_points_chk" CHECK ("pointsBalance" >= 0 AND "lifetimePoints" >= 0);
