import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Editorial call-to-action link-button with a sliding arrow. */
export function CtaLink({
  href, children, variant = "primary", size = "lg", className, arrow = true,
}: { href: string; children: React.ReactNode; variant?: ButtonProps["variant"]; size?: ButtonProps["size"]; className?: string; arrow?: boolean }) {
  return (
    <Button asChild variant={variant} size={size} shape="editorial" className={className}>
      <Link href={href}>
        {children}
        {arrow ? <ArrowRight className="transition-transform duration-300 group-hover/btn:translate-x-1" /> : null}
      </Link>
    </Button>
  );
}

export function SectionHeading({
  eyebrow, title, intro, align = "left", className, tone = "default",
}: { eyebrow?: string; title: React.ReactNode; intro?: React.ReactNode; align?: "left" | "center"; className?: string; tone?: "default" | "light" }) {
  return (
    <div className={cn(align === "center" && "mx-auto text-center", "max-w-3xl", className)}>
      {eyebrow ? (
        <p className={cn("eyebrow mb-5 flex items-center gap-3", align === "center" && "justify-center", tone === "light" ? "text-sand/70" : "text-brand-text")}>
          <span className="h-px w-8 bg-current opacity-60" aria-hidden />{eyebrow}
        </p>
      ) : null}
      <h2 className={cn("display-3", tone === "light" ? "text-sand" : "text-fg")}>{title}</h2>
      {intro ? <p className={cn("mt-5 max-w-2xl text-[1.02rem] leading-relaxed", align === "center" && "mx-auto", tone === "light" ? "text-sand/70" : "text-muted")}>{intro}</p> : null}
    </div>
  );
}
