/**
 * Central permission registry — the single source of truth for every capability in the product.
 *
 *  • The database `permissions` table is synced from this file (seed + `syncPermissionRegistry`).
 *  • The role editor (`/admin/roles/[id]`) renders its matrix from this file.
 *  • Server actions / route handlers / queries reference keys as the typed `PermissionKey` union.
 *  • Unknown keys are default-denied by the engine in `lib/permissions/engine.ts`.
 *
 * This file is isomorphic (no server-only imports) so the editor UI and the seed can share it.
 */

export const PERMISSION_SCOPES = ["OWN", "BRANCH", "ALL"] as const;
export type PermissionScope = (typeof PERMISSION_SCOPES)[number];

export const SCOPE_RANK: Record<PermissionScope, number> = { OWN: 1, BRANCH: 2, ALL: 3 };

export const SCOPE_LABELS: Record<PermissionScope, string> = {
  OWN: "Own",
  BRANCH: "Own branch",
  ALL: "All branches",
};

export type MatrixColumn = "view" | "create" | "edit" | "delete" | "approve" | "other";

export const MATRIX_COLUMNS: { id: MatrixColumn; label: string; hint: string }[] = [
  { id: "view", label: "View", hint: "See records" },
  { id: "create", label: "Create", hint: "Add new records" },
  { id: "edit", label: "Edit", hint: "Change / record" },
  { id: "delete", label: "Delete", hint: "Remove or cancel" },
  { id: "approve", label: "Approve", hint: "Approve or publish" },
  { id: "other", label: "Special", hint: "Module-specific" },
];

export type PermissionGroupId = "operations" | "team" | "business" | "system";

export const PERMISSION_GROUPS: { id: PermissionGroupId; label: string; description: string }[] = [
  { id: "operations", label: "Salon operations", description: "Appointments, customers, catalogue and promotions" },
  { id: "team", label: "Team & HR", description: "Employees, attendance, leave, shifts and payroll" },
  { id: "business", label: "Business & website", description: "Public content, media, branches and reports" },
  { id: "system", label: "System & access", description: "Users, roles, settings and audit trail" },
];

interface PermissionInput {
  readonly action: string;
  readonly label: string;
  readonly description: string;
  readonly column: MatrixColumn;
  /** Scopes the editor offers for this permission. Omit when scoping does not apply. */
  readonly scopes?: readonly PermissionScope[];
  readonly sensitive?: boolean;
}

interface ModuleInput {
  readonly id: string;
  readonly label: string;
  readonly group: PermissionGroupId;
  readonly description: string;
  /** What the "OWN" scope means for this module (shown in the editor). */
  readonly ownMeaning?: string;
  readonly permissions: readonly PermissionInput[];
}

const OWN_BRANCH_ALL = ["OWN", "BRANCH", "ALL"] as const;
const BRANCH_ALL = ["BRANCH", "ALL"] as const;

