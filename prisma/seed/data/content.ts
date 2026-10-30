/**
 * CMS-lite content blocks (`website_content` rows). All copy is SAMPLE copy written for the demo —
 * edit it in Admin → Homepage & content, or replace it with the salon's own words before launch.
 * Image fields hold MediaAsset ids (see `mediaId()` in the seed).
 */
export interface ContentSeed {
  key: string;
  title: string;
  value: Record<string, unknown>;
}

export const CONTENT_BLOCKS: ContentSeed[] = [
  {
    key: "home.hero",
    title: "Homepage hero",
    value: {
      eyebrow: "Stellar Family Salon",
      lines: ["Your Look.", "Your Moment.", "Your Stellar Experience."],
      subheadline:
        "Hair, skin, nails and grooming for the whole family — unhurried consultations, skilled hands and a room that feels like yours.",
      primaryCtaLabel: "Book an appointment",
      secondaryCtaLabel: "Explore services",
      desktopImage: "media_heroDesktop",
      mobileImage: "media_heroMobile",
      highlights: ["Open Tuesday to Sunday", "Pay at the salon", "Family-friendly"],
    },
  },
  {
    key: "home.experience",
    title: "Homepage — the Stellar experience",
    value: {
      eyebrow: "The Stellar way",
      title: "A salon that starts with a conversation.",
      paragraphs: [
        "Every visit begins at the mirror, not the chair. We ask what you love, what you are tired of and what the week ahead looks like — then plan the work together.",
        "You will hear how long each step takes and what it costs before anything begins. No surprises, no pressure to add on.",
      ],
      points: [
        { title: "Consultation first", text: "Time to talk through the look, the upkeep and the budget." },
        { title: "One room, every age", text: "Haircuts for children, colour for parents, grooming for grandparents — often in the same visit." },
        { title: "Honest timing", text: "Slots are built from real stylist schedules, so your appointment starts when we say it will." },
        { title: "Advice, not upselling", text: "We explain products and aftercare so you can decide what is worth taking home." },
      ],
      imageA: "media_experienceInterior",
      imageB: "media_experienceHands",
    },
  },
  {
    key: "home.signature",
    title: "Homepage — signature treatments",
    value: {
      eyebrow: "Signature rituals",
      title: "Three appointments worth planning ahead for.",
      intro: "Longer, more considered services with a dedicated specialist. Pricing shown is sample pricing.",
      items: [
        { serviceSlug: "balayage-signature", image: "media_catColour", numeral: "I" },
        { serviceSlug: "smoothing-treatment", image: "media_heroMobile", numeral: "II" },
        { serviceSlug: "bridal-makeup-hair", image: "media_catBridal", numeral: "III" },
      ],
    },
  },
  {
    key: "home.family",
    title: "Homepage — family band",
    value: {
      eyebrow: "Family-friendly by design",
      title: "Book the whole family into one calm morning.",
      text: "Children's cuts, parent appointments and grooming sessions can be scheduled back-to-back with the same stylist, so one trip covers everyone.",
      ctaLabel: "See Kids & Family services",
      ctaHref: "/services#kids-family",
    },
  },
  {
    key: "about.story",
    title: "About page",
    value: {
      eyebrow: "About Stellar",
      title: "A neighbourhood salon, run like a studio.",
      intro:
        "Stellar Family Salon is a sample brand story. Replace this copy with the salon's real history, owners and milestones — we deliberately avoid invented awards, dates or claims.",
      paragraphs: [
        "We built this experience around three ideas: listen first, plan honestly and treat every age with the same care. The details — timings, pricing, who does what — are visible before you book.",
        "Behind the scenes, schedules, leave and shifts feed directly into the booking calendar, so the slots you see are slots we can actually keep.",
      ],
      values: [
        { title: "Listen first", text: "Consultations are part of every service, not an extra." },
        { title: "Family-sized care", text: "Space and patience for children, parents and grandparents alike." },
        { title: "Craft over trend", text: "Cuts and colour that grow out well and fit your routine." },
      ],
      image: "media_experienceHands",
    },
  },
  {
    key: "site.footer",
    title: "Footer blurb",
    value: {
      blurb: "A boutique family salon for hair, skin, nails and grooming. Pay at the salon — always.",
    },
  },
  {
    key: "contact.page",
    title: "Contact page",
    value: {
      eyebrow: "Visit or call",
      title: "We would love to hear from you.",
      intro: "Questions about a service, a group booking or something special? Send a note and our front desk will reply.",
    },
  },
];
