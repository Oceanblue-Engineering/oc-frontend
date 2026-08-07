import {
  ShoppingCart,
  Package,
  Store,
  Receipt,
  CreditCard,
  Users,
  Truck,
  PieChart,
  LayoutDashboard,
  Shield,
  Bell,
  Gift,
  Bot,
  Settings,
  Target,
  Briefcase,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Centralized navigation config for the Hub-and-Spoke (App Launcher) layout.
 * Every feature route is described here; pages/Home.tsx renders this as a grid.
 *
 * `titleKey` / `descKey` are keys resolved through useLanguage().t(...).
 */
export interface NavigationItem {
  id: string;
  titleKey: string; // translation key (reuses sidebar.* labels)
  descKey: string; // translation key (home.desc.* short helper text)
  icon: LucideIcon;
  path: string;
  color: string; // Tailwind classes for the card icon accent
}

export const navigationItems: NavigationItem[] = [
  {
    id: "pos",
    titleKey: "sidebar.checkout",
    descKey: "home.desc.pos",
    icon: ShoppingCart,
    path: "/pos",
    color: "bg-ocean-50 text-ocean-600",
  },
  {
    id: "inventory",
    titleKey: "sidebar.inventory",
    descKey: "home.desc.inventory",
    icon: Package,
    path: "/inventory",
    color: "bg-emerald-50 text-emerald-700",
  },
  {
    id: "storefront",
    titleKey: "sidebar.storefront",
    descKey: "home.desc.storefront",
    icon: Store,
    path: "/storefront",
    color: "bg-ocean-50 text-ocean-700",
  },
  {
    id: "orders",
    titleKey: "sidebar.orders",
    descKey: "home.desc.orders",
    icon: Receipt,
    path: "/orders",
    color: "bg-ocean-100 text-ocean-700",
  },
  {
    id: "credit-orders",
    titleKey: "sidebar.creditOrder",
    descKey: "home.desc.creditOrders",
    icon: CreditCard,
    path: "/credit-orders",
    color: "bg-amber-50 text-amber-700",
  },
  {
    id: "credits",
    titleKey: "sidebar.creditSales",
    descKey: "home.desc.credits",
    icon: Users,
    path: "/credits",
    color: "bg-rose-50 text-rose-700",
  },
  {
    id: "suppliers",
    titleKey: "sidebar.suppliers",
    descKey: "home.desc.suppliers",
    icon: Truck,
    path: "/suppliers",
    color: "bg-teal-50 text-teal-700",
  },
  {
    id: "expenses",
    titleKey: "sidebar.expenses",
    descKey: "home.desc.expenses",
    icon: PieChart,
    path: "/expenses",
    color: "bg-orange-50 text-orange-700",
  },
  {
    id: "reports",
    titleKey: "sidebar.reports",
    descKey: "home.desc.reports",
    icon: LayoutDashboard,
    path: "/reports",
    color: "bg-ocean-50 text-ocean-700",
  },
  {
    id: "accounts",
    titleKey: "sidebar.accountManagement",
    descKey: "home.desc.accounts",
    icon: Shield,
    path: "/accounts",
    color: "bg-slate-100 text-slate-700",
  },
  {
    id: "daily-reports",
    titleKey: "sidebar.dailyReports",
    descKey: "home.desc.dailyReports",
    icon: Bell,
    path: "/daily-reports",
    color: "bg-teal-50 text-teal-700",
  },
  {
    id: "purchasing",
    titleKey: "sidebar.purchasing",
    descKey: "home.desc.purchasing",
    icon: Truck,
    path: "/purchasing",
    color: "bg-lime-50 text-lime-700",
  },
  // {
  //   id: "lucky-draw",
  //   titleKey: "sidebar.luckyDraw",
  //   descKey: "home.desc.luckyDraw",
  //   icon: Gift,
  //   path: "/lucky-draw",
  //   color: "bg-pink-50 text-pink-700",
  // },
  // {
  //   id: "ai-chat",
  //   titleKey: "sidebar.aiChat",
  //   descKey: "home.desc.aiChat",
  //   icon: Bot,
  //   path: "/ai-chat",
  //   color: "bg-fuchsia-50 text-fuchsia-700",
  // },
  {
    id: "settings",
    titleKey: "sidebar.settings",
    descKey: "home.desc.settings",
    icon: Settings,
    path: "/settings",
    color: "bg-gray-100 text-gray-700",
  },
  {
    id: "clientLeads",
    titleKey: "sidebar.clientLeads",
    descKey: "home.desc.clientLeads",
    icon: Target,
    path: "/clients",
    color: "bg-ocean-50 text-ocean-600",
  },
  {
    id: "delivery",
    titleKey: "sidebar.delivery",
    descKey: "home.desc.delivery",
    icon: Truck,
    path: "/delivery",
    color: "bg-ocean-50 text-ocean-600",
  },
  {
    id: "clientProjects",
    titleKey: "sidebar.clientProjects",
    descKey: "home.desc.clientProjects",
    icon: Briefcase,
    path: "/client-projects",
    color: "bg-teal-50 text-teal-700",
  },
];

/**
 * Role-based visibility — mirrors the old Sidebar.hasPermission logic.
 * Accepts a role string as used in the app ("owner" | "admin" | "cashier" | undefined).
 */
export const hasPermission = (path: string, role?: string): boolean => {
  if (path === "/accounts" && role !== "owner") return false;
  if (
    ["/purchasing", "/inventory", "/warehouse", "/suppliers"].includes(path) &&
    role !== "admin" &&
    role !== "owner"
  ) {
    return false;
  }
  return true;
};
