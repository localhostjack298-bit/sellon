/**
 * ──────────────────────────────────────────────────────────────────────────────
 *  BRAND & BUSINESS DEFAULTS — the central place to swap identity details.
 * ──────────────────────────────────────────────────────────────────────────────
 *  What lives where
 *   • This file ............ static identity: name, colours, logo files, social handles, fallback copy.
 *                            These are the *fallbacks* used when the database has no override.
 *   • Admin → Branches ..... live business info (address, phone, email, hours, map, social links).
 *   • Admin → Homepage ..... live hero / experience / signature copy and image references.
 *   • Admin → Gallery ...... the media library (every image on the site is a `MediaAsset` row, so
 *                            replacing a file's URL updates every place it appears).
 *   • docs/CUSTOMIZING.md .. step-by-step guide for replacing logo, imagery and copy.
 *
 *  Instagram research note: the public Instagram profile
 *  (https://www.instagram.com/stellar_familysalon/) could not be accessed during the build (HTTP 403,
 *  login wall), so the logo, photography style and service positioning were NOT copied from it. The
 *  identity below is a refined, fully replaceable placeholder built on the three mandated brand colours.
 */

export const brand = {
  name: "Stellar Family Salon",
  shortName: "Stellar",
  descriptor: "Family Salon",
  tagline: "Your Look. Your Moment. Your Stellar Experience.",
  description:
    "A boutique family salon for hair, skin, nails and grooming — thoughtful consultations, skilled hands and a calm, welcoming room for every age.",

  /** The three mandated brand colours (also defined as CSS variables in `app/globals.css`). */
  colors: {
    primary: "#D5360C",
    sand: "#E6D5BD",
    ink: "#101010",
  },

  social: {
    instagramHandle: "stellar_familysalon",
    instagramUrl: "https://www.instagram.com/stellar_familysalon/",
  },

  /** Local brand files (inline SVG components are used for the mark; swap in `/public/brand/*` files if preferred). */
  assets: {
    logoMark: "/brand/stellar-mark.svg",
    favicon: "/icon.svg",
  },

  /** Fallbacks used only if the primary branch row is missing/empty. Real values live in the database. */
  fallbackContact: {
    phone: "+91 90000 00000",
    email: "hello@stellar-demo.example",
    addressLine1: "Demo address — edit under Admin → Branches",
    city: "Your City",
    state: "Your State",
    postalCode: "000000",
  },

  demoNotice:
    "Demo environment — business details, prices, people, offers and images are fictional samples for presentation purposes.",

  imageNotice: "Demo imagery is illustrative AI-generated artwork — not photographs of Stellar's team, clients or work.",

  currency: "INR",
  timezone: "Asia/Kolkata",
  locale: "en-IN",
} as const;

export type Brand = typeof brand;

/**
 * Local image bundle (files in /public/images). Seed script creates a `MediaAsset` for each of these;
 * use the admin media library to replace them with real photography.
 */
export const LOCAL_IMAGES = {
  heroDesktop: { url: "/images/hero-desktop.jpg", alt: "Editorial portrait of a woman with a sleek copper-auburn bob against a deep charcoal studio backdrop", w: 1920, h: 1072 },
  heroMobile: { url: "/images/hero-mobile.jpg", alt: "A stylist's hand lifting a section of long glossy copper-brown hair with a tortoiseshell comb", w: 898, h: 1116 },
  experienceInterior: { url: "/images/experience-interior.jpg", alt: "A warm boutique salon interior with round brass mirrors, champagne leather chairs and charcoal walls", w: 928, h: 1152 },
  experienceHands: { url: "/images/experience-hands.jpg", alt: "A stylist's hands sectioning and brushing glossy auburn hair under warm light", w: 1264, h: 848 },
  catHaircuts: { url: "/images/cat-haircuts.jpg", alt: "A stylist blow-drying a layered shoulder-length haircut with a round brush", w: 1200, h: 896 },
  catColour: { url: "/images/cat-colour.jpg", alt: "A gloved hand painting caramel balayage highlights onto long brunette hair", w: 1200, h: 896 },
  catSkin: { url: "/images/cat-skin.jpg", alt: "A woman relaxing during a facial with a soft champagne-coloured mask", w: 1200, h: 896 },
  catBridal: { url: "/images/cat-bridal.jpg", alt: "A makeup artist applying finishing touches to a bride with a sheer veil", w: 1200, h: 896 },
  catNails: { url: "/images/cat-nails.jpg", alt: "Hands with deep orange-red almond nails resting on a champagne towel", w: 1200, h: 896 },
  catGrooming: { url: "/images/cat-grooming.jpg", alt: "A barber trimming a well-groomed beard in a moody, warmly lit barbershop", w: 1200, h: 896 },
  beforeDemo: { url: "/images/demo-before.jpg", alt: "Illustrative 'before' example: flatter, duller hair colour", w: 1200, h: 896 },
} as const;

export type LocalImageKey = keyof typeof LOCAL_IMAGES;
