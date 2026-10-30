"use client";
import * as React from "react";
import { DropdownMenu as M } from "radix-ui";
import { cn } from "@/lib/utils";

export const DropdownMenu = M.Root;
export const DropdownMenuTrigger = M.Trigger;
export const DropdownMenuGroup = M.Group;

export function DropdownMenuContent({ className, sideOffset = 8, align = "end", ...props }: React.ComponentProps<typeof M.Content>) {
  return (
    <M.Portal>
      <M.Content
        sideOffset={sideOffset}
        align={align}
        className={cn("z-50 min-w-48 overflow-hidden rounded-lg border border-line bg-surface p-1.5 text-fg shadow-pop data-[state=open]:animate-pop-in", className)}
        {...props}
      />
    </M.Portal>
  );
}

export function DropdownMenuItem({ className, inset, danger, ...props }: React.ComponentProps<typeof M.Item> & { inset?: boolean; danger?: boolean }) {
  return (
    <M.Item
      className={cn(
        "relative flex cursor-pointer select-none items-center gap-2.5 rounded-md px-2.5 py-2 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-45 data-[highlighted]:bg-surface-3 [&_svg]:size-4 [&_svg]:text-muted",
        inset && "pl-8", danger && "text-danger [&_svg]:text-danger", className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuLabel({ className, ...props }: React.ComponentProps<typeof M.Label>) {
  return <M.Label className={cn("px-2.5 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-subtle", className)} {...props} />;
}

export function DropdownMenuSeparator({ className, ...props }: React.ComponentProps<typeof M.Separator>) {
  return <M.Separator className={cn("-mx-1.5 my-1.5 h-px bg-line", className)} {...props} />;
}

export function DropdownMenuRadioItem({ className, children, ...props }: React.ComponentProps<typeof M.RadioItem>) {
  return (
    <M.RadioItem className={cn("relative flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm outline-none data-[highlighted]:bg-surface-3 data-[state=checked]:font-semibold", className)} {...props}>
      {children}
      <M.ItemIndicator className="ml-auto text-brand-text">●</M.ItemIndicator>
    </M.RadioItem>
  );
}
export const DropdownMenuRadioGroup = M.RadioGroup;
