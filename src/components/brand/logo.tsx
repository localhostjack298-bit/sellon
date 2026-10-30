import { cn } from "@/lib/utils";
import { brand } from "@/config/brand";

/** Four-point "stellar" star — the brand's recurring motif (logo, empty states, dividers). */
export function StarMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("shrink-0", className)} fill="currentColor">
      <path d="M12 0c.74 6.3 5.7 11.26 12 12-6.3.74-11.26 5.7-12 12-.74-6.3-5.7-11.26-12-12C6.3 11.26 11.26 6.3 12 0Z" />
    </svg>
  );
}

/**
 * Placeholder wordmark — replace by swapping this component or by dropping a file at `brand.assets.logoMark`.
 * (The real Stellar logo could not be retrieved: the Instagram profile returned HTTP 403 during the build.)
 */
export function Logo({
  className, compact, tone = "auto", withDescriptor = true,
}: { className?: string; compact?: boolean; tone?: "auto" | "light" | "dark"; withDescriptor?: boolean }) {
  const text = tone === "light" ? "text-sand" : tone === "dark" ? "text-ink" : "text-fg";
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="relative grid size-9 place-items-center">
        <StarMark className="size-9 text-brand" />
        <StarMark className="absolute -right-0.5 -top-0.5 size-3 text-brand/70" />
      </span>
      {compact ? null : (
        <span className="flex flex-col leading-none">
          <span className={cn("font-display text-[1.65rem] font-semibold tracking-[-0.01em]", text)}>{brand.shortName}</span>
          {withDescriptor ? <span className={cn("mt-1 text-[0.58rem] font-bold uppercase tracking-[0.3em]", text, "opacity-70")}>{brand.descriptor}</span> : null}
        </span>
      )}
    </span>
  );
}
