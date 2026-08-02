import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Building2,
  Calendar,
  ChefHat,
  CreditCard,
  FileText,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  Sparkles,
  Users,
  UtensilsCrossed,
} from "lucide-react";

import {
  APPLICATION_SHELL_NAV_ITEMS,
  APPLICATION_SHELL_ROUTES,
} from "@/components/layout/application-shell-config";
import { BUSINESS_ROUTES } from "@/modules/business/constants/routes";
import { NOTIFICATIONS_ROUTES } from "@/modules/notifications/constants/routes";
import { RBAC_ROUTES } from "@/modules/rbac/constants/rbac-routes";

export interface ApplicationSearchItem {
  id: string;
  label: string;
  description: string;
  group: string;
  icon: LucideIcon;
  href: string;
  keywords: string[];
}

const RESTAURANT_SEARCH_ITEMS: ApplicationSearchItem[] = [
  {
    id: "restaurant-orders",
    label: "Orders",
    description: "View and manage restaurant orders",
    group: "Restaurant",
    icon: ShoppingCart,
    href: "/app/restaurant/orders",
    keywords: ["order", "pos", "sales"],
  },
  {
    id: "restaurant-customers",
    label: "Customers",
    description: "Guest profiles, loyalty, and CRM",
    group: "Restaurant",
    icon: Users,
    href: "/app/restaurant/customers",
    keywords: ["customer", "guest", "loyalty"],
  },
  {
    id: "restaurant-menus",
    label: "Menus",
    description: "Menus, categories, products, and modifiers",
    group: "Restaurant",
    icon: UtensilsCrossed,
    href: "/app/restaurant/menus",
    keywords: ["menu", "product", "category"],
  },
  {
    id: "restaurant-inventory",
    label: "Inventory",
    description: "Stock levels, suppliers, and purchase orders",
    group: "Restaurant",
    icon: Package,
    href: "/app/restaurant/inventory",
    keywords: ["inventory", "stock", "supplier"],
  },
  {
    id: "restaurant-kitchen",
    label: "Kitchen Display",
    description: "Kitchen queue and preparation workflow",
    group: "Restaurant",
    icon: ChefHat,
    href: "/app/restaurant/kitchen",
    keywords: ["kitchen", "kds", "prep"],
  },
  {
    id: "restaurant-payments",
    label: "Payments",
    description: "Take payments and view payment history",
    group: "Restaurant",
    icon: CreditCard,
    href: "/app/restaurant/payments",
    keywords: ["payment", "checkout", "receipt"],
  },
  {
    id: "restaurant-reservations",
    label: "Reservations",
    description: "Table bookings and guest schedules",
    group: "Restaurant",
    icon: Calendar,
    href: "/app/restaurant/reservations",
    keywords: ["reservation", "booking", "table"],
  },
  {
    id: "restaurant-analytics",
    label: "Analytics",
    description: "Sales, orders, and operational reports",
    group: "Restaurant",
    icon: BarChart3,
    href: "/app/restaurant/analytics",
    keywords: ["analytics", "reports", "insights"],
  },
  {
    id: "restaurant-assistant",
    label: "Restaurant Assistant",
    description: "AI recommendations for your venue",
    group: "Restaurant",
    icon: Sparkles,
    href: "/app/restaurant/assistant",
    keywords: ["assistant", "ai", "recommendations"],
  },
];

const ADMIN_SEARCH_ITEMS: ApplicationSearchItem[] = [
  {
    id: "business-profile",
    label: "Business Profile",
    description: "Legal name, industry, and business details",
    group: "Business",
    icon: Building2,
    href: BUSINESS_ROUTES.profile,
    keywords: ["business", "profile", "company"],
  },
  {
    id: "roles-permissions",
    label: "Roles & Permissions",
    description: "Manage access control for your team",
    group: "Business",
    icon: Settings,
    href: RBAC_ROUTES.roles,
    keywords: ["roles", "permissions", "rbac"],
  },
  {
    id: "notifications-inbox",
    label: "Notifications Inbox",
    description: "View all workspace notifications",
    group: "Business",
    icon: FileText,
    href: NOTIFICATIONS_ROUTES.inbox,
    keywords: ["notifications", "inbox", "alerts"],
  },
];

export const APPLICATION_SEARCH_ITEMS: ApplicationSearchItem[] = [
  ...APPLICATION_SHELL_NAV_ITEMS.map((item) => ({
    id: `nav-${item.id}`,
    label: item.label,
    description: `Open ${item.label}`,
    group: "Navigation",
    icon: item.icon,
    href: item.href,
    keywords: [item.label.toLowerCase(), item.id],
  })),
  ...RESTAURANT_SEARCH_ITEMS,
  ...ADMIN_SEARCH_ITEMS,
];

export function filterApplicationSearchItems(query: string): ApplicationSearchItem[] {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return [
      {
        id: "quick-dashboard",
        label: "Dashboard",
        description: "Overview and key metrics",
        group: "Quick access",
        icon: LayoutDashboard,
        href: APPLICATION_SHELL_ROUTES.dashboard,
        keywords: ["home", "overview"],
      },
      ...APPLICATION_SEARCH_ITEMS.filter((item) =>
        [
          "nav-restaurant",
          "nav-staff",
          "nav-branches",
          "nav-crm",
          "nav-ai",
          "restaurant-orders",
          "restaurant-customers",
        ].includes(item.id),
      ),
    ];
  }

  return APPLICATION_SEARCH_ITEMS.filter(
    (item) =>
      item.label.toLowerCase().includes(normalized) ||
      item.description.toLowerCase().includes(normalized) ||
      item.group.toLowerCase().includes(normalized) ||
      item.keywords.some((keyword) => keyword.includes(normalized)),
  );
}
