import Link from "next/link";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionHeading } from "@/components/public/cta";
import { FacebookIcon, InstagramIcon } from "@/components/brand/social-icons";

interface Branch {
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  email: string;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  whatsapp?: string | null;
  mapUrl?: string | null;
  hours: { label: string; text: string; closed: boolean }[];
}

export function VisitUs({ branch }: { branch: Branch }) {
  return (
    <section aria-label="Visit us" className="py-24 bg-ink text-sand relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_120%_at_50%_-20%,#d5360c/15,#101010)]" />
      <div className="shell">
        <SectionHeading
          eyebrow="Visit us"
          title="Come say hello"
          intro="We are open Tuesday to Sunday. Payments are taken at the salon — cash, UPI or card at the desk."
          align="center"
          className="mb-14 text-sand"
        />

        <div className="grid gap-12 lg:grid-cols-3">
          <div className="space-y-6">
            <p className="text-[1rem] leading-relaxed text-white/80">
              Pop in for a consultation, pick up products or just see the room before booking. We will make time for you.
            </p>
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <MapPin className="mt-1 size-5 shrink-0 text-brand-text" />
                <address className="text-white/70 not-italic max-w-[18ch]">
                  {branch.addressLine1}<br />
                  {branch.city}, {branch.state} {branch.postalCode}
                </address>
              </div>
              <div className="flex items-center gap-4">
                <Phone className="size-5 shrink-0 text-brand-text" />
                <a href={`tel:${branch.phone.replace(/\s/g, "")}`} className="text-white/80 hover:text-brand-text">{branch.phone}</a>
              </div>
              <div className="flex items-center gap-4">
                <Mail className="size-5 shrink-0 text-brand-text" />
                <a href={`mailto:${branch.email}`} className="text-white/80 hover:text-brand-text">{branch.email}</a>
              </div>
            </div>
            <div className="border-t border-white/10 pt-6">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/50">Opening hours</p>
              <ul className="space-y-3 text-sm text-white/70">
                {branch.hours.map((h) => (
                  <li key={h.label} className="flex justify-between gap-2">
                    <span className="text-white/50">{h.label}</span>
                    <span className={cn("tabular", h.closed ? "text-white/40" : "text-sand")}>{h.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="hidden lg:flex flex-col gap-6">
            <div className="aspect-[4/5] rounded-lg border border-white/10 bg-white/5 overflow-hidden">
              {branch.mapUrl ? (
                <a href={branch.mapUrl} target="_blank" rel="noreferrer" className="w-full h-full block">
                  <img src="https://maps.googleapis.com/maps/api/staticmap?center=PLACEHOLDER&zoom=15&size=400x500&maptype=roadmap&key=DEMO" alt="Map placeholder" className="w-full h-full object-cover opacity-70" />
                </a>
              ) : (
                <div className="grid h-full place-items-center bg-white/5 text-white/20">
                  <div className="text-center">
                    <div className="mb-2 size-12 rounded-full border border-white/10 bg-ink flex items-center justify-center mx-auto">
                      <MapPin className="size-5 text-sand" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/50">Map link — add under Admin → Branches</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/50">Follow</p>
            <div className="flex flex-wrap gap-3">
              <a href={branch.instagramUrl ?? "https://www.instagram.com/stellar_familysalon/"} target="_blank" rel="noreferrer" className="grid size-11 place-items-center rounded-full border border-white/20 text-white transition-colors hover:bg-brand hover:text-brand-fg hover:border-brand"><InstagramIcon className="size-[18px]" /></a>
              {branch.facebookUrl ? <a href={branch.facebookUrl} target="_blank" rel="noreferrer" className="grid size-11 place-items-center rounded-full border border-white/20 text-white transition-colors hover:bg-brand hover:text-brand-fg hover:border-brand"><span className="sr-only">Facebook</span><FacebookIcon className="size-[18px]" /></a> : null}
              {branch.whatsapp ? <a href={`https://wa.me/${branch.whatsapp.replace(/[^\d]/g, "")}`} target="_blank" rel="noreferrer" className="grid size-11 place-items-center rounded-full border border-white/20 text-white transition-colors hover:bg-brand hover:text-brand-fg hover:border-brand"><span className="sr-only">WhatsApp</span>WA</a> : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
