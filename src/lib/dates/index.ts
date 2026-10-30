/**
 * Date & time helpers — isomorphic (server + client).
 *
 * Rules of the road:
 *  • Instants are stored as UTC `timestamptz` and displayed in the *branch* timezone (default Asia/Kolkata).
 *  • Calendar days are passed around as ISO date strings (`YYYY-MM-DD`) that mean "branch-local day".
 *  • `@db.Date` columns are mapped with `dateOnlyToDate` / `dateToDateOnly` (UTC midnight) so they never shift.
 *  • Time-of-day is an "HH:mm" string in branch-local time.
 */
import { DateTime } from "luxon";

export const BUSINESS_TZ = "Asia/Kolkata";
const LOCALE = "en-US";

export type DateInput = Date | string | number;

export function toZoned(input: DateInput, zone = BUSINESS_TZ): DateTime {
  const dt =
    input instanceof Date ? DateTime.fromJSDate(input) : typeof input === "number" ? DateTime.fromMillis(input) : DateTime.fromISO(input);
  return dt.setZone(zone).setLocale(LOCALE);
}

export function nowZ(zone = BUSINESS_TZ): DateTime {
  return DateTime.now().setZone(zone).setLocale(LOCALE);
}

/** Today's branch-local calendar date as `YYYY-MM-DD`. */
export function todayISO(zone = BUSINESS_TZ): string {
  return nowZ(zone).toISODate()!;
}

export function isISODate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && DateTime.fromISO(value).isValid;
}

