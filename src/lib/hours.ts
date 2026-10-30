import { WEEKDAYS, fmt } from "@/lib/dates";

export interface HoursRow { weekday: number; opensAt: string; closesAt: string; isClosed: boolean }

export function hoursTable(rows: HoursRow[]) {
  return WEEKDAYS.map((d) => {
    const r = rows.find((x) => x.weekday === d.id);
    return { id: d.id, label: d.long, short: d.short, closed: !r || r.isClosed, text: !r || r.isClosed ? "Closed" : `${fmt.hhmm(r.opensAt)} – ${fmt.hhmm(r.closesAt)}` };
  });
}

/** "Tuesday to Sunday" style summary of open days. */
export function openDaysSummary(rows: HoursRow[]): string {
  const open = WEEKDAYS.filter((d) => rows.some((r) => r.weekday === d.id && !r.isClosed));
  if (open.length === 0) return "By appointment";
  if (open.length === 7) return "Open every day";
  const closed = WEEKDAYS.filter((d) => !open.includes(d));
  if (closed.length === 1) return `Closed on ${closed[0]!.long}s`;
  return `${open[0]!.long} to ${open[open.length - 1]!.long}`;
}

export function mapsDirectionsUrl(b: { addressLine1: string; addressLine2?: string | null; city: string; state: string; postalCode: string; mapUrl?: string | null }): string {
  if (b.mapUrl) return b.mapUrl;
  const q = [b.addressLine1, b.addressLine2, b.city, b.state, b.postalCode].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}
