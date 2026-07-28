import "server-only";

import {
  type IngredientStatus,
  type IngredientUnit,
  type Prisma,
  type SupplierStatus,
} from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

import { prisma } from "@/lib/prisma";
import { branchFilter } from "@/modules/business-context/utils/branch-scope";
import { DEFAULT_INGREDIENT_CATEGORIES } from "@/modules/inventory/constants/inventory";
import { logInventoryAudit } from "@/modules/inventory/utils/inventory-audit";
import { decimalFromInput } from "@/modules/inventory/utils/inventory-cost";

export interface IngredientData {
  id: string;
  businessId: string;
  categoryId: string | null;
  categoryName: string | null;
  name: string;
  sku: string | null;
  unit: IngredientUnit;
  customUnit: string | null;
  costPricePence: number;
  currentStock: string;
  minimumStock: string;
  status: IngredientStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupplierData {
  id: string;
  businessId: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  status: SupplierStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface IngredientCategoryData {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  isSystem: boolean;
}

export interface IngredientInput {
  name: string;
  sku?: string | null;
  categoryId?: string | null;
  unit: IngredientUnit;
  customUnit?: string | null;
  costPricePence: number;
  currentStock?: string | number;
  minimumStock?: string | number;
  status?: IngredientStatus;
}

export interface SupplierInput {
  name: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  status?: SupplierStatus;
}

const ingredientSelect = {
  id: true,
  businessId: true,
  categoryId: true,
  name: true,
  sku: true,
  unit: true,
  customUnit: true,
  costPricePence: true,
  currentStock: true,
  minimumStock: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  category: { select: { name: true } },
} satisfies Prisma.IngredientSelect;

type IngredientRecord = Prisma.IngredientGetPayload<{ select: typeof ingredientSelect }>;

function mapIngredient(ingredient: IngredientRecord): IngredientData {
  return {
    id: ingredient.id,
    businessId: ingredient.businessId,
    categoryId: ingredient.categoryId,
    categoryName: ingredient.category?.name ?? null,
    name: ingredient.name,
    sku: ingredient.sku,
    unit: ingredient.unit,
    customUnit: ingredient.customUnit,
    costPricePence: ingredient.costPricePence,
    currentStock: ingredient.currentStock.toString(),
    minimumStock: ingredient.minimumStock.toString(),
    status: ingredient.status,
    createdAt: ingredient.createdAt,
    updatedAt: ingredient.updatedAt,
  };
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function ensureDefaultIngredientCategories(businessId: string): Promise<void> {
  for (const [index, category] of DEFAULT_INGREDIENT_CATEGORIES.entries()) {
    await prisma.ingredientCategory.upsert({
      where: {
        businessId_slug: {
          businessId,
          slug: category.slug,
        },
      },
      create: {
        businessId,
        name: category.name,
        slug: category.slug,
        sortOrder: index,
        isSystem: true,
      },
      update: {},
    });
  }
}

export async function listIngredientCategories(
  businessId: string,
): Promise<IngredientCategoryData[]> {
  await ensureDefaultIngredientCategories(businessId);

  const categories = await prisma.ingredientCategory.findMany({
    where: { businessId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      sortOrder: true,
      isSystem: true,
    },
  });

  return categories;
}

export async function listIngredients(businessId: string): Promise<IngredientData[]> {
  const ingredients = await prisma.ingredient.findMany({
    where: { businessId, deletedAt: null },
    select: ingredientSelect,
    orderBy: [{ name: "asc" }],
  });

  return ingredients.map(mapIngredient);
}

export async function getIngredient(
  ingredientId: string,
  businessId: string,
): Promise<IngredientData> {
  const ingredient = await prisma.ingredient.findFirst({
    where: { id: ingredientId, businessId, deletedAt: null },
    select: ingredientSelect,
  });

  if (!ingredient) {
    throw new Error("Ingredient not found");
  }

  return mapIngredient(ingredient);
}

export async function createIngredient(
  businessId: string,
  staffId: string | null,
  input: IngredientInput,
): Promise<IngredientData> {
  if (!Number.isInteger(input.costPricePence) || input.costPricePence < 0) {
    throw new Error("Cost price must be integer pence");
  }

  const ingredient = await prisma.ingredient.create({
    data: {
      businessId,
      categoryId: input.categoryId ?? null,
      name: input.name.trim(),
      sku: input.sku?.trim() || null,
      unit: input.unit,
      customUnit: input.unit === "CUSTOM" ? input.customUnit?.trim() || null : null,
      costPricePence: input.costPricePence,
      currentStock: decimalFromInput(input.currentStock ?? 0),
      minimumStock: decimalFromInput(input.minimumStock ?? 0),
      status: input.status ?? "ACTIVE",
    },
    select: ingredientSelect,
  });

  await logInventoryAudit(businessId, {
    staffId,
    entityType: "ingredient",
    entityId: ingredient.id,
    action: "CREATED",
  });

  return mapIngredient(ingredient);
}

export async function updateIngredient(
  ingredientId: string,
  businessId: string,
  staffId: string | null,
  input: IngredientInput,
): Promise<IngredientData> {
  const existing = await prisma.ingredient.findFirst({
    where: { id: ingredientId, businessId, deletedAt: null },
    select: { id: true },
  });

  if (!existing) {
    throw new Error("Ingredient not found");
  }

  if (!Number.isInteger(input.costPricePence) || input.costPricePence < 0) {
    throw new Error("Cost price must be integer pence");
  }

  const ingredient = await prisma.ingredient.update({
    where: { id: ingredientId },
    data: {
      categoryId: input.categoryId ?? null,
      name: input.name.trim(),
      sku: input.sku?.trim() || null,
      unit: input.unit,
      customUnit: input.unit === "CUSTOM" ? input.customUnit?.trim() || null : null,
      costPricePence: input.costPricePence,
      currentStock: decimalFromInput(input.currentStock ?? 0),
      minimumStock: decimalFromInput(input.minimumStock ?? 0),
      status: input.status ?? "ACTIVE",
    },
    select: ingredientSelect,
  });

  await logInventoryAudit(businessId, {
    staffId,
    entityType: "ingredient",
    entityId: ingredient.id,
    action: "UPDATED",
  });

  return mapIngredient(ingredient);
}

export async function deactivateIngredient(
  ingredientId: string,
  businessId: string,
  staffId: string | null,
): Promise<void> {
  const ingredient = await prisma.ingredient.updateMany({
    where: { id: ingredientId, businessId, deletedAt: null },
    data: { status: "INACTIVE", deletedAt: new Date() },
  });

  if (ingredient.count === 0) {
    throw new Error("Ingredient not found");
  }

  await logInventoryAudit(businessId, {
    staffId,
    entityType: "ingredient",
    entityId: ingredientId,
    action: "DEACTIVATED",
  });
}

export async function listSuppliers(businessId: string): Promise<SupplierData[]> {
  return prisma.supplier.findMany({
    where: { businessId, deletedAt: null },
    orderBy: [{ name: "asc" }],
    select: {
      id: true,
      businessId: true,
      name: true,
      contactName: true,
      phone: true,
      email: true,
      address: true,
      notes: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function createSupplier(
  businessId: string,
  staffId: string | null,
  input: SupplierInput,
): Promise<SupplierData> {
  const supplier = await prisma.supplier.create({
    data: {
      businessId,
      name: input.name.trim(),
      contactName: input.contactName?.trim() || null,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      address: input.address?.trim() || null,
      notes: input.notes?.trim() || null,
      status: input.status ?? "ACTIVE",
    },
  });

  await logInventoryAudit(businessId, {
    staffId,
    entityType: "supplier",
    entityId: supplier.id,
    action: "CREATED",
  });

  return supplier;
}

export async function updateSupplier(
  supplierId: string,
  businessId: string,
  staffId: string | null,
  input: SupplierInput,
): Promise<SupplierData> {
  const existing = await prisma.supplier.findFirst({
    where: { id: supplierId, businessId, deletedAt: null },
    select: { id: true },
  });

  if (!existing) {
    throw new Error("Supplier not found");
  }

  const supplier = await prisma.supplier.update({
    where: { id: supplierId },
    data: {
      name: input.name.trim(),
      contactName: input.contactName?.trim() || null,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      address: input.address?.trim() || null,
      notes: input.notes?.trim() || null,
      status: input.status ?? "ACTIVE",
    },
  });

  await logInventoryAudit(businessId, {
    staffId,
    entityType: "supplier",
    entityId: supplier.id,
    action: "UPDATED",
  });

  return supplier;
}

export async function deactivateSupplier(
  supplierId: string,
  businessId: string,
  staffId: string | null,
): Promise<void> {
  const supplier = await prisma.supplier.updateMany({
    where: { id: supplierId, businessId, deletedAt: null },
    data: { status: "INACTIVE", deletedAt: new Date() },
  });

  if (supplier.count === 0) {
    throw new Error("Supplier not found");
  }

  await logInventoryAudit(businessId, {
    staffId,
    entityType: "supplier",
    entityId: supplierId,
    action: "DEACTIVATED",
  });
}

export async function getInventoryDashboard(businessId: string, branchId: string | null = null) {
  const ingredients = await listIngredients(businessId);

  const lowStock = ingredients.filter((ingredient) => {
    const current = new Decimal(ingredient.currentStock);
    const minimum = new Decimal(ingredient.minimumStock);

    return current.gt(0) && current.lte(minimum);
  });

  const outOfStock = ingredients.filter((ingredient) =>
    new Decimal(ingredient.currentStock).lte(0),
  );

  const [recentAdjustments, recentMovements] = await Promise.all([
    prisma.stockAdjustment.findMany({
      where: { businessId, ...branchFilter(branchId) },
      orderBy: [{ createdAt: "desc" }],
      take: 10,
      include: {
        ingredient: { select: { name: true } },
      },
    }),
    prisma.stockMovement.findMany({
      where: { businessId, ...branchFilter(branchId) },
      orderBy: [{ createdAt: "desc" }],
      take: 10,
      include: {
        ingredient: { select: { name: true } },
      },
    }),
  ]);

  return {
    totalIngredients: ingredients.length,
    activeIngredients: ingredients.filter((ingredient) => ingredient.status === "ACTIVE").length,
    lowStock,
    outOfStock,
    recentAdjustments: recentAdjustments.map((adjustment) => ({
      id: adjustment.id,
      ingredientName: adjustment.ingredient.name,
      direction: adjustment.direction,
      quantity: adjustment.quantity.toString(),
      reason: adjustment.reason,
      createdAt: adjustment.createdAt.toISOString(),
    })),
    recentMovements: recentMovements.map((movement) => ({
      id: movement.id,
      ingredientName: movement.ingredient.name,
      movementType: movement.movementType,
      quantityChange: movement.quantityChange.toString(),
      balanceAfter: movement.balanceAfter.toString(),
      createdAt: movement.createdAt.toISOString(),
    })),
  };
}

export { slugify };
