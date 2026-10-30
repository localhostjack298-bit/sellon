/**
 * Offer maths — PURE and integer-paise based (no floating point money).
 * Used by the booking pricing service, the live booking summary, and the seed.
 */
export interface OfferRule {
  type: "PERCENTAGE" | "FIXED_AMOUNT";
  /** Percentage (0–100) or rupee amount. */
  value: number;
  /** Cap on the discount in rupees (optional). */
  maxDiscount?: number | null;
  /** Minimum eligible spend in rupees (optional). */
  minSpend?: number | null;
}

/** Discount in paise for an eligible subtotal in paise. Never exceeds the subtotal; never negative. */
export function computeDiscountPaise(rule: OfferRule, eligibleSubtotalPaise: number): number {
  if (eligibleSubtotalPaise <= 0) return 0;
  if (rule.minSpend && eligibleSubtotalPaise < Math.round(rule.minSpend * 100)) return 0;
  let discount =
    rule.type === "PERCENTAGE"
      ? Math.floor((eligibleSubtotalPaise * Math.min(100, Math.max(0, rule.value))) / 100)
      : Math.round(rule.value * 100);
  if (rule.maxDiscount) discount = Math.min(discount, Math.round(rule.maxDiscount * 100));
  return Math.max(0, Math.min(discount, eligibleSubtotalPaise));
}

export function describeOffer(rule: OfferRule): string {
  const base = rule.type === "PERCENTAGE" ? `${rule.value}% off` : `₹${rule.value.toLocaleString("en-IN")} off`;
  const extras: string[] = [];
  if (rule.maxDiscount && rule.type === "PERCENTAGE") extras.push(`up to ₹${rule.maxDiscount.toLocaleString("en-IN")}`);
  if (rule.minSpend) extras.push(`min. spend ₹${rule.minSpend.toLocaleString("en-IN")}`);
  return extras.length ? `${base} (${extras.join(", ")})` : base;
}
