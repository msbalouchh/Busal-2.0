import "server-only";

import { type Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { branchScope } from "@/modules/business-context/utils/branch-scope";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";
import type { BusinessProfileData } from "@/types/business-profile";

export interface CategoryData {
  id: string;
  businessId: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  itemCount: number;
}

export interface MenuItemData {
  id: string;
  businessId: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  price: number;
  isAvailable: boolean;
  isFeatured: boolean;
  sortOrder: number;
  category: { id: string; name: string } | null;
  modifierGroupIds: string[];
}

export interface ModifierOptionData {
  id: string;
  modifierGroupId: string;
  name: string;
  priceAdjustment: number;
  isDefault: boolean;
  sortOrder: number;
}

export interface ModifierGroupData {
  id: string;
  businessId: string;
  name: string;
  description: string | null;
  minSelections: number;
  maxSelections: number;
  isRequired: boolean;
  options: ModifierOptionData[];
  assignedItemCount: number;
}

export interface CategoryInput {
  name: string;
  description?: string;
  isActive?: boolean;
  branchId?: string | null;
}

export interface MenuItemInput {
  name: string;
  description?: string;
  price: number;
  categoryId?: string | null;
  isAvailable?: boolean;
  isFeatured?: boolean;
  branchId?: string | null;
}

export interface ModifierGroupInput {
  name: string;
  description?: string;
  minSelections?: number;
  maxSelections?: number;
  isRequired?: boolean;
}

export interface ModifierOptionInput {
  name: string;
  priceAdjustment?: number;
  isDefault?: boolean;
}

function toNumber(value: Prisma.Decimal | number): number {
  return typeof value === "number" ? value : value.toNumber();
}

async function getOwnedBusiness(ownerId: string): Promise<BusinessProfileData & { id: string }> {
  return getOrCreateBusinessForOwner(ownerId);
}

async function assertCategoryBelongsToBusiness(
  businessId: string,
  categoryId: string | null | undefined,
): Promise<void> {
  if (!categoryId) {
    return;
  }

  const category = await prisma.legacyMenuCategory.findFirst({
    where: { id: categoryId, businessId },
  });

  if (!category) {
    throw new Error("Category not found");
  }
}

export async function getMenuManagementContext(ownerId: string, branchId: string | null = null) {
  const business = await getOwnedBusiness(ownerId);

  const [categories, menuItems, modifierGroups] = await Promise.all([
    listCategories(business.id, branchId),
    listMenuItems(business.id, branchId),
    listModifierGroups(business.id),
  ]);

  return { business, categories, menuItems, modifierGroups };
}

export async function listCategories(
  businessId: string,
  branchId: string | null = null,
): Promise<CategoryData[]> {
  const categories = await prisma.legacyMenuCategory.findMany({
    where: { businessId, ...branchScope(branchId) },
    include: { _count: { select: { menuItems: true } } },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return categories.map((category) => ({
    id: category.id,
    businessId: category.businessId,
    name: category.name,
    description: category.description,
    sortOrder: category.sortOrder,
    isActive: category.isActive,
    itemCount: category._count.menuItems,
  }));
}

export async function listActiveCategories(
  businessId: string,
  branchId: string | null = null,
): Promise<CategoryData[]> {
  const categories = await listCategories(businessId, branchId);
  return categories.filter((category) => category.isActive);
}

export async function listPublicMenuItems(
  businessId: string,
  branchId: string | null = null,
): Promise<MenuItemData[]> {
  return listMenuItems(businessId, branchId);
}

export async function createCategory(ownerId: string, input: CategoryInput): Promise<CategoryData> {
  const business = await getOwnedBusiness(ownerId);
  const maxSort = await prisma.legacyMenuCategory.aggregate({
    where: { businessId: business.id },
    _max: { sortOrder: true },
  });

  const category = await prisma.legacyMenuCategory.create({
    data: {
      businessId: business.id,
      branchId: input.branchId ?? null,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      isActive: input.isActive ?? true,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
  });

  const categories = await listCategories(business.id);
  const created = categories.find((entry) => entry.id === category.id);

  if (!created) {
    throw new Error("Failed to create category");
  }

  return created;
}

export async function updateCategory(
  ownerId: string,
  categoryId: string,
  input: CategoryInput,
): Promise<CategoryData> {
  const business = await getOwnedBusiness(ownerId);
  const category = await prisma.legacyMenuCategory.findFirst({
    where: { id: categoryId, businessId: business.id },
  });

  if (!category) {
    throw new Error("Category not found");
  }

  await prisma.legacyMenuCategory.update({
    where: { id: categoryId },
    data: {
      name: input.name.trim(),
      description: input.description?.trim() || null,
      isActive: input.isActive ?? category.isActive,
    },
  });

  const categories = await listCategories(business.id);
  const updated = categories.find((entry) => entry.id === categoryId);

  if (!updated) {
    throw new Error("Failed to update category");
  }

  return updated;
}

export async function deleteCategory(ownerId: string, categoryId: string): Promise<void> {
  const business = await getOwnedBusiness(ownerId);
  const category = await prisma.legacyMenuCategory.findFirst({
    where: { id: categoryId, businessId: business.id },
  });

  if (!category) {
    throw new Error("Category not found");
  }

  await prisma.legacyMenuCategory.delete({ where: { id: categoryId } });
}

export async function setCategoryActiveStatus(
  ownerId: string,
  categoryId: string,
  isActive: boolean,
): Promise<void> {
  const business = await getOwnedBusiness(ownerId);
  const category = await prisma.legacyMenuCategory.findFirst({
    where: { id: categoryId, businessId: business.id },
  });

  if (!category) {
    throw new Error("Category not found");
  }

  await prisma.legacyMenuCategory.update({
    where: { id: categoryId },
    data: { isActive },
  });
}

export async function reorderCategories(ownerId: string, orderedIds: string[]): Promise<void> {
  const business = await getOwnedBusiness(ownerId);
  const categories = await prisma.legacyMenuCategory.findMany({
    where: { businessId: business.id },
    select: { id: true },
  });
  const validIds = new Set(categories.map((category) => category.id));

  await Promise.all(
    orderedIds.map((id, index) => {
      if (!validIds.has(id)) {
        throw new Error("Category not found");
      }

      return prisma.legacyMenuCategory.update({
        where: { id },
        data: { sortOrder: index },
      });
    }),
  );
}

export async function listMenuItems(
  businessId: string,
  branchId: string | null = null,
): Promise<MenuItemData[]> {
  const items = await prisma.menuItem.findMany({
    where: { businessId, ...branchScope(branchId) },
    include: {
      category: { select: { id: true, name: true } },
      itemModifiers: { select: { modifierGroupId: true }, orderBy: { sortOrder: "asc" } },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return items.map((item) => ({
    id: item.id,
    businessId: item.businessId,
    categoryId: item.categoryId,
    name: item.name,
    description: item.description,
    price: toNumber(item.price),
    isAvailable: item.isAvailable,
    isFeatured: item.isFeatured,
    sortOrder: item.sortOrder,
    category: item.category,
    modifierGroupIds: item.itemModifiers.map((entry) => entry.modifierGroupId),
  }));
}

export async function createMenuItem(ownerId: string, input: MenuItemInput): Promise<MenuItemData> {
  const business = await getOwnedBusiness(ownerId);
  await assertCategoryBelongsToBusiness(business.id, input.categoryId);

  const maxSort = await prisma.menuItem.aggregate({
    where: { businessId: business.id },
    _max: { sortOrder: true },
  });

  const item = await prisma.menuItem.create({
    data: {
      businessId: business.id,
      branchId: input.branchId ?? null,
      categoryId: input.categoryId ?? null,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      price: input.price,
      isAvailable: input.isAvailable ?? true,
      isFeatured: input.isFeatured ?? false,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
  });

  const items = await listMenuItems(business.id);
  const created = items.find((entry) => entry.id === item.id);

  if (!created) {
    throw new Error("Failed to create menu item");
  }

  return created;
}

export async function updateMenuItem(
  ownerId: string,
  itemId: string,
  input: MenuItemInput,
): Promise<MenuItemData> {
  const business = await getOwnedBusiness(ownerId);
  const item = await prisma.menuItem.findFirst({
    where: { id: itemId, businessId: business.id },
  });

  if (!item) {
    throw new Error("Menu item not found");
  }

  await assertCategoryBelongsToBusiness(business.id, input.categoryId);

  await prisma.menuItem.update({
    where: { id: itemId },
    data: {
      name: input.name.trim(),
      description: input.description?.trim() || null,
      price: input.price,
      categoryId: input.categoryId ?? null,
      isAvailable: input.isAvailable ?? item.isAvailable,
      isFeatured: input.isFeatured ?? item.isFeatured,
    },
  });

  const items = await listMenuItems(business.id);
  const updated = items.find((entry) => entry.id === itemId);

  if (!updated) {
    throw new Error("Failed to update menu item");
  }

  return updated;
}

export async function deleteMenuItem(ownerId: string, itemId: string): Promise<void> {
  const business = await getOwnedBusiness(ownerId);
  const item = await prisma.menuItem.findFirst({
    where: { id: itemId, businessId: business.id },
  });

  if (!item) {
    throw new Error("Menu item not found");
  }

  await prisma.menuItem.delete({ where: { id: itemId } });
}

export async function setMenuItemAvailability(
  ownerId: string,
  itemId: string,
  isAvailable: boolean,
): Promise<void> {
  const business = await getOwnedBusiness(ownerId);
  const item = await prisma.menuItem.findFirst({
    where: { id: itemId, businessId: business.id },
  });

  if (!item) {
    throw new Error("Menu item not found");
  }

  await prisma.menuItem.update({
    where: { id: itemId },
    data: { isAvailable },
  });
}

export async function setMenuItemFeatured(
  ownerId: string,
  itemId: string,
  isFeatured: boolean,
): Promise<void> {
  const business = await getOwnedBusiness(ownerId);
  const item = await prisma.menuItem.findFirst({
    where: { id: itemId, businessId: business.id },
  });

  if (!item) {
    throw new Error("Menu item not found");
  }

  await prisma.menuItem.update({
    where: { id: itemId },
    data: { isFeatured },
  });
}

export async function listModifierGroups(businessId: string): Promise<ModifierGroupData[]> {
  const groups = await prisma.legacyModifierGroup.findMany({
    where: { businessId },
    include: {
      options: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
      _count: { select: { itemModifiers: true } },
    },
    orderBy: [{ createdAt: "asc" }],
  });

  return groups.map((group) => ({
    id: group.id,
    businessId: group.businessId,
    name: group.name,
    description: group.description,
    minSelections: group.minSelections,
    maxSelections: group.maxSelections,
    isRequired: group.isRequired,
    assignedItemCount: group._count.itemModifiers,
    options: group.options.map((option) => ({
      id: option.id,
      modifierGroupId: option.modifierGroupId,
      name: option.name,
      priceAdjustment: toNumber(option.priceAdjustment),
      isDefault: option.isDefault,
      sortOrder: option.sortOrder,
    })),
  }));
}

export async function createModifierGroup(
  ownerId: string,
  input: ModifierGroupInput,
): Promise<ModifierGroupData> {
  const business = await getOwnedBusiness(ownerId);

  const group = await prisma.legacyModifierGroup.create({
    data: {
      businessId: business.id,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      minSelections: input.minSelections ?? 0,
      maxSelections: input.maxSelections ?? 1,
      isRequired: input.isRequired ?? false,
    },
  });

  const groups = await listModifierGroups(business.id);
  const created = groups.find((entry) => entry.id === group.id);

  if (!created) {
    throw new Error("Failed to create modifier group");
  }

  return created;
}

export async function updateModifierGroup(
  ownerId: string,
  groupId: string,
  input: ModifierGroupInput,
): Promise<ModifierGroupData> {
  const business = await getOwnedBusiness(ownerId);
  const group = await prisma.legacyModifierGroup.findFirst({
    where: { id: groupId, businessId: business.id },
  });

  if (!group) {
    throw new Error("Modifier group not found");
  }

  await prisma.legacyModifierGroup.update({
    where: { id: groupId },
    data: {
      name: input.name.trim(),
      description: input.description?.trim() || null,
      minSelections: input.minSelections ?? group.minSelections,
      maxSelections: input.maxSelections ?? group.maxSelections,
      isRequired: input.isRequired ?? group.isRequired,
    },
  });

  const groups = await listModifierGroups(business.id);
  const updated = groups.find((entry) => entry.id === groupId);

  if (!updated) {
    throw new Error("Failed to update modifier group");
  }

  return updated;
}

export async function deleteModifierGroup(ownerId: string, groupId: string): Promise<void> {
  const business = await getOwnedBusiness(ownerId);
  const group = await prisma.legacyModifierGroup.findFirst({
    where: { id: groupId, businessId: business.id },
  });

  if (!group) {
    throw new Error("Modifier group not found");
  }

  await prisma.legacyModifierGroup.delete({ where: { id: groupId } });
}

export async function createModifierOption(
  ownerId: string,
  groupId: string,
  input: ModifierOptionInput,
): Promise<ModifierGroupData> {
  const business = await getOwnedBusiness(ownerId);
  const group = await prisma.legacyModifierGroup.findFirst({
    where: { id: groupId, businessId: business.id },
  });

  if (!group) {
    throw new Error("Modifier group not found");
  }

  const maxSort = await prisma.legacyModifierOption.aggregate({
    where: { modifierGroupId: groupId },
    _max: { sortOrder: true },
  });

  await prisma.legacyModifierOption.create({
    data: {
      modifierGroupId: groupId,
      name: input.name.trim(),
      priceAdjustment: input.priceAdjustment ?? 0,
      isDefault: input.isDefault ?? false,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
  });

  const groups = await listModifierGroups(business.id);
  const updated = groups.find((entry) => entry.id === groupId);

  if (!updated) {
    throw new Error("Failed to create modifier option");
  }

  return updated;
}

export async function updateModifierOption(
  ownerId: string,
  optionId: string,
  input: ModifierOptionInput,
): Promise<ModifierGroupData> {
  const business = await getOwnedBusiness(ownerId);
  const option = await prisma.legacyModifierOption.findFirst({
    where: { id: optionId, modifierGroup: { businessId: business.id } },
    include: { modifierGroup: true },
  });

  if (!option) {
    throw new Error("Modifier option not found");
  }

  await prisma.legacyModifierOption.update({
    where: { id: optionId },
    data: {
      name: input.name.trim(),
      priceAdjustment: input.priceAdjustment ?? toNumber(option.priceAdjustment),
      isDefault: input.isDefault ?? option.isDefault,
    },
  });

  const groups = await listModifierGroups(business.id);
  const updated = groups.find((entry) => entry.id === option.modifierGroupId);

  if (!updated) {
    throw new Error("Failed to update modifier option");
  }

  return updated;
}

export async function deleteModifierOption(ownerId: string, optionId: string): Promise<void> {
  const business = await getOwnedBusiness(ownerId);
  const option = await prisma.legacyModifierOption.findFirst({
    where: { id: optionId, modifierGroup: { businessId: business.id } },
  });

  if (!option) {
    throw new Error("Modifier option not found");
  }

  await prisma.legacyModifierOption.delete({ where: { id: optionId } });
}

export async function assignModifierGroupsToMenuItem(
  ownerId: string,
  itemId: string,
  modifierGroupIds: string[],
): Promise<void> {
  const business = await getOwnedBusiness(ownerId);
  const item = await prisma.menuItem.findFirst({
    where: { id: itemId, businessId: business.id },
  });

  if (!item) {
    throw new Error("Menu item not found");
  }

  const validGroups = await prisma.legacyModifierGroup.findMany({
    where: { businessId: business.id, id: { in: modifierGroupIds } },
    select: { id: true },
  });

  if (validGroups.length !== modifierGroupIds.length) {
    throw new Error("Modifier group not found");
  }

  await prisma.legacyMenuItemModifier.deleteMany({ where: { menuItemId: itemId } });

  if (modifierGroupIds.length > 0) {
    await prisma.legacyMenuItemModifier.createMany({
      data: modifierGroupIds.map((modifierGroupId, index) => ({
        menuItemId: itemId,
        modifierGroupId,
        sortOrder: index,
      })),
    });
  }
}
