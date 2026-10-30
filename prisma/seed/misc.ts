/**
 * Offers (5), gallery, notifications, enquiries and seed audit entries. All sample content.
 */
import type { PrismaClient } from "@/generated/prisma/client";
import { addDays, dateOnlyToDate, todayISO, zonedToDate } from "@/lib/dates";
import { mediaId } from "./core";
import type { PeopleResult } from "./people";
import { CUSTOMER_NAMES, customerEmail, customerPhone } from "./data/people";

const day = (offset: number, hhmm = "00:00") => zonedToDate(addDays(todayISO(), offset), hhmm);

export async function seedOffers(prisma: PrismaClient, args: { categoryId: Map<string, string>; serviceId: Map<string, string>; adminUserId: string }) {
  const { categoryId, serviceId, adminUserId } = args;
  const defs = [
    {
      slug: "welcome-first-visit", title: "Welcome to Stellar", subtitle: "15% off your first visit",
      description: "New to Stellar? Enjoy 15% off your first appointment (up to ₹500). Applies to any service, once per guest.",
      terms: "Sample promotion. First-time guests only. Maximum discount ₹500. Cannot be combined with other offers.",
      badge: "New guests", code: "WELCOME15", type: "PERCENTAGE" as const, value: "15", maxDiscount: "500", minSpend: null,
      audience: "NEW_CUSTOMERS" as const, firstVisitOnly: true, category: null, status: "ACTIVE" as const, from: -60, to: 60, featured: true, image: "experienceInterior", perCustomer: 1,
    },
    {
      slug: "family-weekend", title: "Family Weekend", subtitle: "10% off Kids & Family services",
      description: "Bring the little ones: 10% off every Kids & Family service, any day of the week.",
      terms: "Sample promotion. Applies to Kids & Family services only. One use per booking.",
      badge: "Family", code: "FAMILYWEEKEND", type: "PERCENTAGE" as const, value: "10", maxDiscount: null, minSpend: null,
      audience: "EVERYONE" as const, firstVisitOnly: false, category: "kids-family", status: "ACTIVE" as const, from: -30, to: 90, featured: true, image: null, perCustomer: 10,
    },
    {
      slug: "monsoon-glow", title: "Monsoon Glow", subtitle: "₹400 off facials",
      description: "Treat your skin: ₹400 off any facial booked as part of a ₹1,500+ order.",
      terms: "Sample promotion. Skin & Facials category only. Minimum spend ₹1,500.",
      badge: "Limited time", code: "GLOW400", type: "FIXED_AMOUNT" as const, value: "400", maxDiscount: null, minSpend: "1500",
      audience: "EVERYONE" as const, firstVisitOnly: false, category: "skin-facials", status: "ACTIVE" as const, from: -10, to: 25, featured: true, image: "catSkin", perCustomer: 2,
    },
    {
      slug: "festive-colour-refresh", title: "Festive Colour Refresh", subtitle: "12% off colour services over ₹3,000",
      description: "Get party-ready: 12% off colour services when your colour order is ₹3,000 or more.",
      terms: "Sample promotion. Colour & Hair Treatments category. Minimum spend ₹3,000.",
      badge: "Ends soon", code: "FESTIVE12", type: "PERCENTAGE" as const, value: "12", maxDiscount: "1500", minSpend: "3000",
      audience: "EVERYONE" as const, firstVisitOnly: false, category: "colour-treatments", status: "ACTIVE" as const, from: -5, to: 14, featured: false, image: "catColour", perCustomer: 1,
    },
    {
      slug: "winter-hair-spa", title: "Winter Hair Spa Ritual", subtitle: "20% off the Deep Conditioning & Scalp Ritual",
      description: "Draft offer — not yet published. Publish from Admin → Offers & banners to show it on the website and apply it in booking.",
      terms: "Sample promotion (draft).",
      badge: "Coming soon", code: "WINTER20", type: "PERCENTAGE" as const, value: "20", maxDiscount: null, minSpend: null,
      audience: "EVERYONE" as const, firstVisitOnly: false, category: null, status: "DRAFT" as const, from: 10, to: 70, featured: false, image: "experienceHands", perCustomer: 2,
    },
  ];

  for (const d of defs) {
    const data = {
      title: d.title, subtitle: d.subtitle, description: d.description, terms: d.terms, badge: d.badge, code: d.code,
      type: d.type, value: d.value, maxDiscount: d.maxDiscount, minSpend: d.minSpend, audience: d.audience,
      firstVisitOnly: d.firstVisitOnly, categoryId: d.category ? categoryId.get(d.category)! : null,
      startsAt: day(d.from), endsAt: day(d.to, "23:59"), status: d.status, perCustomerLimit: d.perCustomer,
      isFeatured: d.featured, isDemoExample: true, imageId: d.image ? mediaId(d.image) : null,
      createdById: adminUserId, updatedById: adminUserId, publishedAt: d.status === "ACTIVE" ? day(d.from) : null,
    };
    const offer = await prisma.offer.upsert({ where: { slug: d.slug }, create: { slug: d.slug, ...data }, update: data });
    await prisma.offerService.deleteMany({ where: { offerId: offer.id } });
    if (d.slug === "winter-hair-spa") {
      await prisma.offerService.create({ data: { offerId: offer.id, serviceId: serviceId.get("deep-conditioning-ritual")! } });
    }
  }
}