export const PERMISSION_MODULES = [
  {
    id: "appointments",
    label: "Appointments",
    group: "operations",
    description: "Bookings, the staff calendar, walk-ins and status changes.",
    ownMeaning: "Appointments assigned to me",
    permissions: [
      { action: "read", label: "View appointments", description: "See bookings and the calendar.", column: "view", scopes: OWN_BRANCH_ALL },
      { action: "create", label: "Create appointments", description: "Create bookings and walk-ins for customers.", column: "create", scopes: BRANCH_ALL },
      { action: "update", label: "Update appointments", description: "Reschedule, reassign stylist, check in, start, complete and mark no-show.", column: "edit", scopes: OWN_BRANCH_ALL },
      { action: "cancel", label: "Cancel appointments", description: "Cancel bookings on a customer's behalf.", column: "delete", scopes: OWN_BRANCH_ALL },
      { action: "notes", label: "Internal notes", description: "Read and write staff-only notes on appointments.", column: "other", scopes: OWN_BRANCH_ALL },
    ],
  },
  {
    id: "customers",
    label: "Customers",
    group: "operations",
    description: "Customer directory, booking history and staff notes.",
    ownMeaning: "Customers I have served",
    permissions: [
      { action: "read", label: "View customers", description: "Search customers and see their booking history.", column: "view", scopes: OWN_BRANCH_ALL },
      { action: "update", label: "Edit customers", description: "Edit customer details and staff-only notes.", column: "edit", scopes: BRANCH_ALL },
      { action: "export", label: "Export customers", description: "Download customer lists as CSV.", column: "other", scopes: BRANCH_ALL, sensitive: true },
    ],
  },
  {
    id: "services",
    label: "Services & catalogue",
    group: "operations",
    description: "Service menu, categories, durations and sample pricing.",
    permissions: [
      { action: "read", label: "View services", description: "See the service catalogue.", column: "view" },
      { action: "create", label: "Create services", description: "Add services and categories.", column: "create" },
      { action: "update", label: "Edit services", description: "Change names, durations, prices and eligibility.", column: "edit" },
      { action: "delete", label: "Archive services", description: "Remove services from the menu.", column: "delete" },
    ],
  },
  {
    id: "offers",
    label: "Offers & promotions",
    group: "operations",
    description: "Promotional campaigns shown on the website and applied at booking.",
    permissions: [
      { action: "read", label: "View offers", description: "See offers and their performance.", column: "view" },
      { action: "create", label: "Create offers", description: "Draft new offers.", column: "create" },
      { action: "update", label: "Edit offers", description: "Edit drafts, pause or resume offers.", column: "edit" },
      { action: "delete", label: "Archive offers", description: "Archive offers.", column: "delete" },
      { action: "publish", label: "Publish offers", description: "Make offers live on the public website.", column: "approve" },
    ],
  },
  {
    id: "reports",
    label: "Reports & analytics",
    group: "business",
    description: "Booking volume, revenue estimates, utilisation and trends.",
    ownMeaning: "My own performance only",
    permissions: [
      { action: "read", label: "View reports", description: "Open dashboards and analytics.", column: "view", scopes: OWN_BRANCH_ALL },
      { action: "export", label: "Export reports", description: "Download report data as CSV.", column: "other", scopes: BRANCH_ALL },
    ],
  },
  {
    id: "employees",
    label: "Employees",
    group: "team",
    description: "Employee directory, profiles, skills and service eligibility.",
    ownMeaning: "My own profile",
    permissions: [
      { action: "read", label: "View employees", description: "See the directory and profiles.", column: "view", scopes: OWN_BRANCH_ALL },
      { action: "create", label: "Add employees", description: "Create employee profiles and logins.", column: "create", scopes: BRANCH_ALL },
      { action: "update", label: "Edit employees", description: "Edit details, specialties and weekly availability.", column: "edit", scopes: OWN_BRANCH_ALL },
      { action: "delete", label: "Deactivate employees", description: "Mark employees as terminated.", column: "delete", scopes: BRANCH_ALL },
    ],
  },
  {
    id: "attendance",
    label: "Attendance",
    group: "team",
    description: "Daily check-in/out, monthly attendance and manual corrections.",
    ownMeaning: "My own attendance",
    permissions: [
      { action: "read", label: "View attendance", description: "See daily and monthly attendance.", column: "view", scopes: OWN_BRANCH_ALL },
      { action: "write", label: "Record attendance", description: "Mark present, absent, half-day, late; add notes.", column: "edit", scopes: BRANCH_ALL },
      { action: "approve", label: "Approve corrections", description: "Correct past records (always audited).", column: "approve", scopes: BRANCH_ALL },
      { action: "checkin", label: "Self check-in / out", description: "Check myself in and out for the day.", column: "other" },
    ],
  },
  {
    id: "leave",
    label: "Leave requests",
    group: "team",
    description: "Submit, review and decide leave. Approved leave blocks booking availability.",
    ownMeaning: "My own requests",
    permissions: [
      { action: "read", label: "View leave", description: "See leave requests.", column: "view", scopes: OWN_BRANCH_ALL },
      { action: "create", label: "Submit leave", description: "Submit leave requests for myself.", column: "create" },
      { action: "approve", label: "Decide leave", description: "Approve or reject leave requests.", column: "approve", scopes: BRANCH_ALL },
    ],
  },
  {
    id: "shifts",
    label: "Shifts & availability",
    group: "team",
    description: "Shift calendar, weekly schedules and date-specific overrides.",
    ownMeaning: "My own schedule",
    permissions: [
      { action: "read", label: "View shifts", description: "See the shift calendar.", column: "view", scopes: OWN_BRANCH_ALL },
      { action: "write", label: "Manage shifts", description: "Assign shifts, days off and weekly availability.", column: "edit", scopes: BRANCH_ALL },
    ],
  },
  {
    id: "salary",
    label: "Salary & payroll",
    group: "team",
    description: "Restricted payroll records. Fictional demo data — no real payments are made.",
    ownMeaning: "My own payslips",
    permissions: [
      { action: "read", label: "View salary records", description: "See salary records and payroll history.", column: "view", scopes: OWN_BRANCH_ALL, sensitive: true },
      { action: "write", label: "Edit salary records", description: "Set base salary, allowances, bonuses and deductions.", column: "edit", scopes: BRANCH_ALL, sensitive: true },
      { action: "approve", label: "Review & mark paid", description: "Move records to Reviewed / Paid.", column: "approve", scopes: BRANCH_ALL, sensitive: true },
      { action: "export", label: "Export payroll CSV", description: "Download payroll records as CSV.", column: "other", scopes: BRANCH_ALL, sensitive: true },
    ],
  },
  {
    id: "content",
    label: "Website content",
    group: "business",
    description: "Homepage copy, hero imagery, banners and about page.",
    permissions: [
      { action: "read", label: "View content", description: "See website content blocks.", column: "view" },
      { action: "update", label: "Edit content (draft)", description: "Edit drafts and preview changes.", column: "edit" },
      { action: "publish", label: "Publish content", description: "Publish drafts to the live website.", column: "approve" },
    ],
  },
  {
    id: "gallery",
    label: "Gallery & media",
    group: "business",
    description: "Gallery items and media library.",
    permissions: [{ action: "manage", label: "Manage gallery & media", description: "Add, edit, hide and reorder gallery items and media.", column: "edit" }],
  },
  {
    id: "branches",
    label: "Branches & business info",
    group: "business",
    description: "Business information, contact details and opening hours.",
    permissions: [
      { action: "read", label: "View branches", description: "See branch details.", column: "view" },
      { action: "update", label: "Edit branches", description: "Edit business info, contact details and hours.", column: "edit" },
    ],
  },
  {
    id: "users",
    label: "Users & managers",
    group: "system",
    description: "Accounts, manager seats, activation and suspension.",
    permissions: [
      { action: "read", label: "View users", description: "See user accounts.", column: "view" },
      { action: "manage", label: "Manage users", description: "Create managers, assign roles, activate, deactivate and suspend.", column: "edit", sensitive: true },
    ],
  },
  {
    id: "roles",
    label: "Roles & permissions",
    group: "system",
    description: "Role definitions and the permission matrix.",
    permissions: [
      { action: "read", label: "View roles", description: "See roles and their permissions.", column: "view" },
      { action: "manage", label: "Manage roles", description: "Create, edit, duplicate roles and change permissions.", column: "edit", sensitive: true },
    ],
  },
  {
    id: "settings",
    label: "Settings & policies",
    group: "system",
    description: "Booking policies, manager seat limit and system configuration.",
    permissions: [{ action: "manage", label: "Manage settings", description: "Edit booking policies and system settings.", column: "edit", sensitive: true }],
  },
  {
    id: "audit",
    label: "Activity logs",
    group: "system",
    description: "Audit trail of administrative and operational changes.",
    permissions: [{ action: "read", label: "View activity logs", description: "Read the audit trail.", column: "view" }],
  },
] as const satisfies readonly ModuleInput[];

