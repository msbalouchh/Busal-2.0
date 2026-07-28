import {
  BarChart3,
  Bot,
  CalendarDays,
  ChefHat,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  Package,
  QrCode,
  Receipt,
  Settings,
  ShoppingCart,
  Store,
  Table2,
  Tags,
  Users,
  UtensilsCrossed,
  Wallet,
  Zap,
  FileText,
  ScrollText,
  TrendingUp,
  HeartHandshake,
  Rocket,
  Shield,
  ShoppingBag,
  Bell,
  MessageSquare,
  FolderOpen,
  Search,
  Flag,
  Globe,
  Activity,
  HardDrive,
  Languages,
  ArrowDownUp,
  Building2,
  type LucideIcon,
} from "lucide-react";

import { ROUTES } from "@/constants/routes";
import { BUSINESS_ROUTES } from "@/modules/business/constants/routes";
import { KITCHEN_ROUTES } from "@/modules/kitchen/constants/routes";
import { MENU_ROUTES } from "@/modules/menu/constants/routes";
import { PAYMENT_ROUTES } from "@/modules/payments/constants/routes";
import { POS_ROUTES } from "@/modules/pos/constants/routes";
import { BRANCH_ROUTES } from "@/modules/branches/constants/routes";
import { COMMERCIAL_ROUTES } from "@/modules/commercial/constants/routes";
import { CRM_ROUTES } from "@/modules/crm/constants/routes";
import { SALES_CRM_ROUTES } from "@/modules/sales-crm/constants/routes";
import { QUOTES_ROUTES } from "@/modules/quotes/constants/routes";
import { CONTRACTS_ROUTES } from "@/modules/contracts/constants/routes";
import { IMPLEMENTATION_ROUTES } from "@/modules/implementation/constants/routes";
import { CUSTOMER_SUCCESS_ROUTES } from "@/modules/customer-success/constants/routes";
import { REVOPS_ROUTES } from "@/modules/revops/constants/routes";
import { AI_KNOWLEDGE_ROUTES } from "@/modules/ai-knowledge/constants/routes";
import { AI_AUTOMATION_ROUTES } from "@/modules/ai-automation/constants/routes";
import { AI_AGENTS_ROUTES } from "@/modules/ai-agents/constants/routes";
import { MARKETPLACE_ROUTES } from "@/modules/marketplace/constants/routes";
import { IAM_ROUTES } from "@/modules/iam/constants/routes";
import { COMMUNICATION_ROUTES } from "@/modules/communication/constants/routes";
import { FILE_PLATFORM_ROUTES } from "@/modules/file-platform/constants/routes";
import { SEARCH_PLATFORM_ROUTES } from "@/modules/search-platform/constants/routes";
import { SETTINGS_ENGINE_ROUTES } from "@/modules/settings-engine/constants/routes";
import { FEATURE_FLAGS_ROUTES } from "@/modules/feature-flags/constants/routes";
import { API_GATEWAY_ROUTES } from "@/modules/api-gateway/constants/routes";
import { MONITORING_PLATFORM_ROUTES } from "@/modules/monitoring-platform/constants/routes";
import { BACKUP_PLATFORM_ROUTES } from "@/modules/backup-platform/constants/routes";
import { LOCALIZATION_PLATFORM_ROUTES } from "@/modules/localization-platform/constants/routes";
import { IMPORT_EXPORT_PLATFORM_ROUTES } from "@/modules/import-export-platform/constants/routes";
import { TENANT_PLATFORM_ROUTES } from "@/modules/tenant-platform/constants/routes";
import { NOTIFICATIONS_ROUTES } from "@/modules/notifications/constants/routes";
import { INVENTORY_ROUTES } from "@/modules/inventory/constants/routes";
import { REPORTING_ROUTES } from "@/modules/reporting/constants/routes";
import { QR_MENU_ROUTES } from "@/modules/qr-menu/constants/routes";
import { RECEIPT_ROUTES } from "@/modules/receipts/constants/routes";
import { RESERVATION_ROUTES } from "@/modules/reservations/constants/routes";
import { STAFF_ROUTES } from "@/modules/staff/constants/routes";
import { TABLE_ROUTES } from "@/modules/tables/constants/routes";

export interface DashboardNavItem {
  name: string;
  icon: LucideIcon;
  href?: string;
}

