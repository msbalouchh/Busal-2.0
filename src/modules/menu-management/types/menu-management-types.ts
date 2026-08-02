import type { MenuStatus, MenuType } from "@prisma/client";

import type { MENU_SORT_OPTIONS } from "@/modules/menu-management/constants/routes";

export type MenuSortField = (typeof MENU_SORT_OPTIONS)[number]["value"];

export interface MenuBranchAssignment {
  branchId: string;
  branchName: string;
  assignedAt: string;
}

export interface MenuManagementInput {
  name: string;
  description?: string;
  menuType: MenuType;
  branchId?: string | null;
  displayOrder?: number;
  availableFrom?: string | null;
  availableUntil?: string | null;
  daysAvailable?: number[];
  image?: string | null;
}

export interface MenuManagementRecord {
  id: string;
  businessId: string;
  branchId: string | null;
  branchName: string | null;
  name: string;
  description: string | null;
  menuType: MenuType;
  status: MenuStatus;
  displayOrder: number;
  isDefault: boolean;
  availableFrom: string | null;
  availableUntil: string | null;
  daysAvailable: number[];
  image: string | null;
  branchAssignments: MenuBranchAssignment[];
  createdAt: string;
  updatedAt: string;
}

export interface MenuListQuery {
  search?: string;
  status?: MenuStatus | "ALL";
  menuType?: MenuType | "ALL";
  branchId?: string;
  sortBy?: MenuSortField;
  sortDirection?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface MenuListResult {
  items: MenuManagementRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface MenuBranchAssignmentInput {
  menuId: string;
  branchIds: string[];
}

export interface MenuDashboardStats {
  total: number;
  active: number;
  draft: number;
  archived: number;
}
