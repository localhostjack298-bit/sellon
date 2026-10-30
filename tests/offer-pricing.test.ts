import { describe, expect, it } from "vitest";
import { computeDiscountPaise, describeOffer } from "@/features/offers/pricing";

describe("offer pricing (integer paise)", () => {
  it("calculates percentage discounts without float drift", () => {
    expect(computeDiscountPaise({ type: "PERCENTAGE", value: 15 }, 120_000)).toBe(18_000); // ₹1,200 → ₹180
    expect(computeDiscountPaise({ type: "PERCENTAGE", value: 33.33 }, 99_99)).toBe(Math.floor((9999 * 33.33) / 100));
  });

  it("caps with maxDiscount and never exceeds the subtotal", () => {
    expect(computeDiscountPaise({ type: "PERCENTAGE", value: 50, maxDiscount: 300 }, 200_000)).toBe(30_000);
    expect(computeDiscountPaise({ type: "FIXED_AMOUNT", value: 500 }, 40_000)).toBe(40_000);
  });

  it("applies the minimum spend rule", () => {
    const rule = { type: "PERCENTAGE", value: 12, minSpend: 3000 } as const;
    expect(computeDiscountPaise(rule, 299_999)).toBe(0);
    expect(computeDiscountPaise(rule, 300_000)).toBe(36_000);
  });

  it("is safe for empty carts and nonsense values", () => {
    expect(computeDiscountPaise({ type: "PERCENTAGE", value: 10 }, 0)).toBe(0);
    expect(computeDiscountPaise({ type: "PERCENTAGE", value: 250 }, 10_000)).toBe(10_000);
    expect(computeDiscountPaise({ type: "FIXED_AMOUNT", value: -5 }, 10_000)).toBe(0);
  });

  it("describes offers for humans", () => {
    expect(describeOffer({ type: "PERCENTAGE", value: 15, maxDiscount: 500 })).toBe("15% off (up to ₹500)");
    expect(describeOffer({ type: "FIXED_AMOUNT", value: 400 })).toBe("₹400 off");
  });
});
