import { getStylists, getPrimaryBranch } from "@/features/site/queries";
import { getActor } from "@/lib/auth/session";
import { brand } from "@/config/brand";
import { SiteHeader, type Viewer } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import Link from "next/link";
import { ArrowRight, Sparkles, UserRound } from "lucide-react";
import { Panel, PanelHeader, PanelBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = {
  title: `Our Team · ${brand.name}`,
  description: "Meet our skilled stylists and therapists — experienced professionals for every look.",
};

export default async function TeamPage() {
  const [stylists, branch, actor] = await Promise.all([
    getStylists(),
    getPrimaryBranch(),
    getActor(),
  ]);

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
          <PanelHeader
            title="Our Team"
            description="Meet our skilled stylists and therapists — experienced professionals for every look and occasion."
            icon={<Sparkles className="size-5" />}
          />

          {stylists.length === 0 ? (
            <Panel className="mt-10">
              <PanelBody className="text-center py-12">
                <p className="text-fg-2">No stylists available at the moment.</p>
              </PanelBody>
            </Panel>
          ) : (
            <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {stylists.map((stylist) => (
                <Panel key={stylist.id} className="overflow-hidden group hover:border-brand transition-colors">
                  <div className="relative h-56 rounded-lg border border-line bg-surface overflow-hidden group">
                    {stylist.portrait?.url ? (
                      <img src={stylist.portrait.url} alt={stylist.portrait.alt} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="h-full w-full bg-sand/30 flex items-center justify-center text-fg-2">
                        <UserRound className="size-16 opacity-50" />
                      </div>
                    )}
                    {stylist.isFeatured && (
                      <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-brand text-brand-fg text-xs font-bold">
                        Featured
                      </span>
                    )}
                  </div>
                  <PanelBody className="pt-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-display text-lg font-bold tracking-tight text-fg">{stylist.name}</h3>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sand/50 text-fg-2 text-xs border border-sand/30">
                        {stylist.jobTitle}
                      </span>
                    </div>
                    {stylist.yearsExperience && (
                      <p className="text-xs text-muted mb-3">{stylist.yearsExperience}+ years experience</p>
                    )}
                    {stylist.bio && (
                      <p className="text-sm text-fg-2 mb-4 line-clamp-2">{stylist.bio}</p>
                    )}
                    {stylist.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {stylist.specialties.map((spec) => (
                          <span key={spec} className="px-2.5 py-1 rounded-md bg-surface border border-line text-xs text-fg-2">
                            {spec}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-4 border-t border-line">
                      <div className="text-sm text-fg">
                        {stylist.languages.length > 0 && (
                          <span className="text-muted">{stylist.languages.join(", ")}</span>
                        )}
                      </div>
                      <Link
                        href="/book"
                        className="text-xs font-semibold text-brand-text hover:underline hover:text-brand/90 flex items-center gap-1"
                      >
                        Book with {stylist.firstName} <ArrowRight className="size-3.5" />
                      </Link>
                    </div>
                  </PanelBody>
                </Panel>
              ))}
            </div>
          )}
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
