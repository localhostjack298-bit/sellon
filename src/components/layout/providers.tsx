"use client";
import * as React from "react";
import { ThemeProvider, useTheme } from "next-themes";
import { MotionConfig } from "motion/react";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

function AppToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      theme={(resolvedTheme as "light" | "dark" | undefined) ?? "light"}
      position="bottom-right"
      closeButton
      toastOptions={{
        classNames: { toast: "!rounded-lg !font-sans !text-sm", title: "!font-semibold", description: "!text-muted" },
      }}
      style={
        {
          "--normal-bg": "var(--surface)",
          "--normal-text": "var(--fg)",
          "--normal-border": "var(--line-strong)",
          "--success-bg": "var(--surface)",
          "--success-text": "var(--fg)",
          "--success-border": "var(--success)",
          "--error-bg": "var(--surface)",
          "--error-text": "var(--fg)",
          "--error-border": "var(--danger)",
        } as React.CSSProperties
      }
    />
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem storageKey="stellar-theme" disableTransitionOnChange>
      <MotionConfig reducedMotion="user">
        <TooltipProvider>{children}</TooltipProvider>
      </MotionConfig>
      <AppToaster />
    </ThemeProvider>
  );
}
