import { getCatalogue, getStylists, getPrimaryBranch, getLiveOffers } from "@/features/site/queries";
import { getActor } from "@/lib/auth/session";
import { BookingWizard } from "@/components/booking/wizard";

export default async function BookPage() {
  const [catalogue, stylists, branch, actor, offers] = await Promise.all([
    getCatalogue(),
    getStylists(),
    getPrimaryBranch(),
    getActor(),
    getLiveOffers(),
  ]);

  return (
    <div className="min-h-dvh bg-canvas">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-sand">
        Skip to content
      </a>
      <BookingWizard
        categories={catalogue}
        stylists={stylists}
        branch={branch}
        viewer={actor ? { name: actor.name, email: actor.email } : null}
        offers={offers}
      />
    </div>
  );
}
