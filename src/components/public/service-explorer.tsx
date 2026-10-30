"use client";
import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { cn, formatDuration } from "@/lib/utils";
import { formatINR } from "@/lib/money";
import { StarMark } from "@/components/brand/logo";

export interface ExplorerCategory {
  slug: string;
  name: string;
  tagline: string | null;
  imageUrl: string | null;
  imageAlt: string;
  services: { slug: string; name: string; durationMinutes: number; price: number; requiresApproval: boolean }[];
}

/**
 * Homepage service explorer — a category index with a large crossfading image and the category's
 * services. Replaces the usual grid of identical cards with something closer to a menu card.
 */
export function ServiceExplorer({ categories }: { categories: ExplorerCategory[] }) {
  const [active, setActive] = React.useState(categories[0]?.slug ?? "");
  const current = categories.find((c) => c.slug === active) ?? categories[0];
  if (!current) return null;

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
      {/* category index */}
      <div className="lg:col-span-5">
        <ul role="tablist" aria-label="Service categories" className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-2 lg:mx-0 lg:block lg:overflow-visible lg:px-0 lg:pb-0">
          {categories.map((c, i) => {
            const isActive = c.slug === current.slug;
            return (
              <li key={c.slug} role="presentation" className="shrink-0 lg:border-b lg:border-line">
                <button
                  role="tab"
                  type="button"
                  id={`tab-${c.slug}`}
                  aria-selected={isActive}
                  aria-controls="explorer-panel"
                  onClick={() => setActive(c.slug)}
                  onMouseEnter={(e) => { if (window.matchMedia("(hover:hover) and (pointer:fine)").matches && e.currentTarget) setActive(c.slug); }}
                  onFocus={() => setActive(c.slug)}
                  className={cn(
                    "group flex w-full items-baseline gap-4 rounded-full border px-5 py-2.5 text-left transition-colors lg:rounded-none lg:border-0 lg:px-0 lg:py-4",
                    isActive ? "border-fg bg-fg text-canvas lg:bg-transparent lg:text-fg" : "border-line-strong text-fg-2 hover:text-fg",
                  )}
                >
                  <span className={cn("tabular hidden w-7 text-[0.72rem] font-bold tracking-widest lg:block", isActive ? "text-brand-text" : "text-subtle")}>{String(i + 1).padStart(2, "0")}</span>
                  <span className={cn("font-display text-[1.05rem] font-semibold lg:text-[clamp(1.7rem,2.6vw,2.6rem)] lg:font-medium lg:leading-none", isActive && "lg:italic")}>{c.name}</span>
                  <ArrowRight className={cn("ml-auto hidden size-5 shrink-0 text-brand-text transition-all lg:block", isActive ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0")} aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* active panel */}
      <div id="explorer-panel" role="tabpanel" aria-labelledby={`tab-${current.slug}`} className="grid gap-6 sm:grid-cols-2 lg:col-span-7">
        <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-arch bg-surface-3 sm:max-w-none">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={current.slug}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              {current.imageUrl ? (
                <Image src={current.imageUrl} alt={current.imageAlt} fill sizes="(min-width:1024px) 28vw, (min-width:640px) 45vw, 90vw" className="dim-in-dark object-cover" />
              ) : (
                <div className="grid h-full place-items-center bg-sand text-ink dark:bg-surface-3 dark:text-sand">
                  <div className="px-8 text-center">
                    <StarMark className="mx-auto mb-4 size-9 text-brand-text" />
                    <p className="font-display text-4xl font-medium italic leading-tight">{current.name}</p>
                  </div>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/85 to-transparent p-6 pt-20 text-sand">
                {current.tagline ? <p className="font-display text-2xl font-medium italic leading-tight">{current.tagline}</p> : null}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex flex-col">
          <p className="eyebrow mb-4 text-muted">{current.services.length} services</p>
          <ul className="divide-y divide-line border-y border-line">
            {current.services.slice(0, 6).map((s) => (
              <li key={s.slug}>
                <Link href={`/services/${s.slug}`} className="group flex items-start justify-between gap-4 py-3.5">
                  <span className="min-w-0">
                    <span className="block text-[0.95rem] font-semibold text-fg transition-colors group-hover:text-brand-text">{s.name}</span>
                    <span className="mt-0.5 block text-xs text-muted">{formatDuration(s.durationMinutes)}{s.requiresApproval ? " · by request" : ""}</span>
                  </span>
                  <span className="tabular shrink-0 text-sm font-semibold text-fg-2">{formatINR(s.price)}<span className="text-xs font-medium text-subtle">+</span></span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href={`/services#${current.slug}`} className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-text hover:underline">
              View all {current.name.toLowerCase()} <ArrowUpRight className="size-4" />
            </Link>
          </div>
          <p className="mt-auto pt-6 text-[0.7rem] leading-snug text-subtle">Sample prices (INR) for demonstration. Payment is always taken at the salon.</p>
        </div>
      </div>
    </div>
  );
}
