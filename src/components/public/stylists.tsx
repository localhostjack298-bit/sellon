"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { StarMark } from "@/components/brand/logo";
import { SectionHeading } from "@/components/public/cta";
import type { StylistDTO } from "@/features/site/queries";

export function Stylists({ stylists }: { stylists: StylistDTO[] }) {
  return (
    <section aria-label="Meet the team" className="py-20 lg:py-28">
      <SectionHeading
        eyebrow="Meet the stylists"
        title="Artists who listen first"
        intro="Our team works with all hair types, skin tones and ages — each appointment starts with a consultation, never a template."
        align="left"
        className="mb-14 max-w-2xl"
      />

      <div className="relative grid gap-5 lg:grid-cols-4">
        {stylists.map((s, i) => (
          <div key={s.id} className="group rounded-xl border border-line bg-surface overflow-hidden shadow-card hover:shadow-pop transition-shadow duration-300">
            <div className="relative aspect-[3/4]">
              {s.portrait ? (
                <Image src={s.portrait.url} alt={`Portrait of ${s.name}`} fill sizes="(min-width:1024px) 25vw, 50vw" className="object-cover" />
              ) : (
                <div className="grid h-full place-items-center bg-sand text-ink dark:bg-surface-3 dark:text-sand">
                  <StarMark className="mx-auto size-10 text-brand-text/40" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-ink/40 to-ink/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-5 inset-x-5 flex justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-white px-2 py-1 text-[0.68rem] font-bold text-ink">{s.jobTitle}</span>
                {s.isBookable ? (
                  <Link href={`/services?stylist=${s.id}`} className="group flex items-center gap-1.5 rounded-full border border-white/60 bg-white px-3 py-1.5 text-[0.68rem] font-bold text-ink hover:bg-brand hover:text-brand-fg transition-colors">
                    Book {s.firstName} <ArrowRight className="size-3.5 group-hover/btn:translate-x-0.5" />
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-white px-2 py-1 text-[0.68rem] font-bold text-ink">In salon</span>
                )}
              </div>
            </div>
            <div className="p-5 pt-4">
              <h3 className="text-lg font-bold text-fg">{s.name}</h3>
              <p className="mt-1 text-[0.8rem] text-muted">{s.specialties.slice(0, 3).join(" · ")}</p>
              {s.bio ? <p className="mt-3 leading-relaxed text-muted">{s.bio}</p> : null}
              <div className="mt-5 flex gap-2">
                <StarMark className="size-3.5 text-brand-text/70" />
                <span className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-muted">{s.skillCategories.join(", ")}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
