"use client";
import { ArrowRight } from "lucide-react";
import { StarMark } from "@/components/brand/logo";
import { CtaLink } from "@/components/public/cta";
import { SectionHeading } from "@/components/public/cta";
import { computeDiscountPaise } from "@/features/offers/pricing";

interface Offer {
  title: string;
  subtitle: string | null;
  description: string;
  terms: string | null;
  code: string | null;
  type: "PERCENTAGE" | "FIXED_AMOUNT";
  value: number;
  maxDiscount: number | null;
  minSpend: number | null;
  badge: string | null;
}

export function Offers({ offers }: { offers: Offer[] }) {
  const live = offers.filter((o) => true);
  return (
    <section aria-label="Offers and promotions" className="py-20 lg:py-28 relative overflow-hidden">
      <SectionHeading
        eyebrow="Current offers"
        title="Seasonal promotions"
        intro="Sample offers — published from Admin → Offers & banners and applied automatically when you book."
        align="left"
        className="mb-12 max-w-2xl"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {live.map((o, i) => (
          <article key={o.title} className="relative group rounded-lg border border-line bg-surface overflow-hidden shadow-card transition-border duration-300 hover:border-fg/60">
            <div className="relative aspect-[16/9] bg-surface-3">
              <StarMark className="absolute -right-3 -top-3 size-16 text-brand/20" />
              <span className="absolute top-4 left-4 rounded-full border border-line-strong bg-surface px-2.5 py-0.5 text-[0.68rem] font-bold text-muted">{o.badge}</span>
            </div>
            <div className="p-5">
              <h3 className="text-lg font-bold text-fg">{o.title}</h3>
              {o.subtitle ? <p className="mt-1 text-[0.85rem] font-medium text-fg-2">{o.subtitle}</p> : null}
              <p className="mt-3 text-sm text-muted">{o.description}</p>
              {o.code ? (
                <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-3 py-1.5 text-[0.7rem] font-bold text-brand-text">
                  <span className="w-[0.8rem] h-[0.8rem] rounded-full bg-brand-text" aria-hidden />
                  CODE: {o.code}
                </div>
              ) : null}
              <p className="mt-auto pt-4 border-t border-line text-xs text-subtle">{o.terms}</p>
            </div>
            <div className="px-5 pb-4">
              <CtaLink href="/book" variant="ghost" size="md" className="text-brand-text border-transparent hover:bg-brand-soft hover:text-brand-hover">
                Book this offer <ArrowRight className="size-4 group-hover/btn:translate-x-0.5" />
              </CtaLink>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