export async function seedGallery(prisma: PrismaClient) {
  await prisma.galleryItem.deleteMany({});
  const note = "Illustrative AI-generated demo imagery — not a Stellar client result.";
  const items: { title: string; caption: string; category: "INTERIOR" | "HAIRSTYLE" | "MAKEUP" | "TREATMENT" | "BEFORE_AFTER"; asset: string; before?: string; featured?: boolean }[] = [
    { title: "The consultation corner", caption: `Warm light and brass mirrors. ${note}`, category: "INTERIOR", asset: "experienceInterior", featured: true },
    { title: "Sculpted copper bob", caption: `A sleek, glossy cut. ${note}`, category: "HAIRSTYLE", asset: "heroDesktop", featured: true },
    { title: "Layered blow-dry", caption: `Volume with movement. ${note}`, category: "HAIRSTYLE", asset: "catHaircuts" },
    { title: "Glossy long waves", caption: `Shine-first finishing. ${note}`, category: "HAIRSTYLE", asset: "heroMobile", featured: true },
    { title: "Hand-painted balayage", caption: `Soft dimension. ${note}`, category: "HAIRSTYLE", asset: "catColour" },
    { title: "Beard sculpt", caption: `Clean lines, hot-towel finish. ${note}`, category: "HAIRSTYLE", asset: "catGrooming" },
    { title: "Bridal finishing touches", caption: `Makeup for the main day. ${note}`, category: "MAKEUP", asset: "catBridal", featured: true },
    { title: "Facial ritual", caption: `A calm, restorative treatment. ${note}`, category: "TREATMENT", asset: "catSkin" },
    { title: "Gel manicure", caption: `Careful prep, glossy finish. ${note}`, category: "TREATMENT", asset: "catNails" },
    { title: "Scalp & conditioning", caption: `Hands-on hair care. ${note}`, category: "TREATMENT", asset: "experienceHands" },
    { title: "Colour refresh", caption: `Illustrative example only — the 'before' image is a digitally dulled copy of the 'after'. ${note}`, category: "BEFORE_AFTER", asset: "catColour", before: "beforeDemo", featured: true },
  ];
  for (const [i, g] of items.entries()) {
    await prisma.galleryItem.create({
      data: {
        title: g.title, caption: g.caption, category: g.category, assetId: mediaId(g.asset),
        beforeAssetId: g.before ? mediaId(g.before) : null, isFeatured: Boolean(g.featured), sortOrder: i,
      },
    });
  }
}

export async function seedEnquiries(prisma: PrismaClient, people: PeopleResult, branchId: string) {
  await prisma.specialOccasionEnquiry.deleteMany({ where: { email: { endsWith: "@stellar-demo.example" } } });
  void branchId;
  const c = (i: number) => ({ id: people.customerId[i]!, name: CUSTOMER_NAMES[i]!, email: customerEmail(CUSTOMER_NAMES[i]!), phone: customerPhone(i + 1) });
  const a = c(2), b = c(4), t = c(21);
  await prisma.specialOccasionEnquiry.createMany({
    data: [
      { customerId: a.id, type: "BRIDAL", name: a.name, email: a.email, phone: a.phone, eventDate: dateOnlyToDate(addDays(todayISO(), 90)), groupSize: 4, interest: "Bridal makeup & hair, trial session", message: "Wedding in the new year — would like a trial and a quote for the bride plus three family members.", status: "NEW", createdAt: new Date(Date.now() - 5 * 3_600_000) },
      { customerId: b.id, type: "FAMILY_GROUP", name: b.name, email: b.email, phone: b.phone, eventDate: dateOnlyToDate(addDays(todayISO(), 20)), groupSize: 6, interest: "Cuts and styling for a family morning", message: "Six of us before a family function — can you take everyone back-to-back?", status: "CONTACTED", handlerNote: "Called back — suggested two stylists in parallel on a Sunday.", createdAt: new Date(Date.now() - 2 * 86_400_000) },
      { customerId: t.id, type: "PARTY", name: t.name, email: t.email, phone: t.phone, eventDate: dateOnlyToDate(addDays(todayISO(), 30)), groupSize: 5, interest: "Party makeup for five", message: "Birthday dinner — five of us for makeup and hair.", status: "QUOTED", handlerNote: "Sample quote shared by email.", createdAt: new Date(Date.now() - 4 * 86_400_000) },
      { customerId: null, type: "OTHER", name: "Rhea Malhotra", email: "rhea.malhotra@stellar-demo.example", phone: "+91 90000 39001", eventDate: null, groupSize: 3, interest: "Grooming for a small photo shoot", message: "Do you do on-location grooming for a small shoot?", status: "NEW", createdAt: new Date(Date.now() - 20 * 3_600_000) },
    ],
  });
}

