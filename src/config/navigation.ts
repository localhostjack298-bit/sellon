/**
 * Centralised navigation registry for the Staff workspace and the Super Admin command center.
 *
 * Sidebars are built from these registries at request time and filtered by the user's *effective
 * permissions* loaded from PostgreSQL — nothing is hard-coded per role. Hiding an item is only a UX
 * nicety: every route, action and query also enforces the permission server-side.
 */
import type { PermissionKey } from "@/config/permissions";

export type IconName =
  | "LayoutDashboard" | "CalendarDays" | "CalendarRange" | "ListChecks" | "Users" | "UserRound" | "UsersRound" | "ClipboardCheck"
  | "Clock" | "CalendarOff" | "Wallet" | "BadgePercent" | "BarChart3" | "Scissors" | "Sparkles" | "ShieldCheck" | "KeyRound"
  | "Image" | "FileText" | "Building2" | "ScrollText" | "Settings" | "Receipt" | "Landmark" | "PartyPopper" | "UserCog"
  | "Bell" | "Layers" | "Briefcase" | "Globe" | "Gauge" | "History" | "LineChart" | "HeartHandshake" | "Contact" | "Palette";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: IconName;
  /** Visible when the user holds ANY of these permissions. Omit for "any authenticated user of this portal". */
  anyOf?: PermissionKey[];
  /** `exact` highlights only on the exact path (default for dashboards). */
  exact?: boolean;
  hint?: string;
  badge?: "pendingLeave" | "pendingBookings" | "newEnquiries" | "unreadNotifications";
}

export interface NavSection {
  id: string;
  label: string;
  icon: IconName;
  items: NavItem[];
}

/* ── Staff workspace ─────────────────────────────────────────────────────────────────── */
export const STAFF_NAV: NavSection[] = [
  {
    id: "overview",
    label: "Overview",
    icon: "LayoutDashboard",
    items: [{ id: "dashboard", label: "Dashboard", href: "/staff", icon: "LayoutDashboard", exact: true }],
  },
  {
    id: "schedule",
    label: "Schedule",
    icon: "CalendarDays",
    items: [
      { id: "appointments", label: "Appointments", href: "/staff/appointments", icon: "ListChecks", anyOf: ["appointments.read"], badge: "pendingBookings" },
      { id: "calendar", label: "Calendar", href: "/staff/calendar", icon: "CalendarRange", anyOf: ["appointments.read"] },
      { id: "enquiries", label: "Occasion enquiries", href: "/staff/enquiries", icon: "PartyPopper", anyOf: ["appointments.read"], badge: "newEnquiries" },
      { id: "customers", label: "Customers", href: "/staff/customers", icon: "Contact", anyOf: ["customers.read"] },
    ],
  },
  {
    id: "team",
    label: "Team",
    icon: "UsersRound",
    items: [
      { id: "employees", label: "Employees", href: "/staff/employees", icon: "Users", anyOf: ["employees.read"] },
      { id: "attendance", label: "Attendance", href: "/staff/attendance", icon: "ClipboardCheck", anyOf: ["attendance.read", "attendance.checkin"] },
      { id: "shifts", label: "Shifts", href: "/staff/shifts", icon: "Clock", anyOf: ["shifts.read"] },
      { id: "leave", label: "Leave", href: "/staff/leave", icon: "CalendarOff", anyOf: ["leave.read", "leave.create"], badge: "pendingLeave" },
      { id: "salary", label: "Salary", href: "/staff/salary", icon: "Wallet", anyOf: ["salary.read"] },
    ],
  },
  {
    id: "business",
    label: "Business",
    icon: "Briefcase",
    items: [
      { id: "offers", label: "Offers", href: "/staff/offers", icon: "BadgePercent", anyOf: ["offers.read"] },
      { id: "reports", label: "Reports", href: "/staff/reports", icon: "BarChart3", anyOf: ["reports.read"] },
    ],
  },
  {
    id: "me",
    label: "Me",
    icon: "UserRound",
    items: [
      { id: "notifications", label: "Notifications", href: "/staff/notifications", icon: "Bell", badge: "unreadNotifications" },
      { id: "profile", label: "My profile", href: "/staff/profile", icon: "UserRound" },
    ],
  },
];

