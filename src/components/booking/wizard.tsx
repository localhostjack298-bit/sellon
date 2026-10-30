"use client";
import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { ArrowRight } from "lucide-react";
import { StarMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Panel, PanelHeader, PanelBody } from "@/components/ui/card";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDuration, cn } from "@/lib/utils";
import { formatPaise, formatINR } from "@/lib/money";
import { computeDiscountPaise } from "@/features/offers/pricing";
import { fmt, todayISOString, addDaysISO } from "@/lib/dates";
import { getSlotsForDate } from "@/features/booking/server";
import { createBooking } from "@/features/booking/service";
import { toast } from "sonner";

interface WizardProps {
  categories: {
    id: string;
    slug: string;
    name: string;
    tagline: string | null;
    description: string | null;
    image: { url: string; alt: string } | null;
    services: {
      id: string;
      slug: string;
      name: string;
      shortDescription: string;
      description: string;
      durationMinutes: number;
      price: number;
      audience: string;
      requiresApproval: boolean;
      requiredResource: string | null;
      category: { id: string; slug: string; name: string } | null;
      isFeatured: boolean;
      isSignature: boolean;
      signatureStory: string | null;
      tags: string[];
      staffIds: string[];
    }[];
  }[];
  stylists: {
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
    portrait: { url: string } | null;
    serviceIds: string[];
    employmentType: string;
  }[];
  branch: {
    name: string;
    phone: string;
    email: string;
    addressLine1: string;
    city: string;
    state: string;
    postalCode: string;
    hours: { weekday: number; opensAt: string; closesAt: string; isClosed: boolean }[];
  } | null;
  viewer: { name: string; email: string } | null;
  offers: {
    id: string;
    slug: string;
    title: string;
    subtitle: string | null;
    description: string;
    code: string | null;
    type: string;
    value: number;
    maxDiscount: number | null;
    minSpend: number | null;
    badge: string | null;
    categoryId: string | null;
    categoryName: string | null;
    serviceIds: string[];
    startsAt: string;
    endsAt: string;
    isFeatured: boolean;
    image: { url: string; alt: string } | null;
  }[];
}

type SlotSummary = {
  time: string;
  startsAt: string;
  endsAt: string;
  blockedUntil: string;
  staffIds: string[];
};

const STEPS = 6;

