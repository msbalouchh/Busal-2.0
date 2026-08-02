"use client";

import Link from "next/link";
import {
  BookOpen,
  BarChart3,
  Bot,
  CalendarDays,
  ChefHat,
  ClipboardList,
  CreditCard,
  Grid3X3,
  Package,
  Palette,
  QrCode,
  Settings2,
  SlidersHorizontal,
  Users,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RestaurantFeatureToggleCards } from "@/modules/restaurant-management/components/restaurant-feature-toggle-cards";
import { RestaurantStatusCard } from "@/modules/restaurant-management/components/restaurant-status-card";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";
import { MENU_MANAGEMENT_ROUTES } from "@/modules/menu-management/constants/routes";
import { FLOOR_TABLE_MANAGEMENT_ROUTES } from "@/modules/floor-table-management/constants/routes";
import { KITCHEN_DISPLAY_ROUTES } from "@/modules/kitchen-display-management/constants/routes";
import { PAYMENT_RECEIPT_ROUTES } from "@/modules/payment-receipt-management/constants/routes";
import { CUSTOMER_CRM_ROUTES } from "@/modules/customer-crm-management/constants/routes";
import { INVENTORY_SUPPLIER_ROUTES } from "@/modules/inventory-supplier-management/constants/routes";
import { RESTAURANT_ANALYTICS_ROUTES } from "@/modules/restaurant-analytics-management/constants/routes";
import { AI_RESTAURANT_ASSISTANT_ROUTES } from "@/modules/ai-restaurant-assistant-management/constants/routes";
import { QR_ORDERING_ROUTES } from "@/modules/qr-ordering-management/constants/routes";
import { ORDER_MANAGEMENT_ROUTES } from "@/modules/order-management/constants/routes";
import { RESERVATION_MANAGEMENT_ROUTES } from "@/modules/reservation-management/constants/routes";
import type { RestaurantManagementContext } from "@/modules/restaurant-management/lib/get-restaurant-management-context";

interface RestaurantDashboardPanelProps {
  context: RestaurantManagementContext;
}

const quickLinks = [
  {
    href: MENU_MANAGEMENT_ROUTES.list,
    label: "Menu Management",
    description: "Create menus, set availability, and assign branches.",
    icon: BookOpen,
  },
  {
    href: FLOOR_TABLE_MANAGEMENT_ROUTES.floorList(),
    label: "Floors & Tables",
    description: "Design floor plans, manage tables, and seating capacity.",
    icon: Grid3X3,
  },
  {
    href: RESERVATION_MANAGEMENT_ROUTES.list(),
    label: "Reservations",
    description: "Manage guest bookings, table assignments, and seating flow.",
    icon: CalendarDays,
  },
  {
    href: ORDER_MANAGEMENT_ROUTES.list(),
    label: "Orders",
    description: "Create and manage dine-in, takeaway, and delivery orders.",
    icon: ClipboardList,
  },
  {
    href: KITCHEN_DISPLAY_ROUTES.dashboard(),
    label: "Kitchen Display",
    description: "Real-time kitchen queue, station routing, and preparation workflow.",
    icon: ChefHat,
  },
  {
    href: QR_ORDERING_ROUTES.dashboard(),
    label: "QR Ordering",
    description: "Table QR codes, customer mobile menu, and scan-to-order sessions.",
    icon: QrCode,
  },
  {
    href: PAYMENT_RECEIPT_ROUTES.dashboard(),
    label: "Payments & Receipts",
    description: "Take payments, split bills, refunds, and printable receipts.",
    icon: CreditCard,
  },
  {
    href: CUSTOMER_CRM_ROUTES.dashboard(),
    label: "Customer CRM & Loyalty",
    description: "Customer profiles, order history, addresses, and loyalty points.",
    icon: Users,
  },
  {
    href: INVENTORY_SUPPLIER_ROUTES.dashboard(),
    label: "Inventory & Suppliers",
    description: "Stock items, suppliers, purchase orders, adjustments, and low-stock alerts.",
    icon: Package,
  },
  {
    href: RESTAURANT_ANALYTICS_ROUTES.dashboard(),
    label: "Analytics & Reporting",
    description: "Sales, orders, payments, inventory, customer, and staff performance insights.",
    icon: BarChart3,
  },
  {
    href: AI_RESTAURANT_ASSISTANT_ROUTES.dashboard(),
    label: "AI Assistant",
    description: "Chat, recommendations, and business health insights across your restaurant OS.",
    icon: Bot,
  },
  {
    href: RESTAURANT_MANAGEMENT_ROUTES.settings,
    label: "Restaurant Settings",
    description: "Compliance, tax, default branch, and registration details.",
    icon: Settings2,
  },
  {
    href: RESTAURANT_MANAGEMENT_ROUTES.branding,
    label: "Restaurant Branding",
    description: "Logo, colours, receipt footer, and social links.",
    icon: Palette,
  },
  {
    href: RESTAURANT_MANAGEMENT_ROUTES.preferences,
    label: "Restaurant Preferences",
    description: "Service modes, reservations, and service charge.",
    icon: SlidersHorizontal,
  },
];

export function RestaurantDashboardPanel({ context }: RestaurantDashboardPanelProps) {
  const { bundle, permissionsFlags } = context;

  return (
    <div className="space-y-8">
      <RestaurantStatusCard bundle={bundle} />

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Feature capabilities</h2>
          <p className="text-muted-foreground text-sm">
            Enable restaurant sub-systems. Downstream modules (Menu, POS, Kitchen, etc.) will
            respect these toggles.
          </p>
        </div>
        <RestaurantFeatureToggleCards
          settings={bundle.settings}
          disabled={!permissionsFlags.canUpdate || !bundle.moduleEnabled}
        />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Configuration</h2>
          <p className="text-muted-foreground text-sm">Manage restaurant foundation settings.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href} className="group block">
              <Card className="h-full rounded-xl shadow-sm transition-shadow group-hover:shadow-md">
                <CardHeader>
                  <link.icon className="text-primary mb-2 h-5 w-5" aria-hidden="true" />
                  <CardTitle className="text-base">{link.label}</CardTitle>
                  <CardDescription>{link.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="text-primary text-sm font-medium">Open →</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
