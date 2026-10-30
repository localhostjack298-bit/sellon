import Image from "next/image";
import { cn } from "@/lib/utils";
import { StarMark } from "@/components/brand/logo";
import type { MediaDTO } from "@/features/site/queries";

/** next/image wrapper that fills its (relatively positioned) parent. */
export function MediaFill({
  media, sizes, className, priority, objectPosition,
}: { media: Pick<MediaDTO, "url" | "alt"> | null | undefined; sizes: string; className?: string; priority?: boolean; objectPosition?: string }) {
  if (!media) return null;
  return (
    <Image
      src={media.url}
      alt={media.alt}
      fill
      sizes={sizes}
      priority={priority}
      className={cn("dim-in-dark object-cover", className)}
      style={objectPosition ? { objectPosition } : undefined}
    />
  );
}

/** Designed fallback for slots that have no photograph yet (never a broken image). */
export function PlaceholderTile({ label, className, tone = "sand" }: { label: string; className?: string; tone?: "sand" | "ink" }) {
  return (
    <div
      role="img"
      aria-label={`${label} — image placeholder`}
      className={cn(
        "relative grid h-full w-full place-items-center overflow-hidden",
        tone === "sand" ? "bg-sand text-ink dark:bg-surface-3 dark:text-sand" : "bg-ink text-sand",
        className,
      )}
    >
      <StarMark className="absolute -right-6 -top-6 size-40 text-brand/15" />
      <StarMark className="absolute -bottom-8 -left-8 size-28 text-brand/10" />
      <div className="relative px-6 text-center">
        <StarMark className="mx-auto mb-3 size-7 text-brand-text" />
        <p className="font-display text-3xl font-medium italic leading-tight">{label}</p>
      </div>
    </div>
  );
}

export function DemoImageNote({ className }: { className?: string }) {
  return <p className={cn("text-[0.7rem] leading-snug text-subtle", className)}>Illustrative AI-generated demo imagery — replace with real photography.</p>;
}
