import type { ModifierGroupStatus, ModifierOptionStatus, SelectionType } from "@prisma/client";

import type { MODIFIER_SORT_OPTIONS } from "@/modules/modifier-management/constants/routes";

export type ModifierSortField = (typeof MODIFIER_SORT_OPTIONS)[number]["value"];

export interface ModifierOptionInput {
  name: string;
  description?: string | null;
  priceAdjustment?: number;
  costAdjustment?: number | null;
  displayOrder?: number;
  status?: ModifierOptionStatus;
}

export interface ModifierManagementInput {
  name: string;
  description?: string | null;
  selectionType: SelectionType;
  minimumSelection?: number;
  maximumSelection?: number;
  isRequired?: boolean;
  displayOrder?: number;
}

export interface ModifierOptionRecord {
  id: string;
  modifierGroupId: string;
  name: string;
  description: string | null;
  priceAdjustment: number;
  costAdjustment: number | null;
  displayOrder: number;
  status: ModifierOptionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ModifierManagementRecord {
  id: string;
  businessId: string;
  name: string;
  description: string | null;
  selectionType: SelectionType;
  minimumSelection: number;
  maximumSelection: number;
  isRequired: boolean;
  displayOrder: number;
  status: ModifierGroupStatus;
  optionCount: number;
  assignedProductCount: number;
  options: ModifierOptionRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface ModifierListQuery {
  search?: string;
  status?: ModifierGroupStatus | "ALL";
  selectionType?: SelectionType | "ALL";
  sortBy?: ModifierSortField;
  sortDirection?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface ModifierListResult {
  items: ModifierManagementRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ModifierDashboardStats {
  total: number;
  active: number;
  inactive: number;
  archived: number;
  totalOptions: number;
}

export interface ProductModifierAssignmentInput {
  menuId: string;
  productId: string;
  modifierGroupIds: string[];
}

export interface ProductModifierAssignmentRecord {
  productId: string;
  productName: string;
  modifierGroupIds: string[];
}

export interface ModifierOptionReorderInput {
  modifierGroupId: string;
  optionIds: string[];
}
