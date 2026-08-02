import {
  Activity,
  ArrowDownUp,
  BarChart3,
  Bell,
  Bot,
  Building2,
  CalendarDays,
  ChefHat,
  ClipboardList,
  CreditCard,
  FileText,
  Flag,
  FolderOpen,
  Globe,
  HardDrive,
  HeartHandshake,
  Languages,
  LayoutDashboard,
  MessageSquare,
  Package,
  QrCode,
  Receipt,
  Rocket,
  ScrollText,
  Search,
  Settings,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Store,
  Table2,
  Tags,
  TrendingUp,
  UserPlus,
  Users,
  UtensilsCrossed,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { ROUTES } from "@/constants/routes";
import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { AI_PLATFORM_ROUTES } from "@/modules/ai-platform/constants/ai-platform";
import { AI_AGENTS_ROUTES } from "@/modules/ai-agents/constants/routes";
import { AI_AUTOMATION_ROUTES } from "@/modules/ai-automation/constants/routes";
import { AI_KNOWLEDGE_ROUTES } from "@/modules/ai-knowledge/constants/routes";
import { API_GATEWAY_ROUTES } from "@/modules/api-gateway/constants/routes";
import { BACKUP_PLATFORM_ROUTES } from "@/modules/backup-platform/constants/routes";
import { BRANCH_ROUTES } from "@/modules/branches/constants/routes";
import { BUSINESS_ROUTES } from "@/modules/business/constants/routes";
import { COMMERCIAL_PLATFORM_ROUTES } from "@/modules/commercial-platform/constants/commercial-platform";
import { COMMERCIAL_ROUTES } from "@/modules/commercial/constants/routes";
import { COMMUNICATION_ROUTES } from "@/modules/communication/constants/routes";
import { CONTRACTS_ROUTES } from "@/modules/contracts/constants/routes";
import { CRM_ROUTES } from "@/modules/crm/constants/routes";
import { CUSTOMER_SUCCESS_ROUTES } from "@/modules/customer-success/constants/routes";
import { FEATURE_FLAGS_ROUTES } from "@/modules/feature-flags/constants/routes";
import { FILE_PLATFORM_ROUTES } from "@/modules/file-platform/constants/routes";
import { IAM_ROUTES } from "@/modules/iam/constants/routes";
import { IMPLEMENTATION_ROUTES } from "@/modules/implementation/constants/routes";
import { IMPORT_EXPORT_PLATFORM_ROUTES } from "@/modules/import-export-platform/constants/routes";
import { INVENTORY_ROUTES } from "@/modules/inventory/constants/routes";
import { KITCHEN_ROUTES } from "@/modules/kitchen/constants/routes";
import { LOCALIZATION_PLATFORM_ROUTES } from "@/modules/localization-platform/constants/routes";
import { MARKETPLACE_PLATFORM_ROUTES } from "@/modules/marketplace-platform/constants/marketplace-platform";
import { MARKETPLACE_ROUTES } from "@/modules/marketplace/constants/routes";
import { MENU_ROUTES } from "@/modules/menu/constants/routes";
import { MONITORING_PLATFORM_ROUTES } from "@/modules/monitoring-platform/constants/routes";
import { NOTIFICATIONS_ROUTES } from "@/modules/notifications/constants/routes";
import { PAYMENT_ROUTES } from "@/modules/payments/constants/routes";
import { POS_ROUTES } from "@/modules/pos/constants/routes";
import { QR_MENU_ROUTES } from "@/modules/qr-menu/constants/routes";
import { QUOTES_ROUTES } from "@/modules/quotes/constants/routes";
import { RECEIPT_ROUTES } from "@/modules/receipts/constants/routes";
import { REPORTING_ROUTES } from "@/modules/reporting/constants/routes";
import { RESERVATION_ROUTES } from "@/modules/reservations/constants/routes";
import { RESTAURANT_OPERATIONS_ROUTES } from "@/modules/restaurant-operations/constants/restaurant-operations";
import { REVOPS_ROUTES } from "@/modules/revops/constants/routes";
import { SALES_CRM_ROUTES } from "@/modules/sales-crm/constants/routes";
import { SEARCH_PLATFORM_ROUTES } from "@/modules/search-platform/constants/routes";
import { SETTINGS_ENGINE_ROUTES } from "@/modules/settings-engine/constants/routes";
import { STAFF_ROUTES } from "@/modules/staff/constants/routes";
import { TABLE_ROUTES } from "@/modules/tables/constants/routes";
import { TENANT_PLATFORM_ROUTES } from "@/modules/tenant-platform/constants/routes";
import type {
  DashboardNavGroup,
  DashboardNavItem,
  DashboardQuickAction,
  DashboardWidgetDefinition,
} from "@/modules/dashboard/types/dashboard";

export type {
  DashboardNavItem,
  DashboardNavGroup,
  DashboardQuickAction,
  DashboardWidgetDefinition,
};

const pluginNavGroups: DashboardNavGroup[] = [];

export function registerDashboardNavGroup(group: DashboardNavGroup): void {
  pluginNavGroups.push(group);
}

export function registerDashboardNavItem(groupId: string, item: DashboardNavItem): void {
  const group = pluginNavGroups.find((entry) => entry.id === groupId);

  if (group) {
    group.items.push(item);
    return;
  }

  pluginNavGroups.push({
    id: groupId,
    name: groupId,
    items: [item],
    defaultOpen: false,
  });
}

export const DASHBOARD_NAV_GROUPS: DashboardNavGroup[] = [
  {
    id: "overview",
    name: "Overview",
    icon: LayoutDashboard,
    defaultOpen: true,
    items: [
      {
        id: "dashboard",
        name: "Dashboard",
        href: ROUTES.dashboard,
        icon: LayoutDashboard,
      },
    ],
  },
  {
    id: "business",
    name: "Business",
    icon: Store,
    defaultOpen: true,
    items: [
      {
        id: "business-overview",
        name: "Business",
        href: BUSINESS_ROUTES.overview,
        icon: Store,
        permission: PERMISSION_CODES.BUSINESS_VIEW,
      },
      {
        id: "branches",
        name: "Branches",
        href: BRANCH_ROUTES.overview,
        icon: Building2,
        permission: PERMISSION_CODES.BRANCH_VIEW,
      },
      {
        id: "staff",
        name: "Staff",
        href: STAFF_ROUTES.overview,
        icon: ClipboardList,
        permission: PERMISSION_CODES.STAFF_VIEW,
      },
      {
        id: "customers",
        name: "Customers",
        href: CRM_ROUTES.overview,
        icon: Users,
        permission: PERMISSION_CODES.CRM_VIEW,
      },
    ],
  },
  {
    id: "restaurant",
    name: "Restaurant",
    icon: UtensilsCrossed,
    defaultOpen: true,
    items: [
      {
        id: "restaurant-operations",
        name: "Operations",
        href: RESTAURANT_OPERATIONS_ROUTES.overview,
        icon: ClipboardList,
      },
      {
        id: "menu",
        name: "Menu",
        href: MENU_ROUTES.overview,
        icon: UtensilsCrossed,
        permission: PERMISSION_CODES.MENU_VIEW,
      },
      {
        id: "reservations",
        name: "Reservations",
        href: RESERVATION_ROUTES.overview,
        icon: CalendarDays,
        permission: PERMISSION_CODES.RESERVATION_VIEW,
      },
      {
        id: "tables",
        name: "Tables",
        href: TABLE_ROUTES.overview,
        icon: Table2,
        permission: PERMISSION_CODES.TABLE_MANAGE,
      },
      {
        id: "qr-menu",
        name: "QR Menu",
        href: QR_MENU_ROUTES.overview,
        icon: QrCode,
        permission: PERMISSION_CODES.QR_MANAGE,
      },
      {
        id: "kitchen",
        name: "Kitchen",
        href: KITCHEN_ROUTES.overview,
        icon: ChefHat,
        permission: PERMISSION_CODES.KITCHEN_VIEW,
      },
      {
        id: "orders",
        name: "Orders",
        href: RESTAURANT_OPERATIONS_ROUTES.orders,
        icon: ShoppingCart,
        permission: PERMISSION_CODES.ORDER_VIEW,
      },
      {
        id: "pos",
        name: "POS",
        href: POS_ROUTES.overview,
        icon: Wallet,
        permission: PERMISSION_CODES.POS_USE,
        featureFlag: "pos.new_checkout",
      },
      {
        id: "payments",
        name: "Payments",
        href: PAYMENT_ROUTES.overview,
        icon: CreditCard,
        permission: PERMISSION_CODES.PAYMENT_CREATE,
      },
      {
        id: "receipts",
        name: "Receipts",
        href: RECEIPT_ROUTES.overview,
        icon: Receipt,
        permission: PERMISSION_CODES.RECEIPT_VIEW,
      },
      {
        id: "inventory",
        name: "Inventory",
        href: INVENTORY_ROUTES.overview,
        icon: Package,
        permission: PERMISSION_CODES.INVENTORY_VIEW,
        featureFlag: "inventory.auto_reorder",
      },
    ],
  },
  {
    id: "commercial",
    name: "Commercial",
    icon: Tags,
    items: [
      {
        id: "commercial-platform",
        name: "Platform",
        href: COMMERCIAL_PLATFORM_ROUTES.overview,
        icon: Tags,
      },
      {
        id: "commercial-catalogue",
        name: "Catalogue",
        href: COMMERCIAL_ROUTES.overview,
        icon: Tags,
        permission: PERMISSION_CODES.COMMERCIAL_VIEW,
      },
      {
        id: "sales-crm",
        name: "Sales CRM",
        href: SALES_CRM_ROUTES.overview,
        icon: TrendingUp,
        permission: PERMISSION_CODES.SALES_VIEW,
      },
      {
        id: "quotes",
        name: "Quotes",
        href: QUOTES_ROUTES.overview,
        icon: FileText,
        permission: PERMISSION_CODES.QUOTES_VIEW,
      },
      {
        id: "contracts",
        name: "Contracts",
        href: CONTRACTS_ROUTES.overview,
        icon: ScrollText,
        permission: PERMISSION_CODES.CONTRACTS_VIEW,
      },
      {
        id: "implementation",
        name: "Implementation",
        href: IMPLEMENTATION_ROUTES.overview,
        icon: Rocket,
        permission: PERMISSION_CODES.IMPLEMENTATION_VIEW,
      },
      {
        id: "customer-success",
        name: "Customer Success",
        href: CUSTOMER_SUCCESS_ROUTES.overview,
        icon: HeartHandshake,
        permission: PERMISSION_CODES.SUCCESS_VIEW,
      },
      {
        id: "revops",
        name: "RevOps",
        href: REVOPS_ROUTES.overview,
        icon: Wallet,
        permission: PERMISSION_CODES.REVENUE_VIEW,
      },
    ],
  },
  {
    id: "ai",
    name: "AI",
    icon: Bot,
    items: [
      {
        id: "ai-platform",
        name: "Platform",
        href: AI_PLATFORM_ROUTES.overview,
        icon: Bot,
      },
      {
        id: "ai-knowledge",
        name: "Knowledge",
        href: AI_KNOWLEDGE_ROUTES.overview,
        icon: Bot,
        permission: PERMISSION_CODES.AI_KNOWLEDGE_VIEW,
      },
      {
        id: "ai-agents",
        name: "Agents",
        href: AI_AGENTS_ROUTES.overview,
        icon: Sparkles,
        permission: PERMISSION_CODES.AI_AGENT_VIEW,
      },
      {
        id: "ai-automation",
        name: "Automations",
        href: AI_AUTOMATION_ROUTES.overview,
        icon: Zap,
        permission: PERMISSION_CODES.AI_AUTOMATION_VIEW,
        featureFlag: "ai.automation.enabled",
      },
    ],
  },
  {
    id: "marketplace",
    name: "Marketplace",
    icon: ShoppingBag,
    items: [
      {
        id: "marketplace-platform",
        name: "Platform",
        href: MARKETPLACE_PLATFORM_ROUTES.overview,
        icon: ShoppingBag,
        featureFlag: "marketplace.beta_catalog",
      },
      {
        id: "marketplace",
        name: "Marketplace",
        href: MARKETPLACE_ROUTES.overview,
        icon: ShoppingBag,
        permission: PERMISSION_CODES.MARKETPLACE_VIEW,
        featureFlag: "marketplace.beta_catalog",
      },
    ],
  },
  {
    id: "platform",
    name: "Platform",
    icon: Shield,
    items: [
      {
        id: "iam",
        name: "IAM",
        href: IAM_ROUTES.overview,
        icon: Shield,
        permission: PERMISSION_CODES.IAM_VIEW,
      },
      {
        id: "notifications",
        name: "Notifications",
        href: NOTIFICATIONS_ROUTES.overview,
        icon: Bell,
        permission: PERMISSION_CODES.NOTIFICATIONS_VIEW,
      },
      {
        id: "communication",
        name: "Communication",
        href: COMMUNICATION_ROUTES.overview,
        icon: MessageSquare,
        permission: PERMISSION_CODES.COMMUNICATION_VIEW,
        featureFlag: "communication.omnichannel_v2",
      },
      {
        id: "files",
        name: "Files",
        href: FILE_PLATFORM_ROUTES.overview,
        icon: FolderOpen,
        permission: PERMISSION_CODES.FILES_VIEW,
      },
      {
        id: "search",
        name: "Search",
        href: SEARCH_PLATFORM_ROUTES.overview,
        icon: Search,
        permission: PERMISSION_CODES.SEARCH_VIEW,
        featureFlag: "search.semantic_preview",
      },
      {
        id: "analytics",
        name: "Analytics",
        href: REPORTING_ROUTES.overview,
        icon: BarChart3,
        permission: PERMISSION_CODES.ANALYTICS_VIEW,
        featureFlag: "reporting.realtime_dashboard",
      },
      {
        id: "feature-flags",
        name: "Feature Flags",
        href: FEATURE_FLAGS_ROUTES.overview,
        icon: Flag,
        permission: PERMISSION_CODES.FEATURE_FLAGS_VIEW,
      },
      {
        id: "api-gateway",
        name: "API Gateway",
        href: API_GATEWAY_ROUTES.overview,
        icon: Globe,
        permission: PERMISSION_CODES.API_GATEWAY_VIEW,
      },
      {
        id: "monitoring",
        name: "Monitoring",
        href: MONITORING_PLATFORM_ROUTES.overview,
        icon: Activity,
        permission: PERMISSION_CODES.MONITORING_PLATFORM_VIEW,
      },
      {
        id: "backup",
        name: "Backup & DR",
        href: BACKUP_PLATFORM_ROUTES.overview,
        icon: HardDrive,
        permission: PERMISSION_CODES.BACKUP_PLATFORM_VIEW,
      },
      {
        id: "localization",
        name: "Localization",
        href: LOCALIZATION_PLATFORM_ROUTES.overview,
        icon: Languages,
        permission: PERMISSION_CODES.LOCALIZATION_PLATFORM_VIEW,
      },
      {
        id: "import-export",
        name: "Import & Export",
        href: IMPORT_EXPORT_PLATFORM_ROUTES.overview,
        icon: ArrowDownUp,
        permission: PERMISSION_CODES.IMPORT_EXPORT_PLATFORM_VIEW,
      },
      {
        id: "tenant-admin",
        name: "Tenant Admin",
        href: TENANT_PLATFORM_ROUTES.overview,
        icon: Building2,
        permission: PERMISSION_CODES.TENANT_PLATFORM_VIEW,
        tenantAdmin: true,
      },
    ],
  },
  {
    id: "settings",
    name: "Settings",
    icon: Settings,
    items: [
      {
        id: "settings",
        name: "Settings",
        href: SETTINGS_ENGINE_ROUTES.overview,
        icon: Settings,
        permission: PERMISSION_CODES.SETTINGS_VIEW,
      },
    ],
  },
];

export function getDashboardNavGroups(): DashboardNavGroup[] {
  return [...DASHBOARD_NAV_GROUPS, ...pluginNavGroups];
}

/** @deprecated Use getDashboardNavGroups() — kept for backward compatibility */
export const DASHBOARD_NAVIGATION: Array<{
  name: string;
  icon: LucideIcon;
  href?: string;
}> = getDashboardNavGroups().flatMap((group) =>
  group.items.flatMap((item) => [
    { name: item.name, icon: item.icon, href: item.href },
    ...(item.children?.map((child) => ({
      name: child.name,
      icon: child.icon,
      href: child.href,
    })) ?? []),
  ]),
);

export const DASHBOARD_QUICK_ACTIONS: DashboardQuickAction[] = [
  {
    id: "new-order",
    label: "New Order",
    href: POS_ROUTES.overview,
    icon: ShoppingCart,
    permission: PERMISSION_CODES.POS_USE,
  },
  {
    id: "add-customer",
    label: "Add Customer",
    href: CRM_ROUTES.overview,
    icon: UserPlus,
    permission: PERMISSION_CODES.CRM_MANAGE,
  },
  {
    id: "new-reservation",
    label: "New Reservation",
    href: RESERVATION_ROUTES.overview,
    icon: CalendarDays,
    permission: PERMISSION_CODES.RESERVATION_MANAGE,
  },
  {
    id: "ask-ai",
    label: "Ask Busal AI",
    href: AI_PLATFORM_ROUTES.assistant,
    icon: Bot,
    permission: PERMISSION_CODES.AI_KNOWLEDGE_VIEW,
  },
];

export const DASHBOARD_WIDGETS: DashboardWidgetDefinition[] = [
  { id: "business-overview", title: "Business Overview", span: 2 },
  { id: "today-revenue", title: "Today's Revenue", permission: PERMISSION_CODES.ANALYTICS_VIEW },
  { id: "orders", title: "Orders", permission: PERMISSION_CODES.ORDER_VIEW },
  { id: "reservations", title: "Reservations", permission: PERMISSION_CODES.RESERVATION_VIEW },
  { id: "customers", title: "Customers", permission: PERMISSION_CODES.CRM_VIEW },
  { id: "staff-online", title: "Staff Online", permission: PERMISSION_CODES.STAFF_VIEW },
  {
    id: "inventory-alerts",
    title: "Inventory Alerts",
    permission: PERMISSION_CODES.INVENTORY_VIEW,
  },
  { id: "recent-activity", title: "Recent Activity", span: 2, lazy: true },
  { id: "quick-actions", title: "Quick Actions", span: 2 },
  { id: "pinned-modules", title: "Pinned Modules", span: 2 },
  { id: "ai-insights", title: "AI Insights", span: 2, lazy: true },
  {
    id: "recent-notifications",
    title: "Recent Notifications",
    permission: PERMISSION_CODES.NOTIFICATIONS_VIEW,
    lazy: true,
  },
  {
    id: "upcoming-tasks",
    title: "Upcoming Tasks",
    permission: PERMISSION_CODES.SUCCESS_VIEW,
    lazy: true,
  },
];

export const DASHBOARD_PINNED_MODULES = [
  { id: "pos", label: "POS", href: POS_ROUTES.overview, icon: Wallet },
  { id: "kitchen", label: "Kitchen", href: KITCHEN_ROUTES.overview, icon: ChefHat },
  { id: "crm", label: "CRM", href: CRM_ROUTES.overview, icon: Users },
  { id: "analytics", label: "Analytics", href: REPORTING_ROUTES.overview, icon: BarChart3 },
] as const;
