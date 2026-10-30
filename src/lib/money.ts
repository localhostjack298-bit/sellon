/**
 * Money helpers. All amounts are INR.
 *
 * Server-side arithmetic uses Prisma `Decimal` (see `features/payroll/calc.ts`); these helpers are
 * for *display* and for the integer-paise maths used by live previews in client forms, so no
 * floating-point rounding ever reaches the database.
 */

const inrWhole = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const inrFraction = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const inrCompact = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", notation: "compact", maximumFractionDigits: 1 });

export type MoneyLike = number | string | { toString(): string } | null | undefined;

export function toNumber(value: MoneyLike): number {
  if (value === null || value === undefined || value === "") return 0;
  const n = typeof value === "number" ? value : Number(value.toString());
  return Number.isFinite(n) ? n : 0;
}

export function formatINR(value: MoneyLike, opts: { decimals?: boolean; compact?: boolean } = {}): string {
  const n = toNumber(value);
  if (opts.compact) return inrCompact.format(n);
  return (opts.decimals ? inrFraction : Number.isInteger(n) ? inrWhole : inrFraction).format(n);
}

/** "₹1,200" or, for ranges, "From ₹1,200". */
export function formatFromPrice(value: MoneyLike): string {
  return `From ${formatINR(value)}`;
}

/** Parse a user-entered amount ("1,250.50") into integer paise. Returns null for invalid input. */
export function parseToPaise(input: string | number | null | undefined): number | null {
  if (input === null || input === undefined || input === "") return 0;
  const cleaned = String(input).replace(/[₹,\s]/g, "");
  if (!/^-?\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const negative = cleaned.startsWith("-");
  const [whole, frac = ""] = cleaned.replace("-", "").split(".");
  const paise = Number(whole) * 100 + Number(frac.padEnd(2, "0"));
  return negative ? -paise : paise;
}

export function paiseToString(paise: number): string {
  const sign = paise < 0 ? "-" : "";
  const abs = Math.abs(paise);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

export function formatPaise(paise: number, decimals = true): string {
  return formatINR(paise / 100, { decimals });
}
