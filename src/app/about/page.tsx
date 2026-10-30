import { getPrimaryBranch } from "@/features/site/queries";
import { getActor } from "@/lib/auth/session";
import { brand } from "@/config/brand";
import { SiteHeader, type Viewer } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import Link from "next/link";
import { ArrowRight, Scissors, Palette, Landmark, Clock, Phone, Mail } from "lucide-react";
import { Panel, PanelHeader, PanelBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LOCAL_IMAGES } from "@/config/brand";
import { cn } from "@/lib/utils";

export const metadata = {
  title: `About · ${brand.name}`,
  description: "About Stellar Family Salon — a boutique family salon for hair, skin, nails and grooming.",
};

export default async function AboutPage() {
  const [branch, actor] = await Promise.all([getPrimaryBranch(), getActor()]);

  const viewer: Viewer | null = actor
    ? { name: actor.name, homeHref: "/", roleLabel: actor.roles[0]?.name ?? "Member" }
    : null;

  return (
    <div className="min-h-dvh bg-canvas">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-sand">
        Skip to content
      </a>
      <SiteHeader viewer={viewer} />
      <main id="main" className="min-h-[60vh] pb-20 sm:pb-0">
        <div className="shell py-12 lg:py-20">
          <PanelHeader title="About Us" description={brand.description} icon={<Palette className="size-5" />} />

          <div className="mt-12 grid gap-12 lg:grid-cols-2">
            <div>
              <Panel className="overflow-hidden">
                <div className="relative h-64 rounded-lg border border-line bg-surface overflow-hidden">
                  {LOCAL_IMAGES.experienceInterior.url && (
                    <img
                      src={LOCAL_IMAGES.experienceInterior.url}
                      alt={LOCAL_IMAGES.experienceInterior.alt}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <PanelBody className="pt-4">
                  <h3 className="font-display text-xl font-bold tracking-tight text-fg mb-2">
                    Our story
                  </h3>
                  <p className="text-fg-2 leading-relaxed">
                    {brand.name} is a boutique family salon built on one simple idea: great hair, skin and nails
                    shouldn't come with pretense. From first haircuts to silver-streak touch-ups, from wedding
                    updos to quick trims — every guest gets the same unhurried care and a skilled pair of hands.
                  </p>
                  <p className="mt-4 text-fg-2 leading-relaxed">
                    We use the three brand colours — {brand.colors.primary} (primary), {brand.colors.sand}
                    (champagne) and {brand.colors.ink} (charcoal) — throughout the salon, in everything from the
                    walls to the towels. It's our way of keeping the room calm, warm and instantly recognisable.
                  </p>
                </PanelBody>
              </Panel>
              <div className="mt-6">
                <Panel>
                  <PanelHeader title="What to expect" icon={<Scissors className="size-5" />} />
                  <PanelBody className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Clock className="size-4 text-brand-text shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-fg">Pay at the salon</p>
                        <p className="text-sm text-muted">Cash, UPI or card — no online payment in this demo.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Landmark className="size-4 text-brand-text shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-fg">Family-friendly</p>
                        <p className="text-sm text-muted">All ages welcome — kids, teens, adults and seniors.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Palette className="size-4 text-brand-text shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-fg">Thoughtful consultations</p>
                        <p className="text-sm text-muted">We listen first, then recommend what suits you.</p>
                      </div>
                    </div>
                  </PanelBody>
                </Panel>
              </div>
            </div>
            <div className="space-y-6">
              <Panel>
                <PanelHeader title="Visit us" icon={<Landmark className="size-5" />} />
                <PanelBody className="space-y-3">
                  <p className="font-medium text-fg">{branch?.addressLine1 ?? brand.fallbackContact.addressLine1}</p>
                  <p className="text-fg-2">
                    {branch?.city ?? brand.fallbackContact.city},{" "}
                    {branch?.state ?? brand.fallbackContact.state} —{" "}
                    {branch?.postalCode ?? brand.fallbackContact.postalCode}
                  </p>
                  <p className="flex items-start gap-2 text-fg-2">
                    <Phone className="size-4 shrink-0 mt-0.5" />
                    {branch?.phone ?? brand.fallbackContact.phone}
                  </p>
                  <p className="flex items-start gap-2 text-fg-2">
                    <Mail className="size-4 shrink-0 mt-0.5" />
                    {branch?.email ?? brand.fallbackContact.email}
                  </p>
                  {branch?.mapUrl && (
                    <a href={branch.mapUrl} target="_blank" rel="noreferrer" className="text-sm text-brand-text hover:underline">
                      Get directions <ArrowRight className="size-3.5 inline ml-1" />
                    </a>
                  )}
                </PanelBody>
              </Panel>
              <Panel>
                <PanelHeader title="Hours" icon={<Clock className="size-5" />} />
                <PanelBody className="space-y-2">
                  {(branch?.hours ?? []).map((h) => {
                    const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                    return (
                      <div key={h.weekday} className="flex justify-between text-sm">
                        <span className={cn("font-medium", h.isClosed && "text-fg-2")}>
                          {h.isClosed ? "Closed" : labels[h.weekday]}
                        </span>
                        <span className={cn("font-mono tabular", h.isClosed && "text-fg-2", !h.isClosed && "text-fg")}>
                          {h.isClosed ? "Closed" : `${h.opensAt} – ${h.closesAt}`}
                        </span>
                      </div>
                    );
                  })}
                  {branch?.hours?.length === 0 && <p className="text-sm text-fg-2">Hours coming soon.</p>}
                </PanelBody>
              </Panel>
            </div>
          </div>

          <div className="mt-16 flex items-center justify-between gap-4">
            <a href="/" className="text-sm text-fg-2 hover:text-fg">&larr; Back to homepage</a>
            <Button asChild size="md" className="bg-brand text-brand-fg hover:bg-brand/90">
              <Link href="/book">Book an appointment <ArrowRight className="size-4 ml-1" /></Link>
            </Button>
          </div>
        </div>
      </main>
      <SiteFooter branch={branch} />
    </div>
  );
}
