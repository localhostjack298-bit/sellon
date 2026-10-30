import { getGallery, getPrimaryBranch } from "@/features/site/queries";
import { getActor } from "@/lib/auth/session";
import { brand } from "@/config/brand";
import { SiteHeader, type Viewer } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import Link from "next/link";
import { ArrowRight, Image } from "lucide-react";
import { Panel, PanelHeader, PanelBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = {
  title: `Gallery · ${brand.name}`,
  description: "Salon interior, stylist work, treatments and before & after transformations.",
};

const CATEGORY_LABELS: Record<string, string> = {
  INTERIOR: "Interior",
  HAIRSTYLE: "Hairstyle",
  MAKEUP: "Makeup",
  TREATMENT: "Treatment",
  BEFORE_AFTER: "Before & After",
};

export default async function GalleryPage() {
  const [gallery, branch, actor] = await Promise.all([
    getGallery(),
    getPrimaryBranch(),
    getActor(),
  ]);

  const viewer: Viewer | null = actor
    ? { name: actor.name, homeHref: "/", roleLabel: actor.roles[0]?.name ?? "Member" }
    : null;

  const categories = [...new Set(gallery.map((g) => g.category))];

  return (
    <div className="min-h-dvh bg-canvas">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-sand">
        Skip to content
      </a>
      <SiteHeader viewer={viewer} />
      <main id="main" className="min-h-[60vh] pb-20 sm:pb-0">
        <div className="shell py-12 lg:py-20">
          <PanelHeader
            title="Gallery"
            description="Salon interior, stylist work, treatments and before & after transformations."
            icon={<Image className="size-5" />}
          />

          {gallery.length === 0 ? (
            <Panel className="mt-10">
              <PanelBody className="text-center py-12">
                <p className="text-fg-2">No gallery items yet.</p>
              </PanelBody>
            </Panel>
          ) : (
            <>
              <div className="mt-10 flex flex-wrap gap-2 mb-8">
                <Link
                  href="/gallery"
                  className="px-3 py-1.5 rounded-lg bg-ink text-canvas font-semibold text-sm"
                >
                  All
                </Link>
                {categories.map((cat) => (
                  <Link
                    key={cat}
                    href={`/gallery?category=${cat}`}
                    className="px-3 py-1.5 rounded-lg border border-line bg-surface text-fg-2 hover:text-fg hover:border-brand transition-colors text-sm"
                  >
                    {CATEGORY_LABELS[cat] || cat}
                  </Link>
                ))}
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {gallery.map((item) => (
                  <Panel key={item.id} className="overflow-hidden group hover:border-brand transition-colors">
                    <div className="relative h-56 rounded-lg border border-line bg-surface overflow-hidden group">
                      {item.asset.url ? (
                        <img src={item.asset.url} alt={item.asset.alt} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="h-full w-full bg-sand/30 flex items-center justify-center text-fg-2">
                          <Image className="size-12 opacity-50" />
                        </div>
                      )}
                      {item.before && (
                        <div className="absolute inset-0 bg-gradient-to-tr from-ink/80 via-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                          <span className="ml-1 text-sm font-medium text-sand">Before & After</span>
                        </div>
                      )}
                      <span className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-ink/80 text-sand text-xs font-bold border border-white/10">
                        {CATEGORY_LABELS[item.category] || item.category}
                      </span>
                    </div>
                    <PanelBody className="pt-3">
                      <h4 className="font-medium text-fg">{item.title}</h4>
                      {item.caption && (
                        <p className="mt-1 text-xs text-muted line-clamp-2">{item.caption}</p>
                      )}
                    </PanelBody>
                  </Panel>
                ))}
              </div>
            </>
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