/* ── Super Admin command center (two-level: section rail → section menu) ─────────────── */
export const ADMIN_NAV: NavSection[] = [
  {
    id: "operations",
    label: "Business operations",
    icon: "Gauge",
    items: [
      { id: "overview", label: "Overview", href: "/admin", icon: "LayoutDashboard", exact: true },
      { id: "appointments", label: "Appointments", href: "/admin/appointments", icon: "ListChecks", anyOf: ["appointments.read"], badge: "pendingBookings" },
      { id: "calendar", label: "Calendar", href: "/admin/calendar", icon: "CalendarRange", anyOf: ["appointments.read"] },
      { id: "customers", label: "Customers", href: "/admin/customers", icon: "Contact", anyOf: ["customers.read"] },
      { id: "services", label: "Services & categories", href: "/admin/services", icon: "Scissors", anyOf: ["services.read"] },
      { id: "stylists", label: "Stylists", href: "/admin/stylists", icon: "Sparkles", anyOf: ["employees.read"] },
      { id: "offers", label: "Offers & banners", href: "/admin/offers", icon: "BadgePercent", anyOf: ["offers.read"] },
      { id: "enquiries", label: "Occasion enquiries", href: "/admin/enquiries", icon: "PartyPopper", anyOf: ["appointments.read"], badge: "newEnquiries" },
    ],
  },
  {
    id: "team",
    label: "Team & HR",
    icon: "UsersRound",
    items: [
      { id: "employees", label: "Employees", href: "/admin/employees", icon: "Users", anyOf: ["employees.read"] },
      { id: "managers", label: "Managers & seats", href: "/admin/managers", icon: "UserCog", anyOf: ["users.read"] },
      { id: "roles", label: "Roles & permissions", href: "/admin/roles", icon: "ShieldCheck", anyOf: ["roles.read"] },
      { id: "attendance", label: "Attendance", href: "/admin/attendance", icon: "ClipboardCheck", anyOf: ["attendance.read"] },
      { id: "leave", label: "Leave requests", href: "/admin/leave", icon: "CalendarOff", anyOf: ["leave.read"], badge: "pendingLeave" },
      { id: "shifts", label: "Shifts", href: "/admin/shifts", icon: "Clock", anyOf: ["shifts.read"] },
      { id: "payroll", label: "Salary records", href: "/admin/payroll", icon: "Wallet", anyOf: ["salary.read"] },
      { id: "payroll-history", label: "Payroll history", href: "/admin/payroll/history", icon: "History", anyOf: ["salary.read"] },
    ],
  },
  {
    id: "insights",
    label: "Business intelligence",
    icon: "LineChart",
    items: [
      { id: "analytics", label: "Analytics", href: "/admin/analytics", icon: "BarChart3", anyOf: ["reports.read"], hint: "Bookings, services, staff, revenue" },
    ],
  },
  {
    id: "website",
    label: "Website management",
    icon: "Globe",
    items: [
      { id: "content", label: "Homepage & content", href: "/admin/content", icon: "FileText", anyOf: ["content.read"] },
      { id: "gallery", label: "Gallery & media", href: "/admin/gallery", icon: "Image", anyOf: ["gallery.manage"] },
    ],
  },
  {
    id: "system",
    label: "System",
    icon: "Settings",
    items: [
      { id: "branches", label: "Branches & business info", href: "/admin/branches", icon: "Building2", anyOf: ["branches.read"] },
      { id: "policies", label: "Booking policies", href: "/admin/policies", icon: "Receipt", anyOf: ["settings.manage"] },
      { id: "users", label: "Users", href: "/admin/users", icon: "Users", anyOf: ["users.read"] },
      { id: "audit", label: "Activity logs", href: "/admin/audit-logs", icon: "ScrollText", anyOf: ["audit.read"] },
      { id: "settings", label: "Account settings", href: "/admin/settings", icon: "Settings" },
    ],
  },
];

export interface ResolvedNavItem extends Omit<NavItem, "anyOf"> {
  badgeCount?: number;
}
export interface ResolvedNavSection extends Omit<NavSection, "items"> {
  items: ResolvedNavItem[];
}

/** Filter a registry by effective permissions. Empty sections disappear. */
export function filterNavigation(
  sections: NavSection[],
  hasAny: (keys: PermissionKey[]) => boolean,
  badgeCounts: Partial<Record<NonNullable<NavItem["badge"]>, number>> = {},
): ResolvedNavSection[] {
  return sections
    .map((section) => ({
      ...section,
      items: section.items
        .filter((item) => !item.anyOf || hasAny(item.anyOf))
        .map(({ anyOf: _anyOf, ...item }) => ({
          ...item,
          badgeCount: item.badge ? badgeCounts[item.badge] : undefined,
        })),
    }))
    .filter((section) => section.items.length > 0);
}

/** Longest-prefix match so nested routes highlight the right entry. */
export function activeNavItemId(sections: ResolvedNavSection[], pathname: string): string | null {
  let best: { id: string; len: number } | null = null;
  for (const section of sections) {
    for (const item of section.items) {
      const matches = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
      if (matches && (!best || item.href.length > best.len)) best = { id: item.id, len: item.href.length };
    }
  }
  return best?.id ?? null;
}
