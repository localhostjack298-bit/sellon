import { SiteHeader, type Viewer } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileBookBar } from "@/components/layout/mobile-book-bar";
import { getActor } from "@/lib/auth/session";
import { homePathFor } from "@/lib/permissions/engine";
import { getContentBlocks, getPrimaryBranch } from "@/features/site/queries";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [actor, branch, content] = await Promise.all([getActor(), getPrimaryBranch(), getContentBlocks(["site.footer"])]);
  const viewer: Viewer | null = actor
    ? { name: actor.name, homeHref: homePathFor(actor), roleLabel: actor.roles[0]?.name ?? "Member" }
    : null;
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-sand">Skip to content</a>
      <SiteHeader viewer={viewer} />
      <main id="main" className="min-h-[60vh] pb-20 sm:pb-0">{children}</main>
      <SiteFooter branch={branch} blurb={content["site.footer"]?.blurb as string | undefined} />
      <MobileBookBar />
    </>
  );
}
