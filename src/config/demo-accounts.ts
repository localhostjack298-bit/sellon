/**
 * Fictional demonstration identities. Emails use the reserved `.example` TLD.
 * Passwords are NEVER stored in source — they come from `DEMO_PASSWORD` (see .env.example) at seed time,
 * and quick-login on /demo only works when `DEMO_MODE=true`.
 */
export type DemoAccountKey = "admin" | "manager" | "managerRestricted" | "managerStandby" | "employee" | "stylist" | "customer";

export interface DemoAccount {
  key: DemoAccountKey;
  label: string;
  name: string;
  email: string;
  roleKey: string;
  portal: "/admin" | "/staff" | "/account";
  blurb: string;
}

export const DEMO_EMAIL_DOMAIN = "stellar-demo.example";

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    key: "admin",
    label: "Super Admin",
    name: "Samira Khan",
    email: `admin@${DEMO_EMAIL_DOMAIN}`,
    roleKey: "super_admin",
    portal: "/admin",
    blurb: "Everything: roles & permissions, manager seats, content, payroll, analytics and audit logs.",
  },
  {
    key: "manager",
    label: "Manager — full operations",
    name: "Priya Sharma",
    email: `priya.sharma@${DEMO_EMAIL_DOMAIN}`,
    roleKey: "manager",
    portal: "/staff",
    blurb: "Runs the floor: schedule, attendance, shifts, leave, salary records and reports.",
  },
  {
    key: "managerRestricted",
    label: "Manager — restricted",
    name: "Karan Verma",
    email: `karan.verma@${DEMO_EMAIL_DOMAIN}`,
    roleKey: "assistant_manager",
    portal: "/staff",
    blurb: "Assistant Manager: schedule and attendance only — no payroll, no publishing.",
  },
  {
    key: "managerStandby",
    label: "Manager — inactive standby",
    name: "Neha Iyer",
    email: `neha.iyer@${DEMO_EMAIL_DOMAIN}`,
    roleKey: "senior_manager",
    portal: "/staff",
    blurb: "Seeded as INACTIVE so you can demo the manager-seat limit (cannot sign in until activated).",
  },
  {
    key: "employee",
    label: "Employee — stylist",
    name: "Aarav Menon",
    email: `aarav.menon@${DEMO_EMAIL_DOMAIN}`,
    roleKey: "stylist",
    portal: "/staff",
    blurb: "Simple self-service view: today's appointments, check-in/out, leave and own payslips.",
  },
  {
    key: "stylist",
    label: "Employee — colour specialist",
    name: "Meera Kapoor",
    email: `meera.kapoor@${DEMO_EMAIL_DOMAIN}`,
    roleKey: "employee",
    portal: "/staff",
    blurb: "A second employee — use to verify one employee cannot open another's salary or schedule.",
  },
  {
    key: "customer",
    label: "Customer",
    name: "Riya Banerjee",
    email: `riya.banerjee@${DEMO_EMAIL_DOMAIN}`,
    roleKey: "customer",
    portal: "/account",
    blurb: "Book, reschedule, cancel, collect Stellar Rewards and save favourites.",
  },
];

export function findDemoAccount(key: string): DemoAccount | undefined {
  return DEMO_ACCOUNTS.find((a) => a.key === key);
}
