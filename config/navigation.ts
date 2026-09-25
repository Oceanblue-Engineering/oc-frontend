import {
  ShoppingCart,
  Package,
  Warehouse,
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
  Ticket,
  Activity,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Centralized navigation config for the Hub-and-Spoke (App Launcher) layout.
 * Every feature route is described here; pages/Home.tsx renders this as a grid.
 *
 * `titleKey` / `descKey` are keys resolved through useLanguage().t(...).
 */
export type NavigationCategory = "purchasing_orders" | "project_management";

export interface NavigationSlide {
  id: NavigationCategory;
  titleKey: string;
  descKey: string;
  iconName: "shopping" | "project";
}

export interface NavigationItem {
  id: string;
  category: NavigationCategory;
  titleKey: string; // translation key (reuses sidebar.* labels)
  descKey: string; // translation key (home.desc.* short helper text)
  icon: LucideIcon;
  path: string;
  color: string; // Tailwind classes for the card icon accent
}

export const navigationSlides: NavigationSlide[] = [
  {
    id: "purchasing_orders",
    titleKey: "home.slides.purchasingOrders",
    descKey: "home.slides.purchasingOrdersDesc",
    iconName: "shopping",
  },
  {
    id: "project_management",
    titleKey: "home.slides.projectManagement",
    descKey: "home.slides.projectManagementDesc",
    iconName: "project",
  },
];

export const navigationItems: NavigationItem[] = [
  // Slide 1: Purchasing & Orders (Sales, Stock, Purchasing, Financials & Operations)
  {
    id: "pos",
    category: "purchasing_orders",
    titleKey: "sidebar.checkout",
    descKey: "home.desc.pos",
    icon: ShoppingCart,
    path: "/pos",
    color: "bg-ocean-50 text-ocean-600",
  },
  {
    id: "inventory",
    category: "purchasing_orders",
    titleKey: "sidebar.inventory",
    descKey: "home.desc.inventory",
    icon: Package,
    path: "/inventory",
    color: "bg-emerald-50 text-emerald-700",
  },
  {
    id: "warehouse",
    category: "purchasing_orders",
    titleKey: "sidebar.warehouse",
    descKey: "home.desc.warehouse",
    icon: Warehouse,
    path: "/warehouse",
    color: "bg-blue-50 text-blue-700",
  },
  {
    id: "storefront",
    category: "purchasing_orders",
    titleKey: "sidebar.storefront",
    descKey: "home.desc.storefront",
    icon: Store,
    path: "/storefront",
    color: "bg-ocean-50 text-ocean-700",
  },
  {
    id: "orders",
    category: "purchasing_orders",
    titleKey: "sidebar.orders",
    descKey: "home.desc.orders",
    icon: Receipt,
    path: "/orders",
    color: "bg-ocean-100 text-ocean-700",
  },
  {
    id: "credit-orders",
    category: "purchasing_orders",
    titleKey: "sidebar.creditOrder",
    descKey: "home.desc.creditOrders",
    icon: CreditCard,
    path: "/credit-orders",
    color: "bg-amber-50 text-amber-700",
  },
  {
    id: "credits",
    category: "purchasing_orders",
    titleKey: "sidebar.creditSales",
    descKey: "home.desc.credits",
    icon: Users,
    path: "/credits",
    color: "bg-rose-50 text-rose-700",
  },
  {
    id: "purchasing",
    category: "purchasing_orders",
    titleKey: "sidebar.purchasing",
    descKey: "home.desc.purchasing",
    icon: Truck,
    path: "/purchasing",
    color: "bg-lime-50 text-lime-700",
  },
  {
    id: "suppliers",
    category: "purchasing_orders",
    titleKey: "sidebar.suppliers",
    descKey: "home.desc.suppliers",
    icon: Truck,
    path: "/suppliers",
    color: "bg-zinc-50 text-zinc-700",
  },
  {
    id: "expenses",
    category: "purchasing_orders",
    titleKey: "sidebar.expenses",
    descKey: "home.desc.expenses",
    icon: PieChart,
    path: "/expenses",
    color: "bg-orange-50 text-orange-700",
  },
  {
    id: "personal-expenses",
    category: "purchasing_orders",
    titleKey: "sidebar.personalExpenses",
    descKey: "home.desc.personalExpenses",
    icon: Wallet,
    path: "/personal-expenses",
    color: "bg-emerald-50 text-emerald-700",
  },
  {
    id: "delivery",
    category: "purchasing_orders",
    titleKey: "sidebar.delivery",
    descKey: "home.desc.delivery",
    icon: Truck,
    path: "/delivery",
    color: "bg-ocean-50 text-ocean-600",
  },
  {
    id: "reports",
    category: "purchasing_orders",
    titleKey: "sidebar.reports",
    descKey: "home.desc.reports",
    icon: LayoutDashboard,
    path: "/reports",
    color: "bg-ocean-50 text-ocean-700",
  },
  {
    id: "accounts",
    category: "purchasing_orders",
    titleKey: "sidebar.accountManagement",
    descKey: "home.desc.accounts",
    icon: Shield,
    path: "/accounts",
    color: "bg-slate-100 text-slate-700",
  },

  // Slide 2: Project Management (Client Leads, Projects, Invoice Generator, Site Workers, Support Tickets)
  {
    id: "clientLeads",
    category: "project_management",
    titleKey: "sidebar.clientLeads",
    descKey: "home.desc.clientLeads",
    icon: Target,
    path: "/clients",
    color: "bg-indigo-50 text-indigo-700",
  },
  {
    id: "clientProjects",
    category: "project_management",
    titleKey: "sidebar.clientProjects",
    descKey: "home.desc.clientProjects",
    icon: Briefcase,
    path: "/client-projects",
    color: "bg-blue-50 text-blue-700",
  },
  {
    id: "invoiceGenerator",
    category: "project_management",
    titleKey: "sidebar.invoiceGenerator",
    descKey: "home.desc.invoiceGenerator",
    icon: Receipt,
    path: "/invoice-generator",
    color: "bg-teal-50 text-teal-700",
  },
  {
    id: "workers",
    category: "project_management",
    titleKey: "sidebar.workerManagement",
    descKey: "home.desc.workers",
    icon: Users,
    path: "/workers",
    color: "bg-amber-50 text-amber-700",
  },
  {
    id: "tickets",
    category: "project_management",
    titleKey: "sidebar.tickets",
    descKey: "home.desc.tickets",
    icon: Ticket,
    path: "/tickets",
    color: "bg-violet-50 text-violet-700",
  },
];

/**
 * Role-based visibility — mirrors the old Sidebar.hasPermission logic.
 * Accepts a role string as used in the app ("owner" | "admin" | "cashier" | undefined).
 */
export const hasPermission = (path: string, role?: string): boolean => {
  if (
    (path === "/accounts" || path === "/personal-expenses") &&
    role !== "owner"
  ) {
    return false;
  }
  if (path === "/activity-logs" && role !== "owner" && role !== "admin") return false;
  if (
    ["/purchasing", "/inventory", "/warehouse", "/suppliers"].includes(path) &&
    role !== "admin" &&
    role !== "owner"
  ) {
    return false;
  }
  return true;
};

