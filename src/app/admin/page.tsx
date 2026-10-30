import { getPrimaryBranch } from "@/features/site/queries";
import { getActor } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";
import { brand } from "@/config/brand";
import { SiteHeader, type Viewer } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import Link from "next/link";
import { ArrowRight, LayoutDashboard, CalendarDays, ListChecks, Users, BadgePercent, Wallet, Scissors } from "lucide-react";
import { Panel, PanelHeader, PanelBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/money";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
  title: `Admin Dashboard · ${brand.name}`,
  description: "Stellar Family Salon admin dashboard — bookings, staff, offers and business overview.",
};

export default async function AdminPage() {
  const [branch, actor] = await Promise.all([getPrimaryBranch(), getActor()]);

  const viewer: Viewer | null = actor
    ? { name: actor.name, homeHref: "/admin", roleLabel: actor.roles[0]?.name ?? "Member" }
    : null;

  // Fetch dashboard stats
  const [totalBookings, todayBookings, totalCustomers, totalServices, totalEmployees, totalRevenue] =
    await Promise.all([
      prisma.booking.count(),
      prisma.booking.count({
        where: { startsAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)), lt: new Date(new Date().setHours(23, 59, 59, 999)) } },
      }),
      prisma.customerProfile.count(),
      prisma.service.count({ where: { isActive: true } }),
      prisma.employeeProfile.count({ where: { employmentStatus: "ACTIVE" } }),
      prisma.booking.aggregate({
        where: { status: { in: ["CONFIRMED", "CHECKED_IN", "IN_PROGRESS", "COMPLETED"] } },
        _sum: { total: true },
      }),
    ]);

  const recentBookings = await prisma.booking.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { customer: true, staff: { include: { user: true } } },
  });

  return (
    <div className="min-h-dvh bg-canvas">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-sand">
        Skip to content
      </a>
      <SiteHeader viewer={viewer} />
      <main id="main" className="min-h-[60vh] pb-20 sm:pb-0">
        <div className="shell py-8 lg:py-16">
          <div className="flex items-center justify-between gap-4 mb-8">
            <div>
              <PanelHeader title="Admin Dashboard" description="Business overview for {branch?.name ?? brand.name}" icon={<LayoutDashboard className="size-5" />} />
            </div>
            <Button asChild size="md" className="bg-brand text-brand-fg hover:bg-brand/90">
              <Link href="/book">New booking <ArrowRight className="size-4 ml-1" /></Link>
            </Button>
          </div>

          {/* Stat cards */}
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6 mb-10">
            <div className={cn("rounded-lg border border-line bg-surface p-5", "hover:border-brand transition-colors group")}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-fg-2">Total bookings</p>
                  <p className="text-2xl font-bold tabular text-fg">{totalBookings}</p>
                </div>
                <div className="p-2 bg-brand/10 rounded-lg text-brand-text">
                  <ListChecks className="size-5" />
                </div>
              </div>
            </div>
            <div className={cn("rounded-lg border border-line bg-surface p-5", "hover:border-brand transition-colors group")}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-fg-2">Today</p>
                  <p className="text-2xl font-bold tabular text-fg">{todayBookings}</p>
                </div>
                <div className="p-2 bg-ink/10 rounded-lg text-fg">
                  <CalendarDays className="size-5" />
                </div>
              </div>
            </div>
            <div className={cn("rounded-lg border border-line bg-surface p-5", "hover:border-brand transition-colors group")}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-fg-2">Customers</p>
                  <p className="text-2xl font-bold tabular text-fg">{totalCustomers}</p>
                </div>
                <div className="p-2 bg-sand/10 rounded-lg text-sand/80">
                  <Users className="size-5" />
                </div>
              </div>
            </div>
            <div className={cn("rounded-lg border border-line bg-surface p-5", "hover:border-brand transition-colors group")}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-fg-2">Services</p>
                  <p className="text-2xl font-bold tabular text-fg">{totalServices}</p>
                </div>
                <div className="p-2 bg-brand/10 rounded-lg text-brand-text">
                  <Scissors className="size-5" />
                </div>
              </div>
            </div>
            <div className={cn("rounded-lg border border-line bg-surface p-5", "hover:border-brand transition-colors group")}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-fg-2">Staff</p>
                  <p className="text-2xl font-bold tabular text-fg">{totalEmployees}</p>
                </div>
                <div className="p-2 bg-sand/10 rounded-lg text-sand/80">
                  <BadgePercent className="size-5" />
                </div>
              </div>
            </div>
            <div className={cn("rounded-lg border border-line bg-surface p-5", "hover:border-brand transition-colors group")}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-fg-2">Revenue</p>
                  <p className="text-2xl font-bold tabular text-fg">{formatINR(totalRevenue._sum.total ?? 0)}</p>
                </div>
                <div className="p-2 bg-ink/10 rounded-lg text-fg">
                  <Wallet className="size-5" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <Panel className="lg:col-span-2">
              <PanelHeader title="Recent bookings" icon={<ListChecks className="size-5" />} />
              <PanelBody>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-line">
                        <th className="pb-3 text-fg-2 font-medium">Reference</th>
                        <th className="pb-3 text-fg-2 font-medium">Customer</th>
                        <th className="pb-3 text-fg-2 font-medium">Stylist</th>
                        <th className="pb-3 text-fg-2 font-medium text-right">Total</th>
                        <th className="pb-3 text-fg-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {recentBookings.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-fg-2">
                            No recent bookings.
                          </td>
                        </tr>
                      ) : (
                        recentBookings.map((b) => (
                          <tr key={b.id} className="hover:bg-surface/50 transition-colors">
                            <td className="py-3 font-mono text-fg">{b.reference}</td>
                        <td className="py-3 text-fg">{b.customer?.fullName ?? "Guest"}</td>
                        <td className="py-3 text-fg-2">{b.staff?.user?.name ?? "—"}</td>
                            <td className="py-3 text-right font-mono tabular text-fg">{formatINR(Number(b.total))}</td>
                            <td className="py-3">
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold",
                                  b.status === "CONFIRMED"
                                    ? "bg-green/10 text-green"
                                    : b.status === "PENDING"
                                      ? "bg-amber/10 text-amber"
                                      : b.status === "CANCELLED"
                                        ? "bg-ink/10 text-ink"
                                        : b.status === "COMPLETED"
                                          ? "bg-brand/10 text-brand-text"
                                          : "bg-sand/10 text-sand/80"
                                )}
                              >
                                {b.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </PanelBody>
            </Panel>

            <Panel>
              <PanelHeader title="Quick actions" icon={<ArrowRight className="size-5" />} />
              <PanelBody className="space-y-3">
                <Link
                  href="/admin/appointments"
                  className="flex items-center justify-between p-3 rounded-lg border border-line hover:border-brand hover:bg-brand/5 transition-colors"
                >
                  <span className="text-sm text-fg">Manage appointments</span>
                  <ArrowRight className="size-4 text-fg-2" />
                </Link>
                <Link
                  href="/admin/employees"
                  className="flex items-center justify-between p-3 rounded-lg border border-line hover:border-brand hover:bg-brand/5 transition-colors"
                >
                  <span className="text-sm text-fg">Manage staff</span>
                  <ArrowRight className="size-4 text-fg-2" />
                </Link>
                <Link
                  href="/admin/offers"
                  className="flex items-center justify-between p-3 rounded-lg border border-line hover:border-brand hover:bg-brand/5 transition-colors"
                >
                  <span className="text-sm text-fg">Manage offers</span>
                  <ArrowRight className="size-4 text-fg-2" />
                </Link>
                <Link
                  href="/admin/services"
                  className="flex items-center justify-between p-3 rounded-lg border border-line hover:border-brand hover:bg-brand/5 transition-colors"
                >
                  <span className="text-sm text-fg">Manage services</span>
                  <ArrowRight className="size-4 text-fg-2" />
                </Link>
                <Link
                  href="/admin/settings"
                  className="flex items-center justify-between p-3 rounded-lg border border-line hover:border-brand hover:bg-brand/5 transition-colors"
                >
                  <span className="text-sm text-fg">Account settings</span>
                  <ArrowRight className="size-4 text-fg-2" />
                </Link>
              </PanelBody>
            </Panel>
          </div>

          <div className="mt-16 flex items-center justify-between gap-4">
            <a href="/" className="text-sm text-fg-2 hover:text-fg">&larr; Back to homepage</a>
          </div>
        </div>
      </main>
      <SiteFooter branch={branch} />
    </div>
  );
}
