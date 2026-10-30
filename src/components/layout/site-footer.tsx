import Link from "next/link";
import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from "@/components/brand/social-icons";
import { brand } from "@/config/brand";
import { hoursTable, mapsDirectionsUrl } from "@/lib/hours";
import type { BranchDTO } from "@/features/site/queries";

const EXPLORE = [
  { href: "/services", label: "Services" },
  { href: "/offers", label: "Offers" },
  { href: "/our-team", label: "Our team" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function SiteFooter({ branch, blurb }: { branch: BranchDTO | null; blurb?: string }) {
  const hours = branch ? hoursTable(branch.hours) : [];
  const phone = branch?.phone ?? brand.fallbackContact.phone;
  const email = branch?.email ?? brand.fallbackContact.email;
  const instagram = branch?.instagramUrl ?? brand.social.instagramUrl;
  const wa = branch?.whatsapp?.replace(/[^\d]/g, "");
  return (
    <footer className="mt-24 border-t border-line bg-ink text-sand">
      <div className="shell grid gap-14 py-16 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Logo tone="light" />
          <p className="mt-8 max-w-sm font-display text-3xl font-medium italic leading-tight text-sand">{brand.tagline}</p>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-sand/65">{blurb ?? brand.description}</p>
          <div className="mt-7 flex items-center gap-2.5">
            <a href={instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="grid size-10 place-items-center rounded-full border border-white/15 text-sand transition-colors hover:border-brand hover:bg-brand hover:text-brand-fg"><InstagramIcon className="size-[18px]" /></a>
            {branch?.facebookUrl ? <a href={branch.facebookUrl} target="_blank" rel="noreferrer" aria-label="Facebook" className="grid size-10 place-items-center rounded-full border border-white/15 transition-colors hover:border-brand hover:bg-brand hover:text-brand-fg"><FacebookIcon className="size-[18px]" /></a> : null}
            {wa ? <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="grid size-10 place-items-center rounded-full border border-white/15 transition-colors hover:border-brand hover:bg-brand hover:text-brand-fg"><WhatsAppIcon className="size-[18px]" /></a> : null}
          </div>
        </div>

        <nav aria-label="Footer" className="lg:col-span-2">
          <h2 className="eyebrow mb-5 text-sand/50">Explore</h2>
          <ul className="space-y-3 text-sm">
            {EXPLORE.map((l) => (<li key={l.href}><Link href={l.href} className="text-sand/85 transition-colors hover:text-brand-text">{l.label}</Link></li>))}
            <li><Link href="/book" className="font-semibold text-brand-text hover:underline">Book an appointment</Link></li>
          </ul>
        </nav>

        <div className="lg:col-span-2">
          <h2 className="eyebrow mb-5 text-sand/50">Visit</h2>
          <address className="space-y-3 text-sm not-italic text-sand/85">
            {branch ? (
              <p className="flex gap-2.5"><MapPin className="mt-0.5 size-4 shrink-0 text-brand-text" />
                <span>{branch.addressLine1}{branch.addressLine2 ? <><br />{branch.addressLine2}</> : null}<br />{branch.city}, {branch.state} {branch.postalCode}</span>
              </p>
            ) : null}
            <p className="flex gap-2.5"><Phone className="mt-0.5 size-4 shrink-0 text-brand-text" /><a href={`tel:${phone.replace(/\s/g, "")}`} className="hover:text-brand-text">{phone}</a></p>
            <p className="flex gap-2.5"><Mail className="mt-0.5 size-4 shrink-0 text-brand-text" /><a href={`mailto:${email}`} className="break-all hover:text-brand-text">{email}</a></p>
            {branch ? <a href={mapsDirectionsUrl(branch)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 pt-1 text-xs font-bold uppercase tracking-[0.14em] text-sand hover:text-brand-text">Directions <ArrowUpRight className="size-3.5" /></a> : null}
          </address>
        </div>

        <div className="lg:col-span-3">
          <h2 className="eyebrow mb-5 text-sand/50">Opening hours</h2>
          <dl className="space-y-2 text-sm">
            {hours.map((h) => (
              <div key={h.id} className="flex items-baseline justify-between gap-4 border-b border-white/10 pb-2 last:border-0">
                <dt className="text-sand/70">{h.label}</dt>
                <dd className={h.closed ? "text-sand/40" : "tabular text-sand"}>{h.text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="shell flex flex-col gap-3 py-6 text-xs text-sand/50 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} {brand.name}. Pay at the salon — no online payments are taken.</p>
          <p className="max-w-2xl md:text-right">{brand.demoNotice} {brand.imageNotice}</p>
        </div>
        <div className="shell flex flex-wrap gap-x-6 gap-y-2 pb-8 text-xs text-sand/60">
          <Link href="/privacy" className="hover:text-sand">Privacy</Link>
          <Link href="/terms" className="hover:text-sand">Terms</Link>
          <Link href="/demo" className="hover:text-sand">Demo accounts</Link>
          <Link href="/login" className="hover:text-sand">Staff &amp; admin sign-in</Link>
        </div>
      </div>
    </footer>
  );
}
