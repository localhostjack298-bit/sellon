import { getPrimaryBranch, getCatalogue, getContentBlocks, getLiveOffers, getStylists, getGallery, type OfferDTO, type StylistDTO } from "@/features/site/queries";
import { Hero } from "@/components/public/hero";
import { ServiceExplorer } from "@/components/public/service-explorer";
import { SignatureTreatments } from "@/components/public/signature-treatments";
import { Stylists } from "@/components/public/stylists";
import { Offers } from "@/components/public/offers";
import { Gallery } from "@/components/public/gallery";
import { VisitUs } from "@/components/public/visit-us";
import { brand, LOCAL_IMAGES } from "@/config/brand";

/** Shapes expected by the homepage sections — mapped from the CMS-lite data layer. */
type HeroContent = {
  eyebrow: string;
  lines: string[];
  subheadline: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  highlights: string[];
};

type ExplorerCategory = {
  slug: string;
  name: string;
  tagline: string | null;
  imageUrl: string | null;
  imageAlt: string;
  services: { slug: string; name: string; durationMinutes: number; price: number; requiresApproval: boolean }[];
};

type Treatment = {
  slug: string;
  numeral: string;
  title: string;
  desc: string;
  media: { url: string; alt: string } | null;
};

type OfferCard = {
  title: string;
  subtitle: string | null;
  description: string;
  terms: string | null;
  code: string | null;
  type: "PERCENTAGE" | "FIXED_AMOUNT";
  value: number;
  maxDiscount: number | null;
  minSpend: number | null;
  badge: string | null;
};

type GalleryItem = {
  id: string;
  title: string;
  caption: string | null;
  category: "INTERIOR" | "HAIRSTYLE" | "MAKEUP" | "TREATMENT" | "BEFORE_AFTER";
  asset: { url: string; alt: string };
  before: { url: string; alt: string } | null;
  isFeatured: boolean;
};

const HERO_FALLBACK: HeroContent = {
  eyebrow: brand.name,
  lines: ["Your Look.", "Your Moment.", "Your Stellar Experience."],
  subheadline: brand.description,
  primaryCtaLabel: "Book an appointment",
  secondaryCtaLabel: "Explore our services",
  highlights: ["Open Tuesday to Sunday", "Pay at the salon", "Family-friendly"],
};

const MEDIA_BY_ALT: Record<string, { url: string; alt: string }> = {
  "balayage": { url: "/images/cat-colour.jpg", alt: "Hand-painted balayage highlights" },
  "smoothing-treatment": { url: "/images/experience-hands.jpg", alt: "Smoothing treatment detail" },
  "bridal-makeup-hair": { url: "/images/cat-bridal.jpg", alt: "Bridal makeup artist at work" },
};

function toHeroContent(block: Record<string, unknown> | undefined): HeroContent {
  const b = block ?? HERO_FALLBACK;
  return {
    eyebrow: (b.eyebrow as string) ?? HERO_FALLBACK.eyebrow,
    lines: Array.isArray(b.lines) && b.lines.length ? (b.lines as string[]) : HERO_FALLBACK.lines,
    subheadline: (b.subheadline as string) ?? HERO_FALLBACK.subheadline,
    primaryCtaLabel: (b.primaryCtaLabel as string) ?? HERO_FALLBACK.primaryCtaLabel,
    secondaryCtaLabel: (b.secondaryCtaLabel as string) ?? HERO_FALLBACK.secondaryCtaLabel,
    highlights: Array.isArray(b.highlights) && b.highlights.length ? (b.highlights as string[]) : HERO_FALLBACK.highlights,
  };
}

const SIGNATURE_ORDER: { slug: string; numeral: string; title: string; desc: string }[] = [
  {
    slug: "balayage-signature",
    numeral: "I",
    title: "Hand-painted balayage",
    desc: "Soft, lived-in dimension painted around your base colour — no harsh regrowth line, no rush.",
  },
  {
    slug: "smoothing-treatment",
    numeral: "II",
    title: "Smoothing treatment",
    desc: "Frizz softened, shine restored, with an aftercare plan that lasts well beyond the first wash.",
  },
  {
    slug: "bridal-makeup-hair",
    numeral: "III",
    title: "Bridal makeup & hair",
    desc: "A calm, unhurried morning with a dedicated artist — trial, timeline and touch-ups planned ahead.",
  },
];

