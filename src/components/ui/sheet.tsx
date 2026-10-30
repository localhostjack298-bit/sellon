"use client";
import * as React from "react";
import { Dialog as D } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export const Sheet = D.Root;
export const SheetTrigger = D.Trigger;
export const SheetClose = D.Close;

/** Right-hand drawer on desktop, bottom sheet on small screens. */
export function SheetContent({
  className, children, title, description, footer, width = "md", ...props
}: Omit<React.ComponentProps<typeof D.Content>, "title"> & { title: React.ReactNode; description?: React.ReactNode; footer?: React.ReactNode; width?: "sm" | "md" | "lg" }) {
  const w = { sm: "sm:max-w-sm", md: "sm:max-w-md", lg: "sm:max-w-xl" }[width];
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-50 bg-[var(--overlay)] data-[state=closed]:animate-overlay-out data-[state=open]:animate-overlay-in" />
      <D.Content
        className={cn(
          "fixed z-50 flex flex-col bg-surface text-fg shadow-pop outline-none",
          "inset-x-0 bottom-0 max-h-[92dvh] rounded-t-xl border-t border-line data-[state=closed]:animate-sheet-bottom-out data-[state=open]:animate-sheet-bottom-in",
          "sm:inset-x-auto sm:inset-y-0 sm:right-0 sm:max-h-none sm:w-full sm:rounded-none sm:border-l sm:border-t-0 sm:data-[state=closed]:animate-sheet-right-out sm:data-[state=open]:animate-sheet-right-in",
          w, className,
        )}
        {...props}
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <D.Title className="text-base font-bold tracking-tight">{title}</D.Title>
            {description ? <D.Description className="mt-1 text-sm text-muted">{description}</D.Description> : <D.Description className="sr-only">{typeof title === "string" ? title : "Panel"}</D.Description>}
          </div>
          <D.Close asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Close panel"><X /></Button>
          </D.Close>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer ? <footer className="flex items-center justify-end gap-2 border-t border-line bg-surface-2 px-5 py-3">{footer}</footer> : null}
      </D.Content>
    </D.Portal>
  );
}