export function BookingWizard({ categories, stylists, branch, viewer, offers }: WizardProps) {
  const [step, setStep] = useState(1);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [date, setDate] = useState(todayISOString());
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<SlotSummary[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [details, setDetails] = useState({
    fullName: viewer?.name ?? "",
    email: viewer?.email ?? "",
    phone: "",
    note: "",
    couponCode: "",
  });
  const [appliedOffer, setAppliedOffer] = useState<WizardProps["offers"][number] | null>(null);
  const [saving, setSaving] = useState(false);
  const [bookingResult, setBookingResult] = useState<{ reference: string; total: number } | null>(null);

  const stylistById = new Map(stylists.map((s) => [s.id, s]));
  const selectedServices = categories.flatMap((c) => c.services.filter((s) => selectedServiceIds.includes(s.id)));
  const durationMinutes = selectedServices.reduce((a, s) => a + s.durationMinutes, 0);
  const subtotal = selectedServices.reduce((a, s) => a + s.price * 100, 0);

  let discount = 0;
  let offerText = "";
  if (appliedOffer) {
    const eligible = selectedServices.filter(
      (s) => (appliedOffer.categoryId ? s.category?.id === appliedOffer.categoryId : appliedOffer.serviceIds.length ? appliedOffer.serviceIds.includes(s.id) : true),
    ).reduce((a, s) => a + s.price * 100, 0);
    discount = computeDiscountPaise(
      { type: appliedOffer.type as "PERCENTAGE" | "FIXED_AMOUNT", value: appliedOffer.value, maxDiscount: appliedOffer.maxDiscount ?? null, minSpend: appliedOffer.minSpend ?? null },
      eligible,
    );
    offerText = appliedOffer.code ? `CODE: ${appliedOffer.code}` : "Auto-applied";
  }
  const total = subtotal - discount;

  const canProceed = (s: number) => {
    if (s === 2) return selectedServiceIds.length > 0;
    if (s === 3) return staffId !== undefined;
    if (s === 4) return slots.length > 0 && time !== "";
    if (s === 5) return details.fullName.length >= 2 && details.email.includes("@") && details.phone.length >= 6;
    return true;
  };

  const goTo = (s: number) => {
    if (canProceed(s)) setStep(s);
  };

  const loadSlots = useCallback(async () => {
    if (!date) return;
    setSlotsLoading(true);
    try {
      const result = await getSlotsForDate({ date, serviceIds: selectedServiceIds, staffId: staffId ?? undefined });
      setSlots(result.slots ?? []);
      if (result.error) toast.error(result.error);
      if (time && !result.slots?.some((s) => s.time === time)) setTime("");
    } finally {
      setSlotsLoading(false);
    }
  }, [date, selectedServiceIds, staffId]);

  useEffect(() => {
    if (date) loadSlots();
  }, [date, loadSlots]);

  const toggleService = (id: string) => {
    setSelectedServiceIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setStaffId(null);
    setTime("");
  };

  const eligibleStylists = selectedServiceIds.length
    ? stylists.filter((s) => selectedServiceIds.every((sid) => s.serviceIds.includes(sid)))
    : stylists;

  const stepHeader = (n: number, title: string, subtitle: string) => (
    <Panel className="border-0 bg-transparent shadow-none">
      <PanelHeader
        title={<div className="flex items-center gap-2"><div className="grid size-8 place-items-center rounded-full bg-brand text-brand-fg text-[0.8rem] font-bold">{n}</div>{title}</div>}
        description={subtitle}
        className="border-0 pb-0"
      />
    </Panel>
  );

  const stepButton = (label: string, onNext: () => void, disabled: boolean) => (
    <Button onClick={onNext} disabled={disabled} variant="primary" size="lg" className="w-full">
      {label} <ArrowRight className="size-4 ml-1" />
    </Button>
  );

  if (bookingResult) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-canvas px-6">
        <Panel className="w-full max-w-md">
          <PanelHeader title="Booking confirmed" description="Your appointment is saved. You will receive a confirmation shortly." className="pb-0" />
          <PanelBody className="space-y-5 py-10 text-center">
            <div className="grid size-24 place-items-center rounded-full bg-success-soft text-success mx-auto mb-3">
              <StarMark className="size-10" />
            </div>
            <h2 className="text-xl font-bold text-fg">Thank you</h2>
            <p className="text-lg tabular font-bold text-fg">{bookingResult.reference}</p>
            <p className="text-muted">Your reference number — save it or mention it at the salon.</p>
            <dl className="grid grid-cols-2 gap-4 text-left text-[0.84rem]">
              <div className="border border-line rounded-lg p-4">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">Total</p>
                <p className="tabular font-bold text-fg">{formatINR(total)}</p>
              </div>
              <div className="border border-line rounded-lg p-4">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">Payment</p>
                <p className="font-medium text-fg-2">Pay at the salon</p>
              </div>
            </dl>
            <div className="flex flex-col gap-3 pt-4">
              <Button onClick={() => window.location.assign(`/account/bookings/${bookingResult.reference}`)} variant="primary" size="lg" className="w-full">
                View my booking
              </Button>
              <Button onClick={() => window.location.assign("/services")} variant="ghost" size="lg" className="w-full">
                Book another service
              </Button>
            </div>
          </PanelBody>
        </Panel>
      </div>
    );
  }
  void StarMark;

  return (
    <main id="main" className="min-h-[calc(100dvh-4.5rem)] py-8 lg:py-12">
      <div className="shell-narrow">
        {step === 1 && (
          <>
            {stepHeader(1, "Choose services", "Select one or more services. Durations and prices are added together.")}
            <div className="space-y-6 mt-6">
              {categories.map((cat) => (
                <Panel key={cat.slug} className="overflow-hidden">
                  <PanelHeader
                    title={cat.name}
                    description={cat.tagline}
                    actions={
                      selectedServices.filter((s) => s.category?.id === cat.id).length > 0 ? (
                        <Badge tone="brand">
                          {selectedServices.filter((s) => s.category?.id === cat.id).length} selected
                        </Badge>
                      ) : null
                    }
                    className="pb-0"
                  />
                  <PanelBody className="p-4 space-y-3">
                    {cat.services.map((s) => {
                      const active = selectedServiceIds.includes(s.id);
                      const staffCount = s.staffIds.length;
                      return (
                        <button
                          key={s.slug}
                          type="button"
                          onClick={() => toggleService(s.id)}
                          className={cn(
                            "flex items-center justify-between gap-3 rounded-lg border px-4 py-3.5 text-left transition-colors",
                            active ? "border-brand bg-brand/10 text-fg" : "border-line bg-surface text-fg-2 hover:border-fg/60 hover:bg-surface-2",
                          )}
                        >
                          <div className="flex-1">
                            <p className="font-semibold text-fg">{s.name}</p>
                            <p className="text-xs text-muted">
                              {formatDuration(s.durationMinutes)} · {formatINR(s.price)}
                            </p>
                            {s.requiresApproval ? <Badge key="ap" tone="warning">By request</Badge> : null}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge tone={active ? "success" : "neutral"}>
                              {active ? "Selected" : staffCount > 0 ? "Bookable" : "Request"}
                            </Badge>
                            {active ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleService(s.id);
                                }}
                                className="text-muted hover:text-danger"
                                aria-label="Remove"
                              >
                                <span className="sr-only">Remove {s.name}</span>
                                ✕
                              </button>
                            ) : (
                              <span className="text-[0.68rem] font-bold text-brand-text">+</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </PanelBody>
                </Panel>
              ))}
              {selectedServiceIds.length > 0 ? (
                <div className="border border-line rounded-lg bg-surface-2 p-5">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted">Total duration</span>
                    <span className="font-semibold tabular text-fg">{formatDuration(durationMinutes)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-bold tabular text-fg">
                    <span>Subtotal</span>
                    <span>{formatINR(subtotal / 100)}</span>
                  </div>
                  {appliedOffer ? (
                    <>
                      <div className="flex items-center justify-between text-xs text-success mt-2">
                        <span>{appliedOffer.title} ({offerText})</span>
                        <span className="font-semibold">−{formatINR(discount / 100)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAppliedOffer(null);
                          setDetails((d) => ({ ...d, couponCode: "" }));
                        }}
                        className="text-xs font-bold text-brand-text underline underline-offset-4 mt-1"
                      >
                        Remove offer
                      </button>
                    </>
                  ) : null}
                  <div className="flex items-center justify-between text-sm font-bold tabular text-fg mt-2 border-t border-line pt-2">
                    <span>Estimated total</span>
                    <span>{formatINR(total / 100)}</span>
                  </div>
                  <p className="text-[0.7rem] text-muted mt-4">Sample prices (INR). Payment is taken at the salon after your service.</p>
                </div>
              ) : null}
            </div>
            <div className="mt-8 flex items-center justify-end gap-3">
              <Button variant="outline" onClick={() => window.location.assign("/services")} size="lg">
                Browse all services
              </Button>
              {stepButton("Continue", () => goTo(2), selectedServiceIds.length === 0)}
            </div>
          </>
        )}
        {step === 2 && (
          <>
            {stepHeader(2, "Choose your stylist", "Pick who you would like to see, or leave it to us.")}
            <div className="mt-6">
              <label className="flex items-center gap-2 cursor-pointer select-none text-sm font-semibold text-fg-2">
                <input type="radio" checked={staffId === null} onChange={() => setStaffId(null)} className="accent-brand" />
                <span>Any available professional</span>
                <span className="ml-auto text-sm text-muted">
                  {eligibleStylists.length} stylist{eligibleStylists.length !== 1 ? "s" : ""} available for these services
                </span>
              </label>
            </div>
            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {eligibleStylists.length === 0 ? (
                <EmptyState
                  title="No stylist is qualified for this combination"
                  description="Try removing a service or choosing a different date."
                  action={<Button variant="outline" onClick={() => setSelectedServiceIds([])}>Start over</Button>}
                  compact
                />
              ) : (
                eligibleStylists.map((s) => {
                  const active = staffId === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setStaffId(s.id)}
                      className={cn(
                        "flex flex-col gap-3 rounded-lg border px-4 py-4 text-left transition-colors",
                        active ? "border-brand bg-brand/10" : "border-line bg-surface hover:border-fg/60 hover:bg-surface-2",
                      )}
                    >
                      <div className="relative size-16 shrink-0">
                        {s.portrait ? (
                          <img src={s.portrait.url} alt="" className="size-16 rounded-full object-cover" />
                        ) : (
                          <div className="size-16 rounded-full bg-sand flex items-center justify-center text-ink">
                            {s.name
                              .split(" ")
                              .map((p) => p[0])
                              .join("")
                              .toUpperCase()}
                          </div>
                        )}
                        {s.isFeatured && (
                          <span className="absolute -right-1 -top-1 size-3 rounded-full bg-brand text-brand-fg text-[0.6rem] font-bold">
                            ★
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-fg">{s.name}</p>
                        <p className="text-xs text-muted">{s.jobTitle}</p>
                        {s.bio && <p className="mt-1 text-[0.75rem] leading-relaxed text-muted">{s.bio}</p>}
                        <p className="mt-2 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-muted">
                          {s.specialties.slice(0, 3).join(" · ")}
                        </p>
                      </div>
                      <div className="ml-auto">
                        <Badge tone={active ? "brand" : "neutral"}>
                          {active ? "Selected" : "Choose"}
                        </Badge>
                      </div>
                    </button>
                  );}
                )
              )}
            </div>
            <div className="mt-10 flex items-center justify-end gap-3">
              <Button variant="outline" onClick={() => setStep(1)} size="lg">
                Back
              </Button>
              {stepButton("Continue", () => goTo(3), false)}
            </div>
          </>
        )}
        {step === 3 && (
          <>
            {stepHeader(3, "Choose date and time", "Slots are computed from real stylist schedules — never invented.")}
            <div className="mt-6 space-y-5">
              <Field label="Date" hint="We are open Tuesday to Sunday.">
                <Input
                  type="date"
                  min={todayISOString()}
                  max={addDaysISO(todayISOString(), 45)}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  invalid={slots.length === 0 && date !== ""}
                />
              </Field>
              <div>
                <p className="text-[0.8rem] font-semibold text-fg mb-2">Available times</p>
                {slotsLoading ? (
                  <div className="h-64 flex items-center justify-center">
                    <SkeletonText lines={3} />
                  </div>
                ) : slots.length === 0 ? (
                  <EmptyState
                    title="No slots available"
                    description="Try a different date, time, or stylist."
                    compact
                    action={<Button variant="outline" onClick={() => setDate(todayISOString())}>Today</Button>}
                  />
                ) : (
                  <div className="grid gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                    {slots.map((slot) => {
                      const active = time === slot.time;
                      return (
                        <button
                          key={slot.startsAt + slot.staffIds.join(",")}
                          type="button"
                          onClick={() => setTime(slot.time)}
                          className={cn(
                            "flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-left transition-colors",
                            active ? "border-brand bg-brand text-brand-fg" : "border-line bg-surface text-fg-2 hover:border-fg/60 hover:bg-surface-2",
                          )}
                        >
                          <span className="font-semibold tabular">{slot.time}</span>
                          <span className="text-[0.68rem] text-muted line-clamp-1">
                            {slot.staffIds.length} stylist{slot.staffIds.length !== 1 ? "s" : ""} free
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
                {time && (
                  <p className="mt-3 text-xs text-muted">
                    Selected {fmt.hhmm(time)} on {fmt.day(date)} — slot held while you complete your details.
                  </p>
                )}
              </div>
            </div>
            <div className="mt-10 flex items-center justify-end gap-3">
              <Button variant="outline" onClick={() => setStep(2)} size="lg">
                Back
              </Button>
              {stepButton("Continue", () => goTo(4), !time)}
            </div>
          </>
        )}
        {step === 4 && (
          <>
            {stepHeader(4, "Your details", "Tell us who is coming — and anything we should know in advance.")}
            <div className="mt-6 space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" required>
                  <Input
                    value={details.fullName}
                    onChange={(e) => setDetails((d) => ({ ...d, fullName: e.target.value }))}
                    invalid={details.fullName.length < 2}
                  />
                </Field>
                <Field label="Email address">
                  <Input
                    type="email"
                    value={details.email}
                    onChange={(e) => setDetails((d) => ({ ...d, email: e.target.value }))}
                    invalid={details.email.length > 0 && !details.email.includes("@")}
                  />
                </Field>
              </div>
              <Field label="Phone number">
                <Input
                  type="tel"
                  value={details.phone}
                  onChange={(e) => setDetails((d) => ({ ...d, phone: e.target.value }))}
                  invalid={details.phone.length < 6}
                />
              </Field>
              <Field label="Booking note (optional)" hint="Anything we should prepare — allergies, a reference photo, timing constraints.">
                <Textarea value={details.note} onChange={(e) => setDetails((d) => ({ ...d, note: e.target.value }))} />
              </Field>
              <div className="border rounded-lg bg-brand/5 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-text">Have a sample offer code?</p>
                <div className="mt-3 flex gap-2">
                  <Input placeholder="Code" value={details.couponCode} onChange={(e) => setDetails((d) => ({ ...d, couponCode: e.target.value }))} className="flex-1" />
                  <Button
                    type="button"
                   
                    onClick={() => {
                      const offer = offers.find((o) => o.code === details.couponCode.toUpperCase());
                      if (offer) {
                        setAppliedOffer(offer);
                        toast.success(`Applied: ${offer.title}`);
                      } else if (details.couponCode.trim()) {
                        toast.error("That code isn't valid for this selection.");
                      }
                    }}
                  >
                    Apply
                  </Button>
                </div>
                {appliedOffer ? (
                  <p className="mt-2 text-xs text-success">{appliedOffer.title} — {offerText}</p>
                ) : null}
                {offers.filter((o) => !appliedOffer).length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {offers.filter((o) => !appliedOffer).slice(0, 4).map((o) => (
                      <button
                        key={o.slug}
                        type="button"
                        onClick={() => {
                          setAppliedOffer(o);
                          setDetails((d) => ({ ...d, couponCode: o.code ?? "" }));
                        }}
                        className="text-xs border border-line rounded-full px-3 py-1.5 text-fg-2 hover:border-brand hover:text-brand-text"
                      >
                        {o.code ? o.code : o.title} — {formatPaise(Math.round(o.value * 100))}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="mt-10 flex items-center justify-end gap-3">
              <Button variant="outline" onClick={() => setStep(3)} size="lg">
                Back
              </Button>
              {stepButton("Review booking", () => goTo(5), !canProceed(5))}
            </div>
          </>
        )}
        {step === 5 && (
          <>
            {stepHeader(5, "Review your booking", "Please check everything before we confirm.")}
            <div className="mt-6 space-y-6">
              <div className="border border-line rounded-lg p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-fg">Selected services</h3>
                  <span className="text-xs font-bold text-muted tabular">{formatDuration(durationMinutes)}</span>
                </div>
                <div className="space-y-3">
                  {selectedServices.map((s) => (
                    <div key={s.id} className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-medium text-fg">{s.name}</p>
                        <p className="text-xs text-muted">
                          {staffId ? stylistById.get(staffId)!.name : "Any available professional"} · {formatDuration(s.durationMinutes)}
                        </p>
                      </div>
                      <span className="tabular font-semibold text-fg-2">{formatINR(s.price)}</span>
                    </div>
                  ))}
                </div>
                <hr className="my-4 border-line" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Subtotal</span>
                  <span className="font-semibold tabular text-fg">{formatINR(subtotal / 100)}</span>
                </div>
                {appliedOffer && (
                  <div className="flex items-center justify-between text-xs text-success">
                    <span>{appliedOffer.title}</span>
                    <span className="font-semibold">−{formatINR(discount / 100)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-line font-bold tabular text-fg">
                  <span>Estimated total</span>
                  <span>{formatINR(total / 100)}</span>
                </div>
              </div>
              <div className="border border-line rounded-lg p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-fg">Appointment</h3>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Stylist</span>
                    <span className="font-medium text-fg">{staffId ? stylistById.get(staffId)!.name : "Any available professional"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Date</span>
                    <span className="font-medium tabular text-fg">{fmt.day(date)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Time</span>
                    <span className="font-medium tabular text-fg">{fmt.hhmm(time)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Details</span>
                    <span className="font-medium text-fg">{details.fullName} · {details.email}</span>
                  </div>
                  {details.note && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted">Note</span>
                      <span className="font-medium text-fg-2 max-w-xs break-words">{details.note}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="border rounded-lg bg-brand/10 p-4">
                <p className="text-sm text-brand-text">
                  Payment is taken at the salon after your service (cash, UPI or card). Online payment is not enabled in this demo. Sample prices and offers are
                  for demonstration only.
                </p>
              </div>
            </div>
            <div className="mt-10 flex items-center justify-end gap-3">
              <Button variant="outline" onClick={() => setStep(4)} size="lg">
                Back
              </Button>
              {stepButton("Confirm booking", async () => {
                setSaving(true);
                try {
                  const result = await createBooking({
                    serviceIds: selectedServiceIds,
                    staffId: staffId ?? undefined,
                    date,
                    time,
                    couponCode: details.couponCode || undefined,
                    details: {
                      fullName: details.fullName,
                      email: details.email || undefined,
                      phone: details.phone || undefined,
                      note: details.note || undefined,
                    },
                  });
                  if (result.ok) {
                    const data = result.data as { reference: string; total: number };
                    setBookingResult({ reference: data.reference, total: data.total });
                  } else {
                    toast.error(result.error || "Booking could not be completed.");
                  }
                } finally {
                  setSaving(false);
                }
              }, !canProceed(6))}
            </div>
          </>)}
        </div>
    </main>
  );
}
