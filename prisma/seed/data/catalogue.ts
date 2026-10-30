/**
 * Demo catalogue — 7 categories, 25 services. ALL names, descriptions and prices are SAMPLE content
 * (flagged `isDemoPrice`) and are meant to be edited in Admin → Services & categories.
 */
import type { LocalImageKey } from "@/config/brand";

export type StaffKey = "aarav" | "meera" | "zoya" | "rohan" | "ananya" | "kabir" | "ishita" | "dev";

export interface CategorySeed {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  image: LocalImageKey | null;
}

export interface ServiceSeed {
  slug: string;
  category: string;
  name: string;
  duration: number;
  price: number;
  audience: "EVERYONE" | "WOMEN" | "MEN" | "KIDS";
  short: string;
  description: string;
  staff: StaffKey[];
  resource?: "STYLING_STATION" | "COLOUR_BAR" | "FACIAL_ROOM" | "NAIL_BAR" | "BRIDAL_SUITE";
  requiresApproval?: boolean;
  featured?: boolean;
  signature?: boolean;
  signatureStory?: string;
  tags?: string[];
}

export const CATEGORIES: CategorySeed[] = [
  {
    slug: "haircuts-styling",
    name: "Haircuts & Styling",
    tagline: "Cut for the way you actually live.",
    description: "Every cut starts with a conversation about your routine, your texture and how much time you really spend on your hair each morning.",
    image: "catHaircuts",
  },
  {
    slug: "colour-treatments",
    name: "Colour & Hair Treatments",
    tagline: "Colour with a point of view.",
    description: "From a single glossy shade to hand-painted dimension, plus the smoothing and conditioning work that keeps hair healthy underneath.",
    image: "catColour",
  },
  {
    slug: "skin-facials",
    name: "Skin & Facials",
    tagline: "Skin care that listens first.",
    description: "Facials are tailored on the day — we look at your skin, ask what changed this month, and choose the treatment to match.",
    image: "catSkin",
  },
  {
    slug: "bridal-occasion",
    name: "Bridal & Occasion",
    tagline: "For the days you will be photographed.",
    description: "Trials, timelines and calm mornings. Plan hair and makeup for weddings, engagements and family celebrations with a dedicated artist.",
    image: "catBridal",
  },
  {
    slug: "nails-hands",
    name: "Nails & Hands",
    tagline: "Small details, done properly.",
    description: "Considered manicures and pedicures with careful prep, clean finishing and long-wearing colour.",
    image: "catNails",
  },
  {
    slug: "grooming",
    name: "Men's Grooming",
    tagline: "Sharp lines, calm chairs.",
    description: "Precision cuts, beard shaping and hot-towel finishes in an unhurried setting.",
    image: "catGrooming",
  },
  {
    slug: "kids-family",
    name: "Kids & Family",
    tagline: "Everyone in the same room, on the same schedule.",
    description: "Patient, playful haircuts for little ones and back-to-back appointments for parents and children.",
    image: null,
  },
];