export const DASHBOARD_NAVIGATION: DashboardNavItem[] = [
  { name: "Dashboard", href: ROUTES.dashboard, icon: LayoutDashboard },
  { name: "Business", href: BUSINESS_ROUTES.overview, icon: Store },
  { name: "Branches", href: BRANCH_ROUTES.overview, icon: Store },
  { name: "Customers", href: CRM_ROUTES.overview, icon: Users },
  { name: "Staff", href: STAFF_ROUTES.overview, icon: ClipboardList },
  { name: "Menu", href: MENU_ROUTES.overview, icon: UtensilsCrossed },
  { name: "Reservations", href: RESERVATION_ROUTES.overview, icon: CalendarDays },
  { name: "Tables", href: TABLE_ROUTES.overview, icon: Table2 },
  { name: "QR Menu", href: QR_MENU_ROUTES.overview, icon: QrCode },
  { name: "Kitchen", href: KITCHEN_ROUTES.overview, icon: ChefHat },
  { name: "Orders", icon: ShoppingCart },
  { name: "POS", href: POS_ROUTES.overview, icon: Wallet },
  { name: "Payments", href: PAYMENT_ROUTES.overview, icon: CreditCard },
  { name: "Receipts", href: RECEIPT_ROUTES.overview, icon: Receipt },
  { name: "Inventory", href: INVENTORY_ROUTES.overview, icon: Package },
  { name: "Commercial", href: COMMERCIAL_ROUTES.overview, icon: Tags },
  { name: "Sales CRM", href: SALES_CRM_ROUTES.overview, icon: TrendingUp },
  { name: "Quotes", href: QUOTES_ROUTES.overview, icon: FileText },
  { name: "Contracts", href: CONTRACTS_ROUTES.overview, icon: ScrollText },
  { name: "Implementation", href: IMPLEMENTATION_ROUTES.overview, icon: Rocket },
  { name: "Customer Success", href: CUSTOMER_SUCCESS_ROUTES.overview, icon: HeartHandshake },
  { name: "RevOps", href: REVOPS_ROUTES.overview, icon: Wallet },
  { name: "Busal AI", href: AI_KNOWLEDGE_ROUTES.overview, icon: Bot },
  { name: "AI Agents", href: AI_AGENTS_ROUTES.overview, icon: Bot },
  { name: "Automations", href: AI_AUTOMATION_ROUTES.overview, icon: Zap },
  { name: "Marketplace", href: MARKETPLACE_ROUTES.overview, icon: ShoppingBag },
  { name: "IAM", href: IAM_ROUTES.overview, icon: Shield },
  { name: "Notifications", href: NOTIFICATIONS_ROUTES.overview, icon: Bell },
  { name: "Communication", href: COMMUNICATION_ROUTES.overview, icon: MessageSquare },
  { name: "Files", href: FILE_PLATFORM_ROUTES.overview, icon: FolderOpen },
  { name: "Search", href: SEARCH_PLATFORM_ROUTES.overview, icon: Search },
  { name: "Analytics", href: REPORTING_ROUTES.overview, icon: BarChart3 },
  { name: "Settings", href: SETTINGS_ENGINE_ROUTES.overview, icon: Settings },
  { name: "Feature Flags", href: FEATURE_FLAGS_ROUTES.overview, icon: Flag },
  { name: "API Gateway", href: API_GATEWAY_ROUTES.overview, icon: Globe },
  { name: "Monitoring", href: MONITORING_PLATFORM_ROUTES.overview, icon: Activity },
  { name: "Backup & DR", href: BACKUP_PLATFORM_ROUTES.overview, icon: HardDrive },
  { name: "Localization", href: LOCALIZATION_PLATFORM_ROUTES.overview, icon: Languages },
  { name: "Import & Export", href: IMPORT_EXPORT_PLATFORM_ROUTES.overview, icon: ArrowDownUp },
  { name: "Tenant Admin", href: TENANT_PLATFORM_ROUTES.overview, icon: Building2 },
];

export const DASHBOARD_QUICK_ACTIONS = [
  "New Order",
  "Add Customer",
  "New Reservation",
  "Ask Busal AI",
] as const;

export const DASHBOARD_WIDGETS = [
  "Today's Orders",
  "Today's Revenue",
  "Reservations",
  "Customers",
  "Staff",
  "Recent Activity",
] as const;
