"use client";
import * as React from "react";
import { Tooltip as T } from "radix-ui";
import { cn } from "@/lib/utils";

export const TooltipProvider = T.Provider;

export function Tooltip({ content, children, side = "top", disabled }: { content: React.ReactNode; children: React.ReactNode; side?: "top" | "right" | "bottom" | "left"; disabled?: boolean }) {
  if (disabled || !content) return <>{children}</>;
  return (
    <T.Root delayDuration={180}>
      <T.Trigger asChild>{children}</T.Trigger>
      <T.Portal>
        <T.Content
          side={side}
          sideOffset={8}
          className={cn("z-[60] max-w-xs rounded-md bg-ink px-2.5 py-1.5 text-xs font-medium text-sand shadow-pop data-[state=delayed-open]:animate-pop-in dark:bg-sand dark:text-ink")}
        >
          {content}
        </T.Content>
      </T.Portal>
    </T.Root>
  );
}
