import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma/client";
import { toNumber } from "@/lib/money";

/* ── Media ───────────────────────────────────────────────────────────────────────────── */

export interface MediaDTO {
  id: string;
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
  isDemo: boolean;
}

type MediaRow = { id: string; url: string; alt: string; width: number | null; height: number | null; isDemoPlaceholder: boolean };
export const mediaSelect = { id: true, url: true, alt: true, width: true, height: true, isDemoPlaceholder: true } as const;
export const toMedia = (m: MediaRow | null | undefined): MediaDTO | null =>
  m ? { id: m.id, url: m.url, alt: m.alt, width: m.width, height: m.height, isDemo: m.isDemoPlaceholder } : null;

export const getMediaMap = cache(async (ids: string[]) => {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return {} as Record<string, MediaDTO>;
  const rows = await prisma.mediaAsset.findMany({ where: { id: { in: unique } }, select: mediaSelect });
  return Object.fromEntries(rows.map((r) => [r.id, toMedia(r)!]));
});

/* ── Branch ──────────────────────────────────────────────────────────────────────────── */

export const getPrimaryBranch = cache(async () => {
  const branch = await prisma.salonBranch.findFirst({
    where: { isPrimary: true, isActive: true },
    include: { hours: { orderBy: { weekday: "asc" } }, policy: true },
  });
  return branch;
});

export type BranchDTO = NonNullable<Awaited<ReturnType<typeof getPrimaryBranch>>>;

/* ── Content (CMS-lite) ──────────────────────────────────────────────────────────────── */

export const getContentBlocks = cache(async (keys: string[], preview = false) => {
  const rows = await prisma.websiteContent.findMany({ where: { key: { in: keys } } });
  const out: Record<string, Record<string, unknown>> = {};
  for (const r of rows) out[r.key] = ((preview && r.draft ? r.draft : r.published) ?? {}) as Record<string, unknown>;
  return out;
});

/* ── Catalogue ───────────────────────────────────────────────────────────────────────── */

export interface ServiceDTO {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  durationMinutes: number;
  price: number;
  audience: "EVERYONE" | "WOMEN" | "MEN" | "KIDS";
  requiresApproval: boolean;
  requiredResource: string | null;
  isFeatured: boolean;
  isSignature: boolean;
  signatureStory: string | null;
  tags: string[];
  category: { id: string; slug: string; name: string };
  image: MediaDTO | null;
  staffIds: string[];
}

export interface CategoryDTO {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  image: MediaDTO | null;
  services: ServiceDTO[];
}

export const getCatalogue = cache(async (): Promise<CategoryDTO[]> => {
  const categories = await prisma.serviceCategory.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      image: { select: mediaSelect },
      services: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: { image: { select: mediaSelect }, staff: { select: { employeeId: true } } },
      },
    },
  });
  return categories.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    tagline: c.tagline,
    description: c.description,
    image: toMedia(c.image),
    services: c.services.map((s) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      shortDescription: s.shortDescription,
      description: s.description,
      durationMinutes: s.durationMinutes,
      price: toNumber(s.priceFrom),
      audience: s.audience,
      requiresApproval: s.requiresApproval,
      requiredResource: s.requiredResource,
      isFeatured: s.isFeatured,
      isSignature: s.isSignature,
      signatureStory: s.signatureStory,
      tags: s.tags,
      category: { id: c.id, slug: c.slug, name: c.name },
      image: toMedia(s.image) ?? toMedia(c.image),
      staffIds: s.staff.map((x) => x.employeeId),
    })),
  }));
});

export const getServiceBySlug = cache(async (slug: string) => {
  const catalogue = await getCatalogue();
  for (const c of catalogue) {
    const s = c.services.find((x) => x.slug === slug);
    if (s) return { service: s, category: c };
  }
  return null;
});

/* ── Stylists ────────────────────────────────────────────────────────────────────────── */

export interface StylistDTO {
  id: string;
  name: string;
  firstName: string;
  jobTitle: string;
  bio: string | null;
  specialties: string[];
  skillCategories: string[];
  languages: string[];
  yearsExperience: number | null;
  isFeatured: boolean;
  isBookable: boolean;
  displayOrder: number;
  portrait: MediaDTO | null;
  serviceIds: string[];
  employmentType: string;
}

