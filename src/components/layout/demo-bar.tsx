"use client";
import * as React from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const KEY = "stellar-demo-bar-dismissed";

/** Honest "this is a demo" strip. Dismissal is a presentation preference, stored in localStorage only. */
export function DemoBar({ overHero }: { overHero?: boolean }) {
  const [hidden, setHidden] = React.useState(true);
  React.useEffect(() => {
    setHidden(window.localStorage.getItem(KEY) === "1");
  }, []);
  if (hidden) return null;
  return (
    <div className={cn("flex h-10 items-center justify-center gap-3 px-4 text-[0.72rem] font-medium", overHero ? "bg-black/35 text-sand/90" : "bg-ink text-sand")}>
      <span className="truncate">
        Demo experience · sample services, prices, people &amp; imagery ·{" "}
        <Link href="/demo" className="font-bold text-sand underline decoration-brand decoration-2 underline-offset-4 hover:text-brand-text">Explore the demo accounts</Link>
      </span>
      <button
        type="button"
        aria-label="Dismiss demo notice"
        className="grid size-6 shrink-0 place-items-center rounded-full hover:bg-white/10"
        onClick={() => { window.localStorage.setItem(KEY, "1"); setHidden(true); }}
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
