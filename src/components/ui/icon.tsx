import {
  LayoutDashboard, CalendarDays, CalendarRange, ListChecks, Users, UserRound, UsersRound, ClipboardCheck, Clock, CalendarOff, Wallet,
  BadgePercent, BarChart3, Scissors, Sparkles, ShieldCheck, KeyRound, Image as ImageIcon, FileText, Building2, ScrollText, Settings,
  Receipt, Landmark, PartyPopper, UserCog, Bell, Layers, Briefcase, Globe, Gauge, History, LineChart, HeartHandshake, Contact, Palette,
  type LucideIcon,
} from "lucide-react";
import type { IconName } from "@/config/navigation";

const ICONS: Record<IconName, LucideIcon> = {
  LayoutDashboard, CalendarDays, CalendarRange, ListChecks, Users, UserRound, UsersRound, ClipboardCheck, Clock, CalendarOff, Wallet,
  BadgePercent, BarChart3, Scissors, Sparkles, ShieldCheck, KeyRound, Image: ImageIcon, FileText, Building2, ScrollText, Settings,
  Receipt, Landmark, PartyPopper, UserCog, Bell, Layers, Briefcase, Globe, Gauge, History, LineChart, HeartHandshake, Contact, Palette,
};

export function Icon({ name, className, strokeWidth = 1.75 }: { name: IconName; className?: string; strokeWidth?: number }) {
  const Cmp = ICONS[name] ?? LayoutDashboard;
  return <Cmp className={className} strokeWidth={strokeWidth} aria-hidden />;
}