export function isHHmm(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

/** `YYYY-MM-DD` → Date at UTC midnight (what Prisma stores for `@db.Date`). */
export function dateOnlyToDate(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

/** Date from a `@db.Date` column → `YYYY-MM-DD`. */
export function dateToDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Combine a branch-local calendar day + "HH:mm" into the exact UTC instant. */
export function zonedToDate(iso: string, hhmm: string, zone = BUSINESS_TZ): Date {
  const [hour, minute] = hhmm.split(":").map(Number);
  return DateTime.fromISO(iso, { zone }).set({ hour, minute, second: 0, millisecond: 0 }).toJSDate();
}

/** Branch-local calendar day of an instant. */
export function dayOf(input: DateInput, zone = BUSINESS_TZ): string {
  return toZoned(input, zone).toISODate()!;
}

/** "HH:mm" (branch-local) of an instant. */
export function hhmmOf(input: DateInput, zone = BUSINESS_TZ): string {
  return toZoned(input, zone).toFormat("HH:mm");
}

export function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToHHmm(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** ISO weekday: 1 = Monday … 7 = Sunday. */
export function weekdayOf(iso: string): number {
  return DateTime.fromISO(iso, { zone: "utc" }).weekday;
}

export function addDays(iso: string, days: number): string {
  return DateTime.fromISO(iso, { zone: "utc" }).plus({ days }).toISODate()!;
}

export function addMonths(iso: string, months: number): string {
  return DateTime.fromISO(iso, { zone: "utc" }).plus({ months }).toISODate()!;
}

/** Monday of the week containing `iso`. */
export function startOfWeek(iso: string): string {
  return DateTime.fromISO(iso, { zone: "utc" }).startOf("week").toISODate()!;
}

export function startOfMonth(iso: string): string {
  return DateTime.fromISO(iso, { zone: "utc" }).startOf("month").toISODate()!;
}

export function endOfMonth(iso: string): string {
  return DateTime.fromISO(iso, { zone: "utc" }).endOf("month").toISODate()!;
}

export function eachDay(fromISO: string, toISO: string): string[] {
  const out: string[] = [];
  let cursor = DateTime.fromISO(fromISO, { zone: "utc" });
  const end = DateTime.fromISO(toISO, { zone: "utc" });
  while (cursor <= end) {
    out.push(cursor.toISODate()!);
    cursor = cursor.plus({ days: 1 });
  }
  return out;
}

export function diffDays(fromISO: string, toISO: string): number {
  return Math.round(DateTime.fromISO(toISO, { zone: "utc" }).diff(DateTime.fromISO(fromISO, { zone: "utc" }), "days").days);
}

export function todayISOString(zone = BUSINESS_TZ): string {
  return todayISO(zone);
}

export function addDaysISO(iso: string, days: number): string {
  return addDays(iso, days);
}

export function zonedToDateISO(iso: string, hhmm: string, zone = BUSINESS_TZ): string {
  return zonedToDate(iso, hhmm, zone).toISOString();
}

export function rangeDays(fromISO: string, toISO: string): string[] {
  return eachDay(fromISO, toISO);
}

/** `YYYY-MM` → { from, to, year, month, label } */
export function monthBounds(yyyyMm: string) {
  const start = DateTime.fromISO(`${yyyyMm}-01`, { zone: "utc" });
  return {
    year: start.year,
    month: start.month,
    from: start.toISODate()!,
    to: start.endOf("month").toISODate()!,
    label: start.setLocale(LOCALE).toFormat("LLLL yyyy"),
    days: start.daysInMonth ?? 30,
  };
}

export function isYearMonth(value: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function currentYearMonth(zone = BUSINESS_TZ): string {
  return nowZ(zone).toFormat("yyyy-MM");
}

export function shiftYearMonth(yyyyMm: string, delta: number): string {
  return DateTime.fromISO(`${yyyyMm}-01`, { zone: "utc" }).plus({ months: delta }).toFormat("yyyy-MM");
}

/* ── Formatting (always branch-local, always en-US names, day-month order) ───────────── */

export const fmt = {
  time: (d: DateInput, zone = BUSINESS_TZ) => toZoned(d, zone).toFormat("h:mm a"),
  timeRange: (a: DateInput, b: DateInput, zone = BUSINESS_TZ) => `${toZoned(a, zone).toFormat("h:mm")} – ${toZoned(b, zone).toFormat("h:mm a")}`,
  date: (d: DateInput, zone = BUSINESS_TZ) => toZoned(d, zone).toFormat("ccc, d LLL yyyy"),
  dateLong: (d: DateInput, zone = BUSINESS_TZ) => toZoned(d, zone).toFormat("cccc, d LLLL yyyy"),
  dateShort: (d: DateInput, zone = BUSINESS_TZ) => toZoned(d, zone).toFormat("d LLL"),
  dayNum: (d: DateInput, zone = BUSINESS_TZ) => toZoned(d, zone).toFormat("d"),
  weekdayShort: (d: DateInput, zone = BUSINESS_TZ) => toZoned(d, zone).toFormat("ccc"),
  month: (d: DateInput, zone = BUSINESS_TZ) => toZoned(d, zone).toFormat("LLLL yyyy"),
  dateTime: (d: DateInput, zone = BUSINESS_TZ) => toZoned(d, zone).toFormat("d LLL yyyy, h:mm a"),
  dateTimeShort: (d: DateInput, zone = BUSINESS_TZ) => toZoned(d, zone).toFormat("d LLL, h:mm a"),
  /** For `@db.Date` values / ISO day strings (no timezone shift). */
  day: (iso: string) => DateTime.fromISO(iso, { zone: "utc" }).setLocale(LOCALE).toFormat("ccc, d LLL yyyy"),
  dayShort: (iso: string) => DateTime.fromISO(iso, { zone: "utc" }).setLocale(LOCALE).toFormat("d LLL"),
  dayLong: (iso: string) => DateTime.fromISO(iso, { zone: "utc" }).setLocale(LOCALE).toFormat("cccc, d LLLL yyyy"),
  hhmm: (hhmm: string) => {
    const [h, m] = hhmm.split(":").map(Number);
    const suffix = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
  },
};

export function relativeTime(input: DateInput, now: DateTime = DateTime.now()): string {
  const dt = toZoned(input);
  const diff = dt.diff(now, ["days", "hours", "minutes"]);
  const mins = Math.round(diff.as("minutes"));
  const abs = Math.abs(mins);
  const unit = abs < 60 ? [abs, "min"] : abs < 60 * 24 ? [Math.round(abs / 60), "h"] : [Math.round(abs / 1440), "d"];
  if (abs < 1) return "just now";
  return mins < 0 ? `${unit[0]} ${unit[1]} ago` : `in ${unit[0]} ${unit[1]}`;
}

/** Weekday names indexed by ISO weekday (1–7). */
export const WEEKDAYS = [
  { id: 1, short: "Mon", long: "Monday" },
  { id: 2, short: "Tue", long: "Tuesday" },
  { id: 3, short: "Wed", long: "Wednesday" },
  { id: 4, short: "Thu", long: "Thursday" },
  { id: 5, short: "Fri", long: "Friday" },
  { id: 6, short: "Sat", long: "Saturday" },
  { id: 7, short: "Sun", long: "Sunday" },
] as const;

export function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}
