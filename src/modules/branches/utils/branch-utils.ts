import { formatMoneyPence } from "@/modules/payments/utils/currency";
import type { BranchDashboard, CentralBranchDashboard } from "@/services/branch.service";

export function formatBranchMoney(pence: number): string {
  return formatMoneyPence(pence);
}

export interface CentralBranchDashboardView {
  totalBranches: number;
  totalStaff: number;
  todayOrders: number;
  todayRevenuePence: number;
  branches: Array<{
    id: string;
    name: string;
    isMain: boolean;
    staffCount: number;
    todayOrders: number;
    todayRevenuePence: number;
  }>;
}

export interface BranchDashboardView {
  branch: {
    id: string;
    name: string;
    address: string | null;
    city: string | null;
    isMain: boolean;
  };
  staffCount: number;
  activeTables: number;
  todayOrders: number;
  todayRevenuePence: number;
  pendingKitchenOrders: number;
}

export function serializeCentralBranchDashboard(
  dashboard: CentralBranchDashboard,
): CentralBranchDashboardView {
  return dashboard;
}

export function serializeBranchDashboard(dashboard: BranchDashboard): BranchDashboardView {
  return {
    branch: {
      id: dashboard.branch.id,
      name: dashboard.branch.name,
      address: dashboard.branch.address,
      city: dashboard.branch.city,
      isMain: dashboard.branch.isMain,
    },
    staffCount: dashboard.staffCount,
    activeTables: dashboard.activeTables,
    todayOrders: dashboard.todayOrders,
    todayRevenuePence: dashboard.todayRevenuePence,
    pendingKitchenOrders: dashboard.pendingKitchenOrders,
  };
}
