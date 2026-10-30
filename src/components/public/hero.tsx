"use client";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { ArrowDown } from "lucide-react";
import { StarMark } from "@/components/brand/logo";
import { CtaLink } from "@/components/public/cta";
import { FadeIn } from "@/components/ui/motion";
import type { MediaDTO } from "@/features/site/queries";

const ease = [0.22, 1, 0.36, 1] as const;

export interface HeroContent {
  eyebrow: string;
  lines: string[];
  subheadline: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  highlights: string[];
}

export function Hero({ content, desktop, mobile }: { content: HeroContent; desktop: MediaDTO | null; mobile: MediaDTO | null }) {
  const reduce = useReducedMotion();
  const [l1, l2, l3] = content.lines;
  const line = (i: number, text: string | undefined, cls: string) =>
    text ? (
      <span className="block overflow-hidden pb-[0.1em] -mb-[0.1em]">
        <motion.span
          className={`block ${cls}`}
          initial={reduce ? false : { y: "110%" }}
          animate={{ y: 0 }}
          transition={{ duration: 1.1, delay: 0.25 + i * 0.13, ease }}
        >
          {text}
        </motion.span>
      </span>
    ) : null;

  return (
    <section className="relative isolate flex min-h-[100svh] overflow-hidden bg-ink text-sand">
      <div className="absolute inset-0 -z-10">
        {desktop ? (
          <Image src={desktop.url} alt={desktop.alt} fill priority sizes="100vw" quality={85}
            className="hidden object-cover object-[78%_30%] md:block motion-safe:animate-slow-zoom" />
        ) : null}
        {mobile ? (
          <Image src={mobile.url} alt={mobile.alt} fill priority sizes="100vw" quality={75}
            className="object-cover object-[50%_35%] md:hidden motion-safe:animate-slow-zoom" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-r from-ink/80 via-ink/35 to-transparent max-md:from-ink/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/25 to-transparent md:from-ink/70 md:via-transparent" />
      </div>

      <div className="shell relative flex w-full flex-col justify-end pb-24 pt-48 md:justify-center md:pb-20 md:pt-40">
        <FadeIn delay={0.1}>
          <p className="eyebrow mb-7 flex items-center gap-3 text-sand/80">
            <StarMark className="size-3.5 text-brand" />
            {content.eyebrow}
          </p>
        </FadeIn>

        <h1 aria-label={content.lines.join(" ")} className="max-w-[16ch] md:max-w-none">
          {line(0, l1, "display-1 text-sand")}
          {line(1, l2, "display-1 text-sand md:pl-[0.9em]")}
          {line(2, l3, "display-3 mt-5 !font-normal italic text-sand/90 md:pl-[1.6em] md:!text-[clamp(1.6rem,3vw,2.6rem)]")}
        </h1>

        <FadeIn delay={0.9} className="mt-9 max-w-lg">
          <p className="text-[1.05rem] leading-relaxed text-sand/80">{content.subheadline}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <CtaLink href="/book" size="xl">{content.primaryCtaLabel}</CtaLink>
            <CtaLink href="/services" variant="secondary" size="xl" arrow={false}
              className="border-sand/60 text-sand hover:bg-sand hover:text-ink">{content.secondaryCtaLabel}</CtaLink>
          </div>
        </FadeIn>

        <FadeIn delay={1.2} className="mt-14 hidden md:block">
          <ul className="flex flex-wrap gap-x-8 gap-y-2 text-[0.7rem] font-bold uppercase tracking-[0.22em] text-sand/60">
            {content.highlights.map((h) => (
              <li key={h} className="flex items-center gap-2.5"><span className="size-1 rounded-full bg-brand" aria-hidden />{h}</li>
            ))}
          </ul>
        </FadeIn>
      </div>

      <a href="#explore" aria-label="Scroll to services" className="absolute bottom-7 right-8 hidden items-center gap-3 text-[0.68rem] font-bold uppercase tracking-[0.24em] text-sand/70 transition-colors hover:text-sand lg:flex">
        Explore <span className="grid size-9 place-items-center rounded-full border border-sand/30"><ArrowDown className="size-4" /></span>
      </a>
    </section>
  );
}
