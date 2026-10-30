import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { STATUS_LABEL, type BookingStatusKey } from "@/features/booking/policy";

export const badgeVariants = cva(
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-[3px] text-[0.72rem] font-semibold leading-none ring-1 ring-inset",
  {
    variants: {
      tone: {
        neutral: "bg-surface-3 text-fg-2 ring-line",
        brand: "bg-brand-soft text-brand-text ring-brand/25",
        success: "bg-success-soft text-success ring-success/25",
        warning: "bg-warning-soft text-warning ring-warning/30",
        danger: "bg-danger-soft text-danger ring-danger/25",
        bronze: "bg-bronze-soft text-bronze ring-bronze/25",
        ink: "bg-ink text-sand ring-ink dark:bg-sand dark:text-ink dark:ring-sand",
        outline: "bg-transparent text-fg-2 ring-line-strong",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export function Badge({ className, tone, dot, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { dot?: boolean }) {
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...props}>
      {dot ? <span className="size-1.5 rounded-full bg-current" aria-hidden /> : null}
      {props.children}
    </span>
  );
}

const STATUS_TONE: Record<BookingStatusKey, VariantProps<typeof badgeVariants>["tone"]> = {
  PENDING: "warning",
  CONFIRMED: "ink",
  CHECKED_IN: "bronze",
  IN_PROGRESS: "brand",
  COMPLETED: "success",
  CANCELLED: "outline",
  NO_SHOW: "danger",
};

export function StatusBadge({ status, className }: { status: BookingStatusKey; className?: string }) {
  return (
    <Badge tone={STATUS_TONE[status]} dot className={cn(status === "CANCELLED" && "line-through decoration-subtle/60", className)}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}

export const STATUS_COLOR_VAR: Record<BookingStatusKey, string> = {
  PENDING: "var(--warning)",
  CONFIRMED: "var(--fg)",
  CHECKED_IN: "var(--bronze)",
  IN_PROGRESS: "var(--brand)",
  COMPLETED: "var(--success)",
  CANCELLED: "var(--subtle)",
  NO_SHOW: "var(--danger)",
};
