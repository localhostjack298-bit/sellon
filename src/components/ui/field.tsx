"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

interface FieldCtx {
  id: string;
  describedBy?: string;
  invalid: boolean;
}
const FieldContext = React.createContext<FieldCtx | null>(null);
export const useField = () => React.useContext(FieldContext);

/** Label + control + hint/error wiring in one place (works with react-hook-form errors). */
export function Field({
  label, hint, error, required, className, children, optional,
}: {
  label?: React.ReactNode; hint?: React.ReactNode; error?: string | string[] | null; required?: boolean; optional?: boolean; className?: string; children: React.ReactNode;
}) {
  const id = React.useId();
  const message = Array.isArray(error) ? error[0] : error;
  const describedBy = [hint ? `${id}-hint` : null, message ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;
  return (
    <FieldContext.Provider value={{ id, describedBy, invalid: Boolean(message) }}>
      <div className={cn("flex flex-col gap-1.5", className)}>
        {label ? (
          <label htmlFor={id} className="flex items-baseline justify-between gap-2 text-[0.8rem] font-semibold text-fg-2">
            <span>
              {label}
              {required ? <span className="ml-0.5 text-brand-text" aria-hidden>*</span> : null}
            </span>
            {optional ? <span className="text-[0.7rem] font-medium text-subtle">Optional</span> : null}
          </label>
        ) : null}
        {children}
        {hint && !message ? <p id={`${id}-hint`} className="text-xs text-muted">{hint}</p> : null}
        {message ? <p id={`${id}-error`} role="alert" className="text-xs font-medium text-danger">{message}</p> : null}
      </div>
    </FieldContext.Provider>
  );
}