export async function seedNotifications(prisma: PrismaClient, people: PeopleResult) {
  const users = [...people.userIdByStaff.values(), people.superAdminUserId, ...people.customerUserId];
  await prisma.notification.deleteMany({ where: { userId: { in: users } } });

  const ago = (hours: number) => new Date(Date.now() - hours * 3_600_000);
  const u = (key: Parameters<typeof people.userIdByStaff.get>[0]) => people.userIdByStaff.get(key)!;
  const rows: { userId: string; type: "BOOKING_CONFIRMED" | "BOOKING_CANCELLED" | "BOOKING_RESCHEDULED" | "BOOKING_ASSIGNED" | "BOOKING_UPDATED" | "LEAVE_REQUESTED" | "LEAVE_DECIDED" | "APPROVAL_PENDING" | "SCHEDULE_CHANGED" | "ENQUIRY_RECEIVED" | "OFFER" | "SYSTEM"; title: string; body: string; href?: string; read?: boolean; at: Date }[] = [
    // Super Admin
    { userId: people.superAdminUserId, type: "LEAVE_REQUESTED", title: "4 leave requests need review", body: "Zoya, Aarav, Dev and Priya have pending requests.", href: "/admin/leave", at: ago(3) },
    { userId: people.superAdminUserId, type: "APPROVAL_PENDING", title: "Bridal requests awaiting confirmation", body: "Two bridal bookings are pending — confirm or contact the guests.", href: "/admin/appointments?status=PENDING", at: ago(6) },
    { userId: people.superAdminUserId, type: "ENQUIRY_RECEIVED", title: "New occasion enquiry", body: "A bridal enquiry for 4 guests was received.", href: "/admin/enquiries", at: ago(5) },
    { userId: people.superAdminUserId, type: "SYSTEM", title: "Manager seats: 2 of 2 in use", body: "Raise the limit before activating another manager.", href: "/admin/managers", read: true, at: ago(48) },
    // Managers
    { userId: u("priya"), type: "LEAVE_REQUESTED", title: "Leave requests awaiting your review", body: "Three team members are waiting for a decision.", href: "/staff/leave", at: ago(3) },
    { userId: u("priya"), type: "ENQUIRY_RECEIVED", title: "New occasion enquiry", body: "A bridal enquiry was received.", href: "/staff/enquiries", at: ago(5) },
    { userId: u("priya"), type: "APPROVAL_PENDING", title: "Payroll records need review", body: "Current-month salary records are still pending.", href: "/staff/salary", read: true, at: ago(30) },
    { userId: u("karan"), type: "SCHEDULE_CHANGED", title: "Schedule updated", body: "A Sunday cover shift was added for Aarav.", href: "/staff/shifts", at: ago(10) },
    // Employees
    { userId: u("aarav"), type: "BOOKING_ASSIGNED", title: "You have appointments today", body: "Check the schedule and remember to check in when you arrive.", href: "/staff/appointments", at: ago(8) },
    { userId: u("aarav"), type: "LEAVE_REQUESTED", title: "Leave request submitted", body: "Your casual leave request is waiting for a decision.", href: "/staff/leave", read: true, at: ago(26) },
    { userId: u("meera"), type: "LEAVE_DECIDED", title: "Leave approved", body: "Your annual leave was approved. Bookings for those days are now blocked.", href: "/staff/leave", at: ago(40) },
    // Demo customer
    { userId: people.customerUserId[0]!, type: "BOOKING_CONFIRMED", title: "Your visit is confirmed", body: "We have your Signature Cut & Finish booked — see you soon.", href: "/account/bookings", at: ago(12) },
    { userId: people.customerUserId[0]!, type: "OFFER", title: "Monsoon Glow: ₹400 off facials", body: "Sample offer — use code GLOW400 on a facial booking of ₹1,500 or more.", href: "/offers", at: ago(30) },
    { userId: people.customerUserId[0]!, type: "SYSTEM", title: "Stellar Rewards (demo points)", body: "Points are for demonstration only and cannot be redeemed for real benefits.", href: "/account/loyalty", read: true, at: ago(200) },
  ];
  await prisma.notification.createMany({
    data: rows.map((r) => ({ userId: r.userId, type: r.type, title: r.title, body: r.body, href: r.href ?? null, readAt: r.read ? r.at : null, createdAt: r.at })),
  });
}

export async function seedAuditNotes(prisma: PrismaClient, summary: string) {
  await prisma.auditLog.create({
    data: { actorId: null, actorName: "System (seed)", action: "seed.completed", entityType: "system", summary, metadata: { source: "prisma/seed.ts" } },
  });
}
