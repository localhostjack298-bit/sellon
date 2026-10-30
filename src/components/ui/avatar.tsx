import Image from "next/image";
import { cn, initials } from "@/lib/utils";

export function Avatar({ name, src, size = 36, className }: { name: string; src?: string | null; size?: number; className?: string }) {
  return (
    <span
      className={cn("relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-sand font-bold text-ink ring-1 ring-line dark:bg-surface-3 dark:text-sand", className)}
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.36) }}
      aria-label={name}
      role="img"
    >
      {src ? <Image src={src} alt="" fill sizes={`${size}px`} className="object-cover" /> : initials(name)}
    </span>
  );
}