export const SERVICES: ServiceSeed[] = [
  // ── Haircuts & Styling ─────────────────────────────────────────────────────
  {
    slug: "signature-cut-finish",
    category: "haircuts-styling",
    name: "Signature Cut & Finish",
    duration: 60,
    price: 1200,
    audience: "EVERYONE",
    featured: true,
    short: "A proper consultation, a precision cut and a blow-dry finish you can recreate at home.",
    description:
      "We begin with a consultation at the mirror, wash and condition, cut to suit your texture and face shape, then finish with a blow-dry and a quick lesson on styling it yourself. Includes shampoo and conditioning.",
    staff: ["aarav", "kabir", "meera", "rohan", "dev"],
    tags: ["cut", "consultation"],
  },
  {
    slug: "blow-dry-styling",
    category: "haircuts-styling",
    name: "Blow-Dry & Styling",
    duration: 45,
    price: 700,
    audience: "EVERYONE",
    short: "Shampoo, blow-dry and styling — smooth, bouncy or sleek, finished to your photo or brief.",
    description:
      "A wash and blow-dry tailored to the look you want: volume at the root, a polished lob, soft waves or glass-straight. Bring a reference picture if you have one.",
    staff: ["aarav", "kabir", "meera", "dev"],
    tags: ["styling", "blow-dry"],
  },
  {
    slug: "occasion-updo",
    category: "haircuts-styling",
    name: "Occasion Updo",
    duration: 75,
    price: 2200,
    audience: "WOMEN",
    featured: true,
    short: "Chignons, braids and sculpted waves built to last through photographs and dancing.",
    description:
      "Updos and occasion styling prepared with pins, texture products and a final set that holds from the first photograph to the last dance. Book a trial with your outfit for important events.",
    staff: ["aarav", "zoya", "meera"],
    tags: ["occasion", "updo"],
  },
  {
    slug: "fringe-trim-refresh",
    category: "haircuts-styling",
    name: "Fringe & Trim Refresh",
    duration: 20,
    price: 400,
    audience: "EVERYONE",
    short: "A quick tidy between full cuts: fringe, neckline or ends.",
    description: "A dry or damp tidy-up of your fringe, neckline or ends — the quickest way to keep a good cut looking intentional between visits.",
    staff: ["aarav", "kabir", "rohan"],
    tags: ["trim", "express"],
  },
  // ── Colour & Hair Treatments ───────────────────────────────────────────────
  {
    slug: "global-colour",
    category: "colour-treatments",
    name: "Global Colour",
    duration: 120,
    price: 3200,
    audience: "EVERYONE",
    resource: "COLOUR_BAR",
    short: "One rich, even shade from roots to ends, with a gloss to finish.",
    description:
      "A single-process colour with a patch test, careful sectioning and a finishing gloss for shine. Price shown is for shoulder-length hair; your colourist confirms the exact quote at consultation.",
    staff: ["meera", "dev"],
    tags: ["colour"],
  },
  {
    slug: "balayage-signature",
    category: "colour-treatments",
    name: "Hand-painted Balayage",
    duration: 180,
    price: 6500,
    audience: "EVERYONE",
    resource: "COLOUR_BAR",
    featured: true,
    signature: true,
    signatureStory: "Soft, lived-in dimension painted by hand so it grows out gracefully — no harsh regrowth line, no rush.",
    short: "Soft, lived-in dimension painted by hand so it grows out gracefully.",
    description:
      "Hand-painted lightening and toning designed around your base colour and maintenance appetite. Includes a consultation, gloss, treatment and blow-dry. Price shown is a sample starting price.",
    staff: ["meera", "dev"],
    tags: ["colour", "balayage"],
  },
  {
    slug: "root-touch-up",
    category: "colour-treatments",
    name: "Root Touch-Up",
    duration: 75,
    price: 1800,
    audience: "EVERYONE",
    resource: "COLOUR_BAR",
    short: "Fresh roots, matched to your existing colour.",
    description: "Regrowth coverage matched to your existing colour, finished with a quick blow-dry.",
    staff: ["meera", "dev"],
    tags: ["colour"],
  },
  {
    slug: "smoothing-treatment",
    category: "colour-treatments",
    name: "Smoothing Treatment",
    duration: 150,
    price: 5500,
    audience: "EVERYONE",
    signature: true,
    signatureStory: "Frizz softened and shine restored, with a plan for aftercare so it lasts well beyond the first wash.",
    short: "Frizz softened and shine restored, with an aftercare plan that lasts.",
    description:
      "A smoothing treatment to relax frizz and add shine. Your stylist assesses hair condition first and explains the aftercare routine before starting. Price shown is a sample starting price.",
    staff: ["dev", "meera"],
    tags: ["treatment", "smoothing"],
  },
  {
    slug: "deep-conditioning-ritual",
    category: "colour-treatments",
    name: "Deep Conditioning & Scalp Ritual",
    duration: 45,
    price: 1100,
    audience: "EVERYONE",
    short: "A restorative mask and slow scalp massage for tired, dry or colour-treated hair.",
    description: "A targeted mask, steam and a long scalp massage. Ideal after colour or heat-styling, or any time your hair feels dry.",
    staff: ["dev", "meera", "aarav"],
    tags: ["treatment", "scalp"],
  },
  // ── Skin & Facials ─────────────────────────────────────────────────────────
  {
    slug: "radiance-facial",
    category: "skin-facials",
    name: "Radiance Facial",
    duration: 60,
    price: 2400,
    audience: "EVERYONE",
    resource: "FACIAL_ROOM",
    featured: true,
    short: "Cleanse, exfoliate, massage and mask — a brightening reset for tired skin.",
    description:
      "A skin consultation, double cleanse, gentle exfoliation, extractions where suitable, massage and a mask chosen for your skin that day. Let us know about allergies or sensitivities when booking.",
    staff: ["ananya", "zoya"],
    tags: ["facial", "glow"],
  },
  {
    slug: "deep-cleanse-facial",
    category: "skin-facials",
    name: "Deep Cleanse Facial",
    duration: 75,
    price: 2900,
    audience: "EVERYONE",
    resource: "FACIAL_ROOM",
    short: "A thorough, congestion-focused facial with steam, extractions and a calming finish.",
    description: "A deeper clean for congested or oily skin, with steam, careful extractions, a clarifying mask and a calming finish.",
    staff: ["ananya"],
    tags: ["facial", "clarifying"],
  },
  {
    slug: "express-glow",
    category: "skin-facials",
    name: "Express Glow",
    duration: 30,
    price: 1300,
    audience: "EVERYONE",
    resource: "FACIAL_ROOM",
    short: "A half-hour pick-me-up before an event or between appointments.",
    description: "Cleanse, exfoliate, a quick massage and a hydrating mask — a fast way to freshen up before an event.",
    staff: ["ananya", "zoya"],
    tags: ["facial", "express"],
  },
  {
    slug: "threading-brow-shaping",
    category: "skin-facials",
    name: "Threading & Brow Shaping",
    duration: 20,
    price: 250,
    audience: "EVERYONE",
    short: "Clean, balanced brows shaped to your natural line.",
    description: "Precise threading and brow shaping, with a soothing finish. Add it before a facial or occasion makeup.",
    staff: ["ananya", "zoya", "ishita"],
    tags: ["brows"],
  },
  // ── Bridal & Occasion ──────────────────────────────────────────────────────
  {
    slug: "bridal-makeup-trial",
    category: "bridal-occasion",
    name: "Bridal Makeup Trial",
    duration: 90,
    price: 3500,
    audience: "WOMEN",
    resource: "BRIDAL_SUITE",
    requiresApproval: true,
    short: "A full dress rehearsal for your look — request and we confirm within a day.",
    description:
      "Trial your makeup and hair direction ahead of the big day with a dedicated artist. Bridal bookings are requests: our team confirms availability and discusses timings, travel and outfit details with you.",
    staff: ["zoya"],
    tags: ["bridal", "trial"],
  },
  {
    slug: "bridal-makeup-hair",
    category: "bridal-occasion",
    name: "Bridal Makeup & Hair",
    duration: 180,
    price: 18000,
    audience: "WOMEN",
    resource: "BRIDAL_SUITE",
    requiresApproval: true,
    signature: true,
    signatureStory: "A calm, unhurried morning with one dedicated artist — trial, timeline and touch-ups planned well ahead of the day.",
    short: "A calm, unhurried morning with a dedicated artist, planned well in advance.",
    description:
      "Complete bridal makeup and hair with a prepared timeline for the morning. This is a sample price; final quotes depend on the number of looks, family members and travel. Booking is a request that our team confirms.",
    staff: ["zoya"],
    tags: ["bridal", "makeup", "hair"],
  },
  {
    slug: "party-makeup",
    category: "bridal-occasion",
    name: "Party Makeup",
    duration: 60,
    price: 2800,
    audience: "WOMEN",
    short: "Polished, camera-ready makeup for an evening out or a family celebration.",
    description: "A tailored makeup application for parties, engagements and celebrations. Lashes can be added on request.",
    staff: ["zoya"],
    tags: ["makeup", "occasion"],
  },
  {
    slug: "saree-draping-hair-set",
    category: "bridal-occasion",
    name: "Saree Draping & Hair Set",
    duration: 60,
    price: 1800,
    audience: "WOMEN",
    short: "Neat pleats and a hair set that stays put from ceremony to dinner.",
    description: "Saree draping and a quick hair set for festive occasions. Bring your saree, blouse, petticoat and pins.",
    staff: ["zoya"],
    tags: ["saree", "occasion"],
  },
  // ── Nails & Hands ──────────────────────────────────────────────────────────
  {
    slug: "classic-manicure",
    category: "nails-hands",
    name: "Classic Manicure",
    duration: 45,
    price: 800,
    audience: "EVERYONE",
    resource: "NAIL_BAR",
    short: "Shape, cuticle care, a hand massage and polish.",
    description: "Nail shaping, cuticle care, a short hand massage and polish in the shade of your choice.",
    staff: ["ishita"],
    tags: ["nails"],
  },
  {
    slug: "gel-manicure",
    category: "nails-hands",
    name: "Gel Manicure",
    duration: 60,
    price: 1500,
    audience: "EVERYONE",
    resource: "NAIL_BAR",
    featured: true,
    short: "Long-wearing gel colour with careful prep and clean edges.",
    description: "Gel colour with careful nail prep, cured in layers for long wear. Existing gel removal is included.",
    staff: ["ishita"],
    tags: ["nails", "gel"],
  },
  {
    slug: "spa-pedicure",
    category: "nails-hands",
    name: "Spa Pedicure",
    duration: 60,
    price: 1400,
    audience: "EVERYONE",
    resource: "NAIL_BAR",
    short: "A warm soak, scrub, massage and polish for tired feet.",
    description: "A warm soak, exfoliation, callus care, a calf and foot massage and polish.",
    staff: ["ishita"],
    tags: ["pedicure"],
  },
  // ── Grooming ───────────────────────────────────────────────────────────────
  {
    slug: "gentleman-haircut",
    category: "grooming",
    name: "Gentleman's Haircut",
    duration: 40,
    price: 600,
    audience: "MEN",
    short: "Scissor- or clipper-cut with a tidy neckline and styling finish.",
    description: "A consultation, wash, precision cut and a styling finish with the right product for your hair.",
    staff: ["rohan", "aarav", "kabir"],
    tags: ["men", "cut"],
  },
  {
    slug: "beard-sculpt-hot-towel",
    category: "grooming",
    name: "Beard Sculpt & Hot Towel",
    duration: 30,
    price: 450,
    audience: "MEN",
    short: "Shaped lines, a hot-towel treatment and conditioning beard oil.",
    description: "Beard shaping with clean lines, a hot-towel treatment and finishing oil.",
    staff: ["rohan"],
    tags: ["men", "beard"],
  },
  {
    slug: "cut-and-beard-ritual",
    category: "grooming",
    name: "Cut & Beard Ritual",
    duration: 60,
    price: 950,
    audience: "MEN",
    featured: true,
    short: "The full routine: haircut, beard sculpt and hot-towel finish.",
    description: "Haircut and beard sculpt back-to-back with a hot-towel finish — our most popular grooming appointment.",
    staff: ["rohan"],
    tags: ["men", "combo"],
  },
  // ── Kids & Family ──────────────────────────────────────────────────────────
  {
    slug: "little-stars-cut",
    category: "kids-family",
    name: "Little Stars Haircut (under 12)",
    duration: 30,
    price: 450,
    audience: "KIDS",
    featured: true,
    short: "Patient, playful haircuts for little ones, with a sticker for bravery.",
    description: "A relaxed haircut for children under 12. Tell us about sensitivities or first-haircut nerves when booking and we will go at their pace.",
    staff: ["kabir", "rohan", "aarav"],
    tags: ["kids"],
  },
  {
    slug: "parent-child-cut",
    category: "kids-family",
    name: "Parent & Child Cuts",
    duration: 75,
    price: 1300,
    audience: "EVERYONE",
    short: "Two haircuts back-to-back with one stylist — one trip, one booking.",
    description:
      "A parent and child (under 12) haircut back-to-back with the same stylist. Need two stylists at once? Call the salon and we will arrange it.",
    staff: ["aarav", "kabir", "rohan"],
    tags: ["kids", "family"],
  },
];

