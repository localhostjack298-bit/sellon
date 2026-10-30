import type { PrismaClient } from "@/generated/prisma/client";
import { CATEGORIES, PAIRINGS, SERVICES, type StaffKey } from "./data/catalogue";
import { mediaId } from "./core";

const SERVICE_IMAGE_OVERRIDES: Record<string, string | null> = {
  "smoothing-treatment": "heroMobile",
  "deep-conditioning-ritual": "experienceHands",
  "fringe-trim-refresh": "experienceHands",
  "saree-draping-hair-set": "catBridal",
  "threading-brow-shaping": "catSkin",
  "little-stars-cut": null,
  "parent-child-cut": null,
};

export async function seedCatalogue(prisma: PrismaClient) {
  const categoryId = new Map<string, string>();
  let order = 0;
  for (const c of CATEGORIES) {
    const row = await prisma.serviceCategory.upsert({
      where: { slug: c.slug },
      create: {
        slug: c.slug, name: c.name, tagline: c.tagline, description: c.description,
        imageId: c.image ? mediaId(c.image) : null, sortOrder: order,
      },
      update: { name: c.name, tagline: c.tagline, description: c.description, imageId: c.image ? mediaId(c.image) : null, sortOrder: order },
    });
    categoryId.set(c.slug, row.id);
    order++;
  }

  const serviceId = new Map<string, string>();
  order = 0;
  for (const s of SERVICES) {
    const catImage = CATEGORIES.find((c) => c.slug === s.category)?.image ?? null;
    const imageKey = s.slug in SERVICE_IMAGE_OVERRIDES ? SERVICE_IMAGE_OVERRIDES[s.slug] : catImage;
    const data = {
      categoryId: categoryId.get(s.category)!,
      name: s.name,
      shortDescription: s.short,
      description: s.description,
      durationMinutes: s.duration,
      priceFrom: s.price.toFixed(2),
      imageId: imageKey ? mediaId(imageKey) : null,
      audience: s.audience,
      requiredResource: s.resource ?? null,
      requiresApproval: Boolean(s.requiresApproval),
      isFeatured: Boolean(s.featured),
      isSignature: Boolean(s.signature),
      signatureStory: s.signatureStory ?? null,
      tags: s.tags ?? [],
      sortOrder: order,
      isDemoPrice: true,
      isActive: true,
    };
    const row = await prisma.service.upsert({ where: { slug: s.slug }, create: { slug: s.slug, ...data }, update: data });
    serviceId.set(s.slug, row.id);
    order++;
  }

  for (const p of PAIRINGS) {
    const fromServiceId = serviceId.get(p.from)!;
    const toServiceId = serviceId.get(p.to)!;
    await prisma.servicePairing.upsert({
      where: { fromServiceId_toServiceId: { fromServiceId, toServiceId } },
      create: { fromServiceId, toServiceId, reason: p.reason },
      update: { reason: p.reason },
    });
  }

  return { categoryId, serviceId };
}

/** Qualify employees for services (drives booking eligibility). */
export async function seedStaffServices(prisma: PrismaClient, serviceId: Map<string, string>, employeeId: Map<StaffKey, string>) {
  await prisma.staffService.deleteMany({});
  const rows: { employeeId: string; serviceId: string }[] = [];
  for (const s of SERVICES) {
    for (const key of s.staff) {
      const e = employeeId.get(key);
      if (e) rows.push({ employeeId: e, serviceId: serviceId.get(s.slug)! });
    }
  }
  await prisma.staffService.createMany({ data: rows, skipDuplicates: true });
  return rows.length;
}
