"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { useField } from "./field";

const base =
  "w-full rounded-md border bg-surface px-3 text-sm text-fg placeholder:text-subtle transition-[border-color,box-shadow,background-color] duration-150 hover:border-line-strong focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25 disabled:cursor-not-allowed disabled:bg-surface-2 disabled:opacity-60";

export function Input({ className, id, invalid, ...props }: React.ComponentProps<"input"> & { invalid?: boolean }) {
  const field = useField();
  return (
    <input
      id={id ?? field?.id}
      aria-describedby={field?.describedBy}
      aria-invalid={invalid ?? field?.invalid ?? undefined}
      className={cn(base, "h-10", (invalid ?? field?.invalid) ? "border-danger" : "border-line", className)}
      {...props}
    />
  );
}

export function Textarea({ className, id, invalid, ...props }: React.ComponentProps<"textarea"> & { invalid?: boolean }) {
  const field = useField();
  return (
    <textarea
      id={id ?? field?.id}
      aria-describedby={field?.describedBy}
      aria-invalid={invalid ?? field?.invalid ?? undefined}
      className={cn(base, "min-h-24 resize-y py-2.5 leading-relaxed", (invalid ?? field?.invalid) ? "border-danger" : "border-line", className)}
      {...props}
    />
  );
}

/** Styled native select — accessible, mobile-friendly and keyboard-native. */
export function Select({ className, id, invalid, children, ...props }: React.ComponentProps<"select"> & { invalid?: boolean }) {
  const field = useField();
  return (
    <div className="relative">
      <select
        id={id ?? field?.id}
        aria-describedby={field?.describedBy}
        aria-invalid={invalid ?? field?.invalid ?? undefined}
        className={cn(base, "h-10 appearance-none pr-9", (invalid ?? field?.invalid) ? "border-danger" : "border-line", className)}
        {...props}
      >
        {children}
      </select>
      <svg aria-hidden viewBox="0 0 20 20" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="m5 8 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
