import * as React from "react";
import { cn } from "@/lib/utils";
import { StarMark } from "@/components/brand/logo";

/** Friendly empty state with the brand's four-point star — never a blank table. */
export function EmptyState({
  title, description, action, icon, className, compact,
}: { title: string; description?: React.ReactNode; action?: React.ReactNode; icon?: React.ReactNode; className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center", compact ? "px-4 py-8" : "px-6 py-14", className)}>
      <div className="relative mb-4 grid size-14 place-items-center rounded-full bg-surface-3 text-muted">
        {icon ?? <StarMark className="size-6 text-brand-text/80" />}
        <StarMark className="absolute -right-1 -top-1 size-3.5 text-brand-text/60" />
      </div>
      <h3 className="text-[0.95rem] font-bold text-fg">{title}</h3>
      {description ? <p className="mt-1.5 max-w-sm text-sm text-muted">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
