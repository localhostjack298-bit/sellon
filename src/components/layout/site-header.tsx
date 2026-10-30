"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog as D } from "radix-ui";
import { ArrowRight, CalendarCheck2, LogIn, Menu, UserRound, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { DemoBar } from "@/components/layout/demo-bar";

const NAV = [
  { href: "/services", label: "Services" },
  { href: "/offers", label: "Offers" },
  { href: "/our-team", label: "Our team" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export interface Viewer { name: string; homeHref: string; roleLabel: string }

export function SiteHeader({ viewer }: { viewer: Viewer | null }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  React.useEffect(() => setOpen(false), [pathname]);

  const overHero = isHome && !scrolled;

  return (
    <header
      className={cn(
        "inset-x-0 top-0 z-40 transition-[background-color,border-color,box-shadow] duration-300",
        isHome ? "fixed" : "sticky",
        overHero ? "border-b border-transparent bg-transparent text-sand" : "border-b border-line bg-canvas/95 text-fg backdrop-blur-sm supports-[backdrop-filter]:bg-canvas/85",
      )}
    >
      <div className={cn("transition-[max-height,opacity] duration-300", scrolled ? "max-h-0 overflow-hidden opacity-0" : "max-h-10 opacity-100")}>
        <DemoBar overHero={overHero} />
      </div>
      <div className="shell flex h-[4.5rem] items-center justify-between gap-6">
        <Link href="/" aria-label="Stellar Family Salon — home" className="shrink-0">
          <Logo tone={overHero ? "light" : "auto"} />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative px-3.5 py-2 text-[0.82rem] font-semibold tracking-wide transition-colors",
                  overHero ? "text-sand/85 hover:text-sand" : "text-fg-2 hover:text-fg",
                  active && (overHero ? "text-sand" : "text-fg"),
                )}
              >
                {item.label}
                <span className={cn("absolute inset-x-3.5 -bottom-0.5 h-[2px] origin-left bg-brand transition-transform duration-300", active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100")} />
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <ThemeToggle className={cn(overHero && "text-sand hover:bg-white/10 hover:text-sand")} />
          {viewer ? (
            <Button asChild variant="ghost" size="md" className={cn("hidden sm:inline-flex", overHero && "text-sand hover:bg-white/10 hover:text-sand")}>
              <Link href={viewer.homeHref}><UserRound /> <span className="max-w-28 truncate">{viewer.name.split(" ")[0]}</span></Link>
            </Button>
          ) : (
            <Button asChild variant="ghost" size="md" className={cn("hidden sm:inline-flex", overHero && "text-sand hover:bg-white/10 hover:text-sand")}>
              <Link href="/login"><LogIn /> Sign in</Link>
            </Button>
          )}
          <Button asChild shape="editorial" size="md" className="hidden sm:inline-flex">
            <Link href="/book">Book now <ArrowRight className="transition-transform group-hover/btn:translate-x-0.5" /></Link>
          </Button>

          <D.Root open={open} onOpenChange={setOpen}>
            <D.Trigger asChild>
              <Button variant="ghost" size="icon" className={cn("lg:hidden", overHero && "text-sand hover:bg-white/10 hover:text-sand")} aria-label="Open menu"><Menu className="size-5" /></Button>
            </D.Trigger>
            <D.Portal>
              <D.Overlay className="fixed inset-0 z-50 bg-[var(--overlay)] data-[state=closed]:animate-overlay-out data-[state=open]:animate-overlay-in" />
              <D.Content className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-ink text-sand outline-none data-[state=closed]:animate-sheet-right-out data-[state=open]:animate-sheet-right-in">
                <D.Title className="sr-only">Menu</D.Title>
                <D.Description className="sr-only">Site navigation</D.Description>
                <div className="flex h-[4.5rem] items-center justify-between px-6">
                  <Logo tone="light" />
                  <D.Close asChild><Button variant="ghost" size="icon" className="text-sand hover:bg-white/10 hover:text-sand" aria-label="Close menu"><X className="size-5" /></Button></D.Close>
                </div>
                <nav aria-label="Mobile" className="flex flex-1 flex-col justify-center gap-1 px-8">
                  {NAV.map((item, i) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      style={{ animationDelay: `${120 + i * 55}ms` }}
                      className="animate-rise font-display text-[2.6rem] font-medium italic leading-[1.15] text-sand/90 transition-colors hover:text-brand-text"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
                <div className="space-y-3 border-t border-white/10 p-6">
                  <Button asChild shape="editorial" size="lg" className="w-full"><Link href="/book" onClick={() => setOpen(false)}><CalendarCheck2 /> Book an appointment</Link></Button>
                  <Button asChild variant="ghost" size="md" className="w-full text-sand hover:bg-white/10 hover:text-sand">
                    {viewer ? <Link href={viewer.homeHref} onClick={() => setOpen(false)}><UserRound /> {viewer.name} · {viewer.roleLabel}</Link> : <Link href="/login" onClick={() => setOpen(false)}><LogIn /> Sign in or register</Link>}
                  </Button>
                </div>
              </D.Content>
            </D.Portal>
          </D.Root>
        </div>
      </div>
    </header>
  );
}
