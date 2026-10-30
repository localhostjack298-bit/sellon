"use client";
import Image from "next/image";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { StarMark } from "@/components/brand/logo";
import { SectionHeading } from "@/components/public/cta";

interface Item {
  id: string;
  title: string;
  caption: string | null;
  category: "INTERIOR" | "HAIRSTYLE" | "MAKEUP" | "TREATMENT" | "BEFORE_AFTER";
  asset: { url: string; alt: string };
  before: { url: string; alt: string } | null;
  isFeatured: boolean;
}

export function Gallery({ items }: { items: Item[] }) {
  const CATEGORY_LABEL: Record<string, string> = {
    INTERIOR: "Interior",
    HAIRSTYLE: "Hairstyle",
    MAKEUP: "Makeup",
    TREATMENT: "Treatment",
    BEFORE_AFTER: "Before & after",
  };
  const byCat: Record<string, Item[]> = {};
  for (const item of items) {
    (byCat[item.category] ??= []).push(item);
  }

  return (
    <section aria-label="Gallery" className="py-20 lg:py-28">
      <SectionHeading
        eyebrow="Gallery"
        title="Work in progress"
        intro="Illustrative demo imagery — a glimpse of the room, the craft and the looks we build together."
        align="left"
        className="mb-10 max-w-2xl"
      />
      <p className="mb-10 max-w-xs text-xs text-muted">{Object.values(byCat).flat().filter((i) => i.before).length ? "Before &amp; after images are illustrative examples only." : null}</p>

      {Object.entries(byCat).map(([category, group]) => (
        <div key={category} className="mb-14">
          <h2 className="mb-8 text-[1.4rem] font-bold text-fg">{CATEGORY_LABEL[category]}</h2>
          <div className="relative grid gap-5 lg:gap-6">
            {group.map((item, i) => {
              const before = item.category === "BEFORE_AFTER" && item.before;
              const ratio = before ? 3 / 4 : item.asset.url.includes("heroMobile") ? 4 / 5 : 4 / 3;
              const isPortrait = item.asset.url.includes("experience-interior") || item.asset.url.includes("hero-mobile") || item.asset.url.includes("heroMobile");
              return (
                <div
                  key={item.id}
                  className={cn(
                    "group relative overflow-hidden rounded-lg bg-surface-3",
                    i % 3 === 0 ? "aspect-[4/5]" : i % 3 === 1 ? "aspect-[3/4]" : "aspect-[4/3]",
                    item.isFeatured ? "ring-1 ring-brand" : "",
                  )}
                >
                  {before ? (
                    <div className="absolute inset-0">
                      <Image src={before.url} alt={`Before: ${item.title}`} fill sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 90vw" className="object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <Image src={item.asset.url} alt={item.asset.alt} fill sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 90vw" className="object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent" />
                      <div className="absolute bottom-6 left-6 flex gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-white px-2 py-0.5 text-[0.68rem] font-bold text-ink">Before</span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-white px-2 py-0.5 text-[0.68rem] font-bold text-ink">After</span>
                      </div>
                    </div>
                  ) : (
                    <Image src={item.asset.url} alt={item.asset.alt} fill sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 90vw" className="object-cover object-center" />
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-ink/80 to-transparent text-sand">
                    <span className="inline-block mb-2 rounded-full border border-white/20 bg-ink px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-[0.2em]">{CATEGORY_LABEL[item.category]}</span>
                    <p className="text-sm font-medium leading-tight">{item.title}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}