/** Transparent "pairs well with" rules: from → to, with the reason shown to customers. */
export const PAIRINGS: { from: string; to: string; reason: string }[] = [
  { from: "balayage-signature", to: "deep-conditioning-ritual", reason: "Lightening is thirsty — a conditioning ritual keeps colour glossy." },
  { from: "global-colour", to: "blow-dry-styling", reason: "Finish fresh colour with a polished blow-dry." },
  { from: "signature-cut-finish", to: "deep-conditioning-ritual", reason: "A new cut feels best on well-conditioned hair." },
  { from: "smoothing-treatment", to: "deep-conditioning-ritual", reason: "Keep the smoothing result supple with a follow-up ritual." },
  { from: "radiance-facial", to: "threading-brow-shaping", reason: "Shape brows first, then enjoy the glow." },
  { from: "express-glow", to: "threading-brow-shaping", reason: "Quick and tidy before an event." },
  { from: "bridal-makeup-trial", to: "bridal-makeup-hair", reason: "Trial first, then lock in the main day." },
  { from: "occasion-updo", to: "party-makeup", reason: "Hair and makeup for the same event, one visit." },
  { from: "gentleman-haircut", to: "beard-sculpt-hot-towel", reason: "Pair the cut with a beard sculpt for a complete finish." },
  { from: "classic-manicure", to: "spa-pedicure", reason: "Hands and feet in one calm visit." },
  { from: "gel-manicure", to: "spa-pedicure", reason: "Matching colour for hands and feet." },
  { from: "little-stars-cut", to: "parent-child-cut", reason: "Bring a parent along and book both in one go." },
];
