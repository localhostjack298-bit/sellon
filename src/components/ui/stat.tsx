import * as React from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stat({
  label, value, hint, delta, icon, className, accent,
}: { label: string; value: React.ReactNode; hint?: React.ReactNode; delta?: { value: number; suffix?: string; goodWhenUp?: boolean } | null; icon?: React.ReactNode; className?: string; accent?: boolean }) {
  const up = (delta?.value ?? 0) > 0;
  const flat = (delta?.value ?? 0) === 0;
  const good = delta ? (delta.goodWhenUp === false ? !up : up) : false;
  return (
    <div className={cn("relative px-5 py-4", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-muted">{label}</p>
        {icon ? <span className="text-subtle">{icon}</span> : null}
      </div>
      <p className={cn("tabular mt-2 font-display text-[2.1rem] font-semibold leading-none tracking-tight", accent ? "text-brand-text" : "text-fg")}>{value}</p>
      <div className="mt-2 flex items-center gap-2 text-xs text-muted">
        {delta ? (
          <span className={cn("inline-flex items-center gap-0.5 font-bold", flat ? "text-muted" : good ? "text-success" : "text-danger")}>
            {flat ? <Minus className="size-3" /> : up ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
            {Math.abs(delta.value)}{delta.suffix ?? "%"}
          </span>
        ) : null}
        {hint ? <span>{hint}</span> : null}
      </div>
    </div>
  );
}
