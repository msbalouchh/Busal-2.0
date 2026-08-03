import {
  BarChart3,
  Bot,
  Building2,
  CalendarDays,
  ChefHat,
  CreditCard,
  LayoutDashboard,
  Megaphone,
  Package,
  Settings,
  ShoppingCart,
  Sparkles,
  Users,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";

import { WORKSPACE_SHELL_ROUTES } from "@/modules/application-shell/constants/routes";
import type { WorkspaceNavSection } from "@/modules/application-shell/types/workspace-shell.types";

export const WORKSPACE_PRIMARY_NAV: WorkspaceNavSection[] = [
  {
    id: "core",
    label: "Core",
    defaultOpen: true,
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        href: WORKSPACE_SHELL_ROUTES.dashboard,
        icon: LayoutDashboard,
      },
      {
        id: "business",
        label: "Business",
        href: WORKSPACE_SHELL_ROUTES.business,
        icon: Building2,
        children: [
          {
            id: "business-profile",
            label: "Profile",
            href: WORKSPACE_SHELL_ROUTES.business,
            icon: Building2,
          },
          {
            id: "business-branches",
            label: "Branches",
            href: "/dashboard/branches",
            icon: Building2,
          },
        ],
      },
      {
        id: "customers",
        label: "Customers",
        href: WORKSPACE_SHELL_ROUTES.customers,
        icon: Users,
      },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    defaultOpen: true,
    items: [
      {
        id: "orders",
        label: "Orders",
        href: WORKSPACE_SHELL_ROUTES.orders,
        icon: ShoppingCart,
      },
      {
        id: "reservations",
        label: "Reservations",
        href: WORKSPACE_SHELL_ROUTES.reservations,
        icon: CalendarDays,
      },
      {
        id: "menu",
        label: "Menu",
        href: WORKSPACE_SHELL_ROUTES.menu,
        icon: UtensilsCrossed,
      },
      {
        id: "kitchen",
        label: "Kitchen",
        href: WORKSPACE_SHELL_ROUTES.kitchen,
        icon: ChefHat,
      },
      {
        id: "pos",
        label: "POS",
        href: WORKSPACE_SHELL_ROUTES.pos,
        icon: Wallet,
      },
      {
        id: "inventory",
        label: "Inventory",
        href: WORKSPACE_SHELL_ROUTES.inventory,
        icon: Package,
      },
    ],
  },
  {
    id: "growth",
    label: "Growth",
    defaultOpen: false,
    items: [
      {
        id: "marketing",
        label: "Marketing",
        href: WORKSPACE_SHELL_ROUTES.marketing,
        icon: Megaphone,
      },
      {
        id: "finance",
        label: "Finance",
        href: WORKSPACE_SHELL_ROUTES.finance,
        icon: CreditCard,
      },
      {
        id: "staff",
        label: "Staff",
        href: WORKSPACE_SHELL_ROUTES.staff,
        icon: Users,
      },
      {
        id: "reports",
        label: "Reports",
        href: WORKSPACE_SHELL_ROUTES.reports,
        icon: BarChart3,
      },
    ],
  },
  {
    id: "platform",
    label: "Platform",
    defaultOpen: false,
    items: [
      {
        id: "ai",
        label: "AI",
        href: WORKSPACE_SHELL_ROUTES.ai,
        icon: Sparkles,
        children: [
          {
            id: "ai-agents",
            label: "Agents",
            href: "/dashboard/ai-agents",
            icon: Bot,
          },
          {
            id: "ai-knowledge",
            label: "Knowledge",
            href: "/dashboard/ai-knowledge",
            icon: Bot,
          },
        ],
      },
      {
        id: "settings",
        label: "Settings",
        href: WORKSPACE_SHELL_ROUTES.settings,
        icon: Settings,
      },
    ],
  },
];
