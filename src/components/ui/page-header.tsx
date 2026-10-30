import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title, description, actions, eyebrow, breadcrumbs, className,
}: {
  title: React.ReactNode; description?: React.ReactNode; actions?: React.ReactNode; eyebrow?: string;
  breadcrumbs?: { label: string; href?: string }[]; className?: string;
}) {
  return (
    <div className={cn("mb-6 flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        {breadcrumbs?.length ? (
          <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-1 text-xs text-muted">
            {breadcrumbs.map((b, i) => (
              <span key={`${b.label}-${i}`} className="flex items-center gap-1">
                {b.href ? <Link href={b.href} className="hover:text-fg hover:underline">{b.label}</Link> : <span className="text-fg-2">{b.label}</span>}
                {i < breadcrumbs.length - 1 ? <ChevronRight className="size-3" aria-hidden /> : null}
              </span>
            ))}
          </nav>
        ) : null}
        {eyebrow ? <p className="eyebrow mb-2 text-brand-text">{eyebrow}</p> : null}
        <h1 className="page-title text-fg">{title}</h1>
        {description ? <p className="mt-1.5 max-w-2xl text-sm text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
