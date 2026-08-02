import type { LucideIcon } from "lucide-react";

export interface ControlCenterNavItem {
  id: string;
  name: string;
  href: string;
  icon?: LucideIcon;
  permission?: string;
  featureFlag?: string;
  badge?: string;
  children?: ControlCenterNavItem[];
}

export interface ControlCenterNavGroup {
  id: string;
  name: string;
  icon?: LucideIcon;
  items: ControlCenterNavItem[];
  defaultOpen?: boolean;
}

export interface ControlCenterQuickAction {
  id: string;
  label: string;
  href: string;
  permission?: string;
  featureFlag?: string;
}

export interface ControlCenterWidgetDefinition {
  id: string;
  title: string;
  span?: 1 | 2 | 3 | 4;
  permission?: string;
  featureFlag?: string;
  lazy?: boolean;
}

export interface ControlCenterOperatorContext {
  userId: string;
  email: string;
  fullName: string;
  permissions: string[];
  environment: string;
  isOperator: boolean;
}

export interface ControlCenterDashboardWidgets {
  totalTenants: number;
  activeBusinesses: number;
  mrrPence: number;
  arrPence: number;
  platformRevenuePence: number;
  aiTokensUsed: number;
  apiRequests: number;
  storageUsageBytes: number;
  platformHealthScore: number;
  activeIncidents: number;
  marketplaceInstalls: number;
  systemAlerts: number;
  recentSignups: number;
  supportQueue: number;
}

export interface ControlCenterActivityItem {
  id: string;
  title: string;
  description: string;
  category: string;
  createdAt: string;
}

export interface ControlCenterTenantSummary {
  id: string;
  businessName: string;
  lifecycleStatus: string;
  healthStatus: string;
  subscriptionPlan: string | null;
  createdAt: string;
}

export interface ControlCenterIncidentItem {
  id: string;
  title: string;
  severity: string;
  status: string;
  createdAt: string;
}

export interface ControlCenterAlertItem {
  id: string;
  title: string;
  severity: string;
  status: string;
  createdAt: string;
}

export interface ControlCenterDeploymentItem {
  id: string;
  title: string;
  environment: string;
  status: string;
  createdAt: string;
}

export interface ControlCenterPlatformBundle {
  widgets: ControlCenterDashboardWidgets;
  activity: ControlCenterActivityItem[];
  tenantSummaries: ControlCenterTenantSummary[];
  incidents: ControlCenterIncidentItem[];
  alerts: ControlCenterAlertItem[];
  deployments: ControlCenterDeploymentItem[];
}

export interface ClientControlCenterContext {
  permissions: string[];
  featureFlags: Record<string, boolean>;
  environment: string;
  operatorEmail: string;
  openAlerts?: number;
}
