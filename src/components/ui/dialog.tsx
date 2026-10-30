"use client";
import * as React from "react";
import { Dialog as D } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export const Dialog = D.Root;
export const DialogTrigger = D.Trigger;
export const DialogClose = D.Close;

const sizes = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" } as const;

export function DialogContent({
  className, children, size = "md", title, description, hideClose, ...props
}: Omit<React.ComponentProps<typeof D.Content>, "title"> & { size?: keyof typeof sizes; title: React.ReactNode; description?: React.ReactNode; hideClose?: boolean }) {
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[var(--overlay)] p-4 data-[state=closed]:animate-overlay-out data-[state=open]:animate-overlay-in">
        <D.Content
          className={cn(
            "relative my-auto w-full rounded-lg border border-line bg-surface p-0 text-fg shadow-pop outline-none data-[state=closed]:animate-pop-out data-[state=open]:animate-pop-in",
            sizes[size], className,
          )}
          {...props}
        >
          <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
            <div className="min-w-0">
              <D.Title className="text-base font-bold tracking-tight">{title}</D.Title>
              {description ? <D.Description className="mt-1 text-sm text-muted">{description}</D.Description> : <D.Description className="sr-only">{typeof title === "string" ? title : "Dialog"}</D.Description>}
            </div>
            {hideClose ? null : (
              <D.Close asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Close"><X /></Button>
              </D.Close>
            )}
          </div>
          <div className="px-6 py-5">{children}</div>
        </D.Content>
      </D.Overlay>
    </D.Portal>
  );
}

export function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />;
}

export function ConfirmDialog({
  open, onOpenChange, title, description, confirmLabel = "Confirm", cancelLabel = "Keep as is", tone = "danger", loading, onConfirm, children,
}: {
  open: boolean; onOpenChange: (open: boolean) => void; title: string; description?: React.ReactNode; confirmLabel?: string; cancelLabel?: string;
  tone?: "danger" | "primary"; loading?: boolean; onConfirm: () => void | Promise<void>; children?: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm" title={title} description={description}>
        {children}
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>{cancelLabel}</Button>
          <Button variant={tone === "danger" ? "danger" : "primary"} loading={loading} onClick={() => void onConfirm()}>{confirmLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
