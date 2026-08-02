export {
  DashboardProvider,
  useDashboardContext,
} from "@/modules/dashboard/components/dashboard-provider";
export { DashboardHome } from "@/modules/dashboard/components/dashboard-home";
export {
  DASHBOARD_NAV_GROUPS,
  DASHBOARD_QUICK_ACTIONS,
  DASHBOARD_WIDGETS,
  getDashboardNavGroups,
  registerDashboardNavGroup,
  registerDashboardNavItem,
} from "@/modules/dashboard/constants/navigation";
export { filterDashboardNavigation } from "@/modules/dashboard/lib/filter-navigation";
export { getDashboardContext } from "@/modules/dashboard/lib/get-dashboard-context";
export { getDashboardShellContext } from "@/modules/dashboard/lib/get-dashboard-shell-context";
export { getDashboardHomeData } from "@/modules/dashboard/lib/get-dashboard-home-data";
export type {
  ClientDashboardContext,
  DashboardHomeData,
  DashboardNavGroup,
  DashboardNavItem,
  DashboardWidgetDefinition,
} from "@/modules/dashboard/types/dashboard";