type ModuleTuple = (typeof PERMISSION_MODULES)[number];

/** Union of every valid permission identifier, e.g. `"salary.read"`. */
export type PermissionKey = ModuleTuple extends infer M
  ? M extends { readonly id: infer I extends string; readonly permissions: readonly { readonly action: infer A extends string }[] }
    ? `${I}.${A}`
    : never
  : never;

export interface PermissionDef {
  key: PermissionKey;
  module: string;
  action: string;
  label: string;
  description: string;
  column: MatrixColumn;
  scopes?: readonly PermissionScope[];
  sensitive: boolean;
}

export interface ModuleDef {
  id: string;
  label: string;
  group: PermissionGroupId;
  description: string;
  ownMeaning?: string;
  permissions: PermissionDef[];
}

export const MODULES: ModuleDef[] = PERMISSION_MODULES.map((m) => ({
  id: m.id,
  label: m.label,
  group: m.group,
  description: m.description,
  ownMeaning: "ownMeaning" in m ? (m.ownMeaning as string) : undefined,
  permissions: (m.permissions as readonly PermissionInput[]).map((p) => ({
    key: `${m.id}.${p.action}` as PermissionKey,
    module: m.id,
    action: p.action,
    label: p.label,
    description: p.description,
    column: p.column,
    scopes: p.scopes,
    sensitive: Boolean(p.sensitive),
  })),
}));

export const ALL_PERMISSIONS: PermissionDef[] = MODULES.flatMap((m) => m.permissions);
export const ALL_PERMISSION_KEYS: PermissionKey[] = ALL_PERMISSIONS.map((p) => p.key);

const PERMISSION_INDEX = new Map<string, PermissionDef>(ALL_PERMISSIONS.map((p) => [p.key, p]));

export function isPermissionKey(value: unknown): value is PermissionKey {
  return typeof value === "string" && PERMISSION_INDEX.has(value);
}

export function getPermissionDef(key: string): PermissionDef | undefined {
  return PERMISSION_INDEX.get(key);
}

/** The scope an unscoped permission always evaluates to. */
export const DEFAULT_SCOPE: PermissionScope = "ALL";

/** Clamp a requested scope to what the permission supports. */
export function normalizeScope(key: string, requested: PermissionScope | undefined): PermissionScope {
  const def = PERMISSION_INDEX.get(key);
  if (!def?.scopes?.length) return DEFAULT_SCOPE;
  const wanted = requested ?? def.scopes[def.scopes.length - 1];
  return def.scopes.includes(wanted) ? wanted : def.scopes[def.scopes.length - 1];
}
