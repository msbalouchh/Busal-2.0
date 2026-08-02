import type { CategoryStatus } from "@prisma/client";

import type { CATEGORY_SORT_OPTIONS } from "@/modules/category-management/constants/routes";

export type CategorySortField = (typeof CATEGORY_SORT_OPTIONS)[number]["value"];

export interface CategoryManagementInput {
  name: string;
  description?: string;
  parentCategoryId?: string | null;
  image?: string | null;
  icon?: string | null;
  displayOrder?: number;
  isFeatured?: boolean;
  slug?: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
}

export interface CategoryManagementRecord {
  id: string;
  businessId: string;
  menuId: string;
  parentCategoryId: string | null;
  parentCategoryName: string | null;
  name: string;
  description: string | null;
  image: string | null;
  icon: string | null;
  displayOrder: number;
  status: CategoryStatus;
  isFeatured: boolean;
  slug: string;
  seoTitle: string | null;
  seoDescription: string | null;
  childCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryTreeNode extends CategoryManagementRecord {
  children: CategoryTreeNode[];
}

export interface CategoryListQuery {
  search?: string;
  status?: CategoryStatus | "ALL";
  parentCategoryId?: string | "ROOT" | "ALL";
  sortBy?: CategorySortField;
  sortDirection?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface CategoryListResult {
  items: CategoryManagementRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CategoryReorderInput {
  menuId: string;
  orderedIds: string[];
  parentCategoryId?: string | null;
}

export interface CategoryDashboardStats {
  total: number;
  active: number;
  inactive: number;
  archived: number;
  featured: number;
}
