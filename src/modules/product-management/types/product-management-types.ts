import type { ProductStatus, ProductType } from "@prisma/client";

import type { PRODUCT_SORT_OPTIONS } from "@/modules/product-management/constants/routes";

export type ProductSortField = (typeof PRODUCT_SORT_OPTIONS)[number]["value"];

export interface ProductManagementInput {
  categoryId: string;
  sku: string;
  barcode?: string | null;
  name: string;
  description?: string;
  shortDescription?: string | null;
  image?: string | null;
  gallery?: string[];
  productType: ProductType;
  price: number;
  costPrice?: number | null;
  taxRate?: number | null;
  preparationTime?: number | null;
  calories?: number | null;
  allergens?: string[];
  ingredients?: string[];
  isVegetarian?: boolean;
  isVegan?: boolean;
  isHalal?: boolean;
  isGlutenFree?: boolean;
  isFeatured?: boolean;
  trackInventory?: boolean;
  displayOrder?: number;
  slug?: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
}

export interface ProductManagementRecord {
  id: string;
  businessId: string;
  categoryId: string;
  categoryName: string;
  menuId: string;
  sku: string;
  barcode: string | null;
  name: string;
  description: string | null;
  shortDescription: string | null;
  image: string | null;
  gallery: string[];
  status: ProductStatus;
  productType: ProductType;
  price: number;
  costPrice: number | null;
  taxRate: number | null;
  preparationTime: number | null;
  calories: number | null;
  allergens: string[];
  ingredients: string[];
  isVegetarian: boolean;
  isVegan: boolean;
  isHalal: boolean;
  isGlutenFree: boolean;
  isFeatured: boolean;
  trackInventory: boolean;
  displayOrder: number;
  slug: string;
  seoTitle: string | null;
  seoDescription: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListQuery {
  search?: string;
  status?: ProductStatus | "ALL";
  productType?: ProductType | "ALL";
  categoryId?: string;
  dietary?: "ALL" | "vegetarian" | "vegan" | "halal" | "glutenFree" | "featured";
  sortBy?: ProductSortField;
  sortDirection?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface ProductListResult {
  items: ProductManagementRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ProductDashboardStats {
  total: number;
  active: number;
  inactive: number;
  archived: number;
  featured: number;
}

export interface ProductBulkStatusInput {
  menuId: string;
  productIds: string[];
  status: ProductStatus;
}

export interface ProductBulkImportInput {
  menuId: string;
  products: ProductManagementInput[];
}

export interface ProductBulkExportResult {
  exportedAt: string;
  menuId: string;
  count: number;
  products: ProductManagementRecord[];
}
