import { getCatalogue, getPrimaryBranch } from "@/features/site/queries";
import { getActor } from "@/lib/auth/session";
import { brand } from "@/config/brand";
import { SiteHeader, type Viewer } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import Link from "next/link";
import { ArrowRight, Scissors } from "lucide-react";
import { Panel, PanelHeader, PanelBody } from "@/components/ui/card";
import { formatINR } from "@/lib/money";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: `Services · ${brand.name}`,
  description: "Explore our hair, skin, nail and grooming services — curated for every age and occasion.",
};

export default async function ServicesPage() {
  const [catalogue, branch, actor] = await Promise.all([
    getCatalogue(),
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
            title="Our Services"
            description="Thoughtful consultations, skilled hands and a calm room for every age. Book any service online or walk in."
            icon={<Scissors className="size-5" />}
          />
          <div className="mt-10 grid gap-8">
            {catalogue.map((category) => (
              <Panel key={category.slug} className="overflow-hidden">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div className="relative h-48 rounded-lg border border-line bg-surface overflow-hidden group">
                    {category.image?.url ? (
                      <img src={category.image.url} alt={category.image.alt} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="h-full w-full bg-sand/30 flex items-center justify-center text-fg-2">
                        {category.name}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                      <span className="text-sm font-medium text-sand">{category.services.length} services</span>
                    </div>
                  </div>
                  <PanelBody className="pt-0">
                    <h3 className="font-display text-xl font-bold tracking-tight text-fg">{category.name}</h3>
                    {category.tagline && (
                      <p className="mt-1 text-sm text-muted">{category.tagline}</p>
                    )}
                    <ul className="mt-6 space-y-3">
                      {category.services.map((s) => (
                        <li key={s.id} className="flex items-center justify-between gap-3 border-b border-dashed border-line pb-3 last:border-0 last:pb-0">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-fg truncate">{s.name}</p>
                            <p className="text-xs text-muted">{s.shortDescription || s.description.slice(0, 80)}...</p>
                          </div>
                          <div className="text-right hidden sm:flex flex-col">
                            <span className="font-semibold tabular text-fg">{formatINR(s.price)}</span>
                            <span className="text-xs text-muted">{s.durationMinutes} min</span>
                          </div>
                          <Link
                            href="/book"
                            className="text-xs font-semibold text-brand-text hover:underline hover:text-brand/90 flex items-center gap-1"
                          >
                            Book <ArrowRight className="size-3.5" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </PanelBody>
                </div>
              </Panel>
            ))}
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