export const getStylists = cache(async (): Promise<StylistDTO[]> => {
  const rows = await prisma.employeeProfile.findMany({
    where: { isBookable: true, employmentStatus: { in: ["ACTIVE", "PROBATION"] }, user: { status: "ACTIVE" } },
    orderBy: { displayOrder: "asc" },
    include: { user: { select: { name: true } }, portrait: { select: mediaSelect }, services: { select: { serviceId: true } } },
  });
  return rows.map((e) => ({
    id: e.id,
    name: e.user.name,
    firstName: e.user.name.split(" ")[0]!,
    jobTitle: e.jobTitle,
    bio: e.bio,
    specialties: e.specialties,
    skillCategories: e.skillCategories,
    languages: e.languages,
    yearsExperience: e.yearsExperience,
    isFeatured: e.isFeatured,
    isBookable: e.isBookable,
    displayOrder: e.displayOrder,
    portrait: toMedia(e.portrait),
    serviceIds: e.services.map((s) => s.serviceId),
    employmentType: e.employmentType,
  }));
});

/* ── Offers ──────────────────────────────────────────────────────────────────────────── */

export interface OfferDTO {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string;
  terms: string | null;
  badge: string | null;
  code: string | null;
  type: "PERCENTAGE" | "FIXED_AMOUNT";
  value: number;
  maxDiscount: number | null;
  minSpend: number | null;
  audience: "EVERYONE" | "NEW_CUSTOMERS" | "RETURNING_CUSTOMERS";
  firstVisitOnly: boolean;
  categoryId: string | null;
  categoryName: string | null;
  serviceIds: string[];
  startsAt: string;
  endsAt: string;
  isFeatured: boolean;
  isDemoExample: boolean;
  image: MediaDTO | null;
}

export function offerLiveWhere(now = new Date()) {
  return { status: "ACTIVE" as const, startsAt: { lte: now }, endsAt: { gte: now } };
}

export const getLiveOffers = cache(async (): Promise<OfferDTO[]> => {
  const rows = await prisma.offer.findMany({
    where: offerLiveWhere(),
    orderBy: [{ isFeatured: "desc" }, { endsAt: "asc" }],
    include: { image: { select: mediaSelect }, services: true, category: { select: { name: true } } },
  });
  return rows.map(toOfferDTO);
});

export function toOfferDTO(o: {
  id: string; slug: string; title: string; subtitle: string | null; description: string; terms: string | null; badge: string | null; code: string | null;
  type: "PERCENTAGE" | "FIXED_AMOUNT"; value: unknown; maxDiscount: unknown; minSpend: unknown; audience: OfferDTO["audience"]; firstVisitOnly: boolean;
  categoryId: string | null; startsAt: Date; endsAt: Date; isFeatured: boolean; isDemoExample: boolean;
  image: MediaRow | null; services: { serviceId: string }[]; category: { name: string } | null;
}): OfferDTO {
  return {
    id: o.id, slug: o.slug, title: o.title, subtitle: o.subtitle, description: o.description, terms: o.terms, badge: o.badge, code: o.code,
    type: o.type, value: toNumber(o.value as never), maxDiscount: o.maxDiscount ? toNumber(o.maxDiscount as never) : null,
    minSpend: o.minSpend ? toNumber(o.minSpend as never) : null, audience: o.audience, firstVisitOnly: o.firstVisitOnly,
    categoryId: o.categoryId, categoryName: o.category?.name ?? null, serviceIds: o.services.map((s) => s.serviceId),
    startsAt: o.startsAt.toISOString(), endsAt: o.endsAt.toISOString(), isFeatured: o.isFeatured, isDemoExample: o.isDemoExample, image: toMedia(o.image),
  };
}

/* ── Gallery ─────────────────────────────────────────────────────────────────────────── */

export interface GalleryDTO {
  id: string;
  title: string;
  caption: string | null;
  category: "INTERIOR" | "HAIRSTYLE" | "MAKEUP" | "TREATMENT" | "BEFORE_AFTER";
  asset: MediaDTO;
  before: MediaDTO | null;
  isFeatured: boolean;
}

export const getGallery = cache(async (): Promise<GalleryDTO[]> => {
  const rows = await prisma.galleryItem.findMany({
    where: { isPublished: true },
    orderBy: { sortOrder: "asc" },
    include: { asset: { select: mediaSelect }, beforeAsset: { select: mediaSelect } },
  });
  return rows.map((g) => ({
    id: g.id, title: g.title, caption: g.caption, category: g.category, asset: toMedia(g.asset)!, before: toMedia(g.beforeAsset), isFeatured: g.isFeatured,
  }));
});