export default async function HomePage() {
  const [branch, catalogue, blockContent, offers, stylists, gallery] = await Promise.all([
    getPrimaryBranch(),
    getCatalogue(),
    getContentBlocks(["home.hero"]),
    getLiveOffers(),
    getStylists(),
    getGallery(),
  ]);

  const hero = toHeroContent(blockContent["home.hero"] as Record<string, unknown> | undefined);
  const categories: ExplorerCategory[] = catalogue.map((c) => ({
    slug: c.slug,
    name: c.name,
    tagline: c.tagline,
    imageUrl: c.image?.url ?? null,
    imageAlt: c.image?.alt ?? c.name,
    services: c.services.map((s) => ({
      slug: s.slug,
      name: s.name,
      durationMinutes: s.durationMinutes,
      price: s.price,
      requiresApproval: s.requiresApproval,
    })),
  }));

  const treatments: Treatment[] = SIGNATURE_ORDER.map((t) => {
    const service = catalogue.flatMap((c) => c.services).find((s) => s.slug === t.slug);
    return {
      slug: t.slug,
      numeral: t.numeral,
      title: t.title,
      desc: service ? `${t.desc} Sample starting price ${brand.currency === "INR" ? "₹" : ""}${service.price.toLocaleString("en-IN")}.` : t.desc,
      media: MEDIA_BY_ALT[t.slug] ?? null,
    };
  });

  const stylistCards: StylistDTO[] = stylists.map((s) => ({
    id: s.id,
    name: s.name,
    firstName: s.firstName,
    jobTitle: s.jobTitle,
    bio: s.bio,
    specialties: s.specialties,
    skillCategories: s.skillCategories,
    languages: s.languages,
    yearsExperience: s.yearsExperience,
    isFeatured: s.isFeatured,
    isBookable: true,
    displayOrder: s.isFeatured ? -s.displayOrder : s.displayOrder,
    portrait: s.portrait ? { id: s.portrait.id, url: s.portrait.url, alt: s.portrait.alt, width: s.portrait.width, height: s.portrait.height, isDemo: s.portrait.isDemo } : null,
    serviceIds: s.serviceIds,
    employmentType: s.employmentType,
  }));

  const offerCards: OfferCard[] = offers.map((o) => ({
    title: o.title,
    subtitle: o.subtitle,
    description: o.description,
    terms: o.terms,
    code: o.code,
    type: o.type,
    value: o.value,
    maxDiscount: o.maxDiscount,
    minSpend: o.minSpend,
    badge: o.badge ?? (o.firstVisitOnly ? "First visit" : null),
  }));

  const galleryItems: GalleryItem[] = gallery.map((g) => ({
    id: g.id,
    title: g.title,
    caption: g.caption,
    category: g.category,
    asset: { url: g.asset.url, alt: g.asset.alt },
    before: g.before ? { url: g.before.url, alt: g.before.alt } : null,
    isFeatured: g.isFeatured,
  }));

  return (
    <div className="relative isolate overflow-hidden">
      <Hero
        content={hero}
        desktop={{ id: "local-heroDesktop", ...LOCAL_IMAGES.heroDesktop, width: LOCAL_IMAGES.heroDesktop.w, height: LOCAL_IMAGES.heroDesktop.h, isDemo: true }}
        mobile={{ id: "local-heroMobile", ...LOCAL_IMAGES.heroMobile, width: LOCAL_IMAGES.heroMobile.w, height: LOCAL_IMAGES.heroMobile.h, isDemo: true }}
      />
      <section id="explore" aria-labelledby="explore-heading" className="py-24 lg:py-32 relative">
        <div className="absolute inset-x-0 bottom-0 -z-10 h-32 bg-gradient-to-t from-ink via-canvas/20 to-transparent" />
        <div className="shell">
          <ServiceExplorer categories={categories} />
        </div>
      </section>
      <SignatureTreatments treatments={treatments} />
      <Stylists stylists={stylistCards} />
      <Offers offers={offerCards} />
      <Gallery items={galleryItems} />
      <VisitUs
        branch={{
          addressLine1: branch?.addressLine1 ?? brand.fallbackContact.addressLine1,
          addressLine2: branch?.addressLine2 ?? null,
          city: branch?.city ?? brand.fallbackContact.city,
          state: branch?.state ?? brand.fallbackContact.state,
          postalCode: branch?.postalCode ?? brand.fallbackContact.postalCode,
          phone: branch?.phone ?? brand.fallbackContact.phone,
          email: branch?.email ?? brand.fallbackContact.email,
          instagramUrl: branch?.instagramUrl ?? null,
          facebookUrl: branch?.facebookUrl ?? null,
          whatsapp: branch?.whatsapp ?? null,
          mapUrl: branch?.mapUrl ?? null,
          hours: branch?.hours.map((h) => ({ label: h.weekday === 1 ? "Mon" : h.weekday === 2 ? "Tue" : h.weekday === 3 ? "Wed" : h.weekday === 4 ? "Thu" : h.weekday === 5 ? "Fri" : h.weekday === 6 ? "Sat" : "Sun", text: `${h.opensAt} – ${h.closesAt}`, closed: h.isClosed })) ?? [],
        }}
      />
    </div>
  );
}
