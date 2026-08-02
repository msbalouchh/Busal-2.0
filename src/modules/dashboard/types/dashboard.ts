import type { LucideIcon } from "lucide-react";

import type { PermissionCode } from "@/modules/authorization/types/authorization";

export interface DashboardNavItem {
  id: string;
  name: string;
  icon: LucideIcon;
  href?: string;
  permission?: PermissionCode;
  permissions?: PermissionCode[];
  requireAllPermissions?: boolean;
  featureFlag?: string;
  ownerOnly?: boolean;
  tenantAdmin?: boolean;
  badge?: string;
  children?: DashboardNavItem[];
}

export interface DashboardNavGroup {
  id: string;
  name: string;
  icon?: LucideIcon;
  items: DashboardNavItem[];
  defaultOpen?: boolean;
}

export interface DashboardQuickAction {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: PermissionCode;
  featureFlag?: string;
}

export interface DashboardWidgetDefinition {
  id: string;
  title: string;
  description?: string;
  span?: 1 | 2 | 3;
  permission?: PermissionCode;
  featureFlag?: string;
  lazy?: boolean;
}

export interface ClientDashboardContext {
  permissions: PermissionCode[];
  featureFlags: Record<string, boolean>;
  isOwner: boolean;
  unreadNotifications: number;
}

export interface DashboardHomeStats {
  businessName: string;
  todayRevenuePence: number;
  todayOrders: number;
  todayReservations: number;
  totalCustomers: number;
  staffOnline: number;
  inventoryAlerts: number;
  unreadNotifications: number;
}

export interface DashboardActivityItem {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  href?: string;
}

export interface DashboardHomeData {
  stats: DashboardHomeStats;
  recentActivity: DashboardActivityItem[];
  recentNotifications: Array<{
    id: string;
    title: string;
    body: string;
    createdAt: string;
    status: string;
  }>;
  upcomingTasks: Array<{
    id: string;
    title: string;
    dueDate: string | null;
    status: string;
  }>;
}
