import { getPrimaryBranch } from "@/features/site/queries";
import { getActor } from "@/lib/auth/session";
import { brand } from "@/config/brand";
import { SiteHeader, type Viewer } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { ContactForm } from "./contact-form";
import Link from "next/link";
import { ArrowRight, MapPin, Phone, Mail, Clock } from "lucide-react";
import { InstagramIcon, FacebookIcon, WhatsAppIcon } from "@/components/brand/social-icons";
import { Panel, PanelHeader, PanelBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = {
  title: `Contact · ${brand.name}`,
  description: "Get in touch with Stellar Family Salon — book, enquire or just say hello.",
};

export default async function ContactPage() {
  const [branch, actor] = await Promise.all([getPrimaryBranch(), getActor()]);

  const viewer: Viewer | null = actor
    ? { name: actor.name, homeHref: "/", roleLabel: actor.roles[0]?.name ?? "Member" }
    : null;

  const phone = branch?.phone ?? brand.fallbackContact.phone;
  const email = branch?.email ?? brand.fallbackContact.email;
  const address = `${branch?.addressLine1 ?? brand.fallbackContact.addressLine1}, ${branch?.city ?? brand.fallbackContact.city}, ${branch?.state ?? brand.fallbackContact.state} ${branch?.postalCode ?? brand.fallbackContact.postalCode}`;
  const instagram = branch?.instagramUrl ?? brand.social.instagramUrl;
  const wa = branch?.whatsapp?.replace(/[^\d]/g, "");

  return (
    <div className="min-h-dvh bg-canvas">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-sand">
        Skip to content
      </a>
      <SiteHeader viewer={viewer} />
      <main id="main" className="min-h-[60vh] pb-20 sm:pb-0">
        <div className="shell py-12 lg:py-20">
          <PanelHeader title="Contact Us" description="Book, enquire or just say hello. We'd love to hear from you." icon={<MapPin className="size-5" />} />

          <div className="mt-12 grid gap-10 lg:grid-cols-2">
            <Panel>
              <PanelHeader title="Get in touch" icon={<Phone className="size-5" />} />
              <PanelBody className="space-y-5">
                <ContactForm />
              </PanelBody>
            </Panel>

            <Panel>
              <PanelHeader title="Visit us" icon={<MapPin className="size-5" />} />
              <PanelBody className="space-y-5">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="size-5 text-brand-text shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-fg">Address</p>
                      <p className="text-fg-2 text-sm leading-relaxed">{address}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="size-5 text-brand-text shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-fg">Phone</p>
                      <p className="text-fg-2 text-sm">{phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="size-5 text-brand-text shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-fg">Email</p>
                      <p className="text-fg-2 text-sm">{email}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-line">
                  <p className="font-medium text-fg mb-3">Follow us</p>
                  <div className="flex gap-3">
                    <a href={instagram} target="_blank" rel="noreferrer" className="grid size-10 place-items-center rounded-full border border-line bg-surface text-fg transition-colors hover:border-brand hover:bg-brand hover:text-brand-fg">
                      <InstagramIcon className="size-[18px]" />
                    </a>
                    {branch?.facebookUrl && (
                      <a href={branch.facebookUrl} target="_blank" rel="noreferrer" className="grid size-10 place-items-center rounded-full border border-line bg-surface text-fg transition-colors hover:border-brand hover:bg-brand hover:text-brand-fg">
                        <FacebookIcon className="size-[18px]" />
                      </a>
                    )}
                    {wa && (
                      <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" className="grid size-10 place-items-center rounded-full border border-line bg-surface text-fg transition-colors hover:border-brand hover:bg-brand hover:text-brand-fg">
                        <WhatsAppIcon className="size-[18px]" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-line">
                  <p className="font-medium text-fg mb-3">Opening hours</p>
                  <div className="space-y-1 text-sm">
                    {(branch?.hours ?? []).map((h) => {
                      const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                      return (
                        <div key={h.weekday} className="flex justify-between">
                          <span className={cn("text-fg-2", h.isClosed && "text-fg-2")}>
                            {h.isClosed ? "Closed" : labels[h.weekday]}
                          </span>
                          <span className={cn("font-mono tabular", h.isClosed && "text-fg-2", !h.isClosed && "text-fg")}>
                            {h.isClosed ? "Closed" : `${h.opensAt} – ${h.closesAt}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </PanelBody>
            </Panel>
          </div>

          <div className="mt-16 flex items-center justify-between gap-4">
            <a href="/" className="text-sm text-fg-2 hover:text-fg">&larr; Back to homepage</a>
            <Button asChild size="md" className="bg-brand text-brand-fg hover:bg-brand/90">
              <Link href="/book">Book online <ArrowRight className="size-4 ml-1" /></Link>
            </Button>
          </div>
        </div>
      </main>
      <SiteFooter branch={branch} />
    </div>
  );
}
