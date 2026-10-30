"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Sticky booking CTA for small screens (hidden on the booking flow itself and auth pages). */
export function MobileBookBar() {
  const pathname = usePathname();
  if (pathname.startsWith("/book") || pathname === "/login" || pathname === "/register" || pathname === "/demo") return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-canvas/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:hidden">
      <Button asChild shape="editorial" size="lg" className="w-full">
        <Link href="/book"><CalendarCheck2 /> Book an appointment</Link>
      </Button>
    </div>
  );
}
