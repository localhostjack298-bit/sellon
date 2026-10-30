import { getLiveOffers, getPrimaryBranch } from "@/features/site/queries";
import { getActor } from "@/lib/auth/session";
import { brand } from "@/config/brand";
import { SiteHeader, type Viewer } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import Link from "next/link";
import { ArrowRight, BadgePercent, Clock, Ticket } from "lucide-react";
import { Panel, PanelHeader, PanelBody } from "@/components/ui/card";
import { formatINR } from "@/lib/money";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: `Offers & Promotions · ${brand.name}`,
  description: "Current salon offers, discounts and packages — book online and pay at the salon.",
};

export default async function OffersPage() {
  const [offers, branch, actor] = await Promise.all([
    getLiveOffers(),
    getPrimaryBranch(),
    getActor(),
  ]);

  const viewer: Viewer | null = actor
    ? { name: actor.name, homeHref: "/", roleLabel: actor.roles[0]?.name ?? "Member" }
    : null;

  const now = new Date();

  return (
    <div className="min-h-dvh bg-canvas">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-sand">
        Skip to content
      </a>
      <SiteHeader viewer={viewer} />
      <main id="main" className="min-h-[60vh] pb-20 sm:pb-0">
        <div className="shell py-12 lg:py-20">
          <PanelHeader
            title="Current Offers"
            description="Sample promotions for demonstration only. Pay at the salon — no online payment in this demo."
            icon={<BadgePercent className="size-5" />}
          />

          {offers.length === 0 ? (
            <Panel className="mt-10">
              <PanelBody className="text-center py-12">
                <p className="text-fg-2">No active offers right now. Check back soon.</p>
              </PanelBody>
            </Panel>
          ) : (
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {offers.map((offer) => {
                const endsAt = new Date(offer.endsAt);
                const daysLeft = Math.ceil((endsAt.getTime() - now.getTime()) / (86400 * 1000));
                const isFirstVisit = offer.firstVisitOnly;
                const audienceLabel =
                  offer.audience === "NEW_CUSTOMERS" ? "New customers" : offer.audience === "RETURNING_CUSTOMERS" ? "Returning customers" : "Everyone";

                return (
                  <Panel key={offer.id} className="overflow-hidden hover:border-brand transition-colors group">
                    <div className="relative h-40 rounded-lg border border-line bg-surface overflow-hidden">
                      {offer.image?.url ? (
                        <img src={offer.image.url} alt={offer.image.alt} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="h-full w-full bg-sand/30 flex items-center justify-center text-fg-2">
                          <Ticket className="size-10" />
                        </div>
                      )}
                      <span className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-ink text-sand text-xs font-bold">
                        {daysLeft > 0 ? `${daysLeft}d left` : "Ends soon"}
                      </span>
                    </div>
                    <PanelBody className="pt-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-display text-lg font-bold tracking-tight text-fg">{offer.title}</h3>
                        {offer.badge && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand/10 text-brand-text text-xs font-bold border border-brand/20">
                            {offer.badge}
                          </span>
                        )}
                      </div>
                      {offer.subtitle && <p className="text-sm text-muted mb-3">{offer.subtitle}</p>}
                      <p className="text-sm text-fg-2 mb-4">{offer.description}</p>
                      <div className="space-y-2 mb-4 text-xs text-muted">
                        <div className="flex items-center gap-1">
                          <Clock className="size-3.5" /> {new Date(offer.startsAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} — {new Date(offer.endsAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-fg">{audienceLabel}</span>
                          {isFirstVisit && <span className="text-brand-text">· First visit only</span>}
                        </div>
                        {offer.code && (
                          <div className="flex items-center gap-1">
                            <span className="font-mono font-bold text-fg">{offer.code}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-line">
                        <div>
                          <span className="font-mono font-bold text-lg text-fg">
                            {offer.type === "PERCENTAGE" ? `${offer.value}% off` : `₹${offer.value.toLocaleString("en-IN")} off`}
                          </span>
                          {offer.maxDiscount && (
                            <span className="text-xs text-muted ml-2">(max ₹{offer.maxDiscount.toLocaleString("en-IN")})</span>
                          )}
                          {offer.minSpend && (
                            <span className="text-xs text-muted ml-2 block mt-0.5">Min spend ₹{offer.minSpend.toLocaleString("en-IN")}</span>
                          )}
                        </div>
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="text-brand-text border-brand hover:bg-brand hover:text-brand-fg"
                        >
                          <Link href="/book">Apply <ArrowRight className="size-3.5 ml-1" /></Link>
                        </Button>
                      </div>
                    </PanelBody>
                  </Panel>
                );
              })}
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
