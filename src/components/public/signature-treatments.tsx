"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { StarMark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import { CtaLink } from "@/components/public/cta";
import { SectionHeading } from "@/components/public/cta";

interface Treatment {
  slug: string;
  numeral: string;
  title: string;
  desc: string;
  media: { url: string; alt: string } | null;
}

export function SignatureTreatments({ treatments }: { treatments: Treatment[] }) {
  return (
    <section aria-label="Signature treatments" className="py-24 lg:py-32 relative overflow-hidden">
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-ink via-ink/90 to-ink pointer-events-none" />
      <SectionHeading
        eyebrow="Signature rituals"
        title={<>
          Three appointments worth planning ahead for
          <br />
          <span className="eyebrow ml-1 mt-3 inline-block flex items-center gap-2 text-brand-text">
            <ArrowRight className="size-4" /> Sample treatments — pricing shown is illustrative
          </span>
        </>}
        intro="Longer, more considered services with a dedicated specialist, from balayage and smoothing treatments to full bridal mornings."
        align="left"
        tone="light"
        className="mb-12 z-10 relative max-w-2xl"
      />

      <div className="z-10 relative">
        <ul className="flex gap-6 lg:gap-8">
          {treatments.map((t) => (
            <li key={t.slug} className="flex flex-col gap-5">
              <div className="relative aspect-[3/4] group rounded-arch overflow-hidden border border-white/10 bg-surface-2">
                {t.media ? (
                  <Image src={t.media.url} alt={t.media.alt} fill sizes="(min-width:1024px) 32vw, 90vw" className="dim-in-dark object-cover object-center" />
                ) : (
                  <div className="grid h-full place-items-center bg-white/5 text-white/30">
                    <StarMark className="mx-auto size-12 text-brand-text/30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-ink/90 to-transparent">
                  <span className="inline-flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.24em] text-brand-text">
                    <span className="border border-brand/50 px-1 py-0.5 rounded text-brand-text">{t.numeral}</span>{t.title}
                  </span>
                </div>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-6 grid place-items-center">
                  <Link href={`/services/${t.slug}`} className="rounded-full bg-brand px-4 py-2 text-xs font-bold text-brand-fg hover:bg-brand-hover transition-colors">
                    Book now <ArrowRight className="size-3.5 ml-1" />
                  </Link>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-white/70">{t.desc}</p>
            </li>
          ) ) }
        </ul>
      </div>

      <div className="mt-16 z-10 relative flex items-center gap-3">
        <span className="h-[1px] flex-1 bg-white/10" aria-hidden />
        <span className="flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-ink/60 text-xs font-bold text-white">
          Book ahead — these appointments fill quickly
        </span>
        <span className="h-[1px] flex-1 bg-white/10" aria-hidden />
      </div>
    </section>
  );
}
