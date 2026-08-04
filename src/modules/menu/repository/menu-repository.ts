import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  mapMenuToRecord,
  mapModuleStatusToProduct,
  mapProductToItemRecord,
  type MenuWithRelations,
  type ProductWithRelations,
} from "@/modules/menu/lib/menu-mappers";
import type { MenuTenantScope } from "@/modules/menu/lib/menu-scope";
import type {
  CreateMenuItemInput,
  MenuItemRecord,
  MenuRecord,
  MenuSearchQuery,
  UpdateMenuItemInput,
} from "@/modules/menu/types/menu";

const menuInclude = {
  categories: {
    orderBy: [{ displayOrder: "asc" as const }, { name: "asc" as const }],
    include: {
      childCategories: {
        orderBy: [{ displayOrder: "asc" as const }, { name: "asc" as const }],
      },
      products: {
        orderBy: [{ displayOrder: "asc" as const }, { name: "asc" as const }],
        include: {
          modifierGroups: {
            orderBy: [{ displayOrder: "asc" as const }],
            include: {
              modifierGroup: {
                include: {
                  options: { orderBy: [{ displayOrder: "asc" as const }] },
                },
              },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.MenuInclude;

const productInclude = {
  category: {
    include: {
      parentCategory: { select: { id: true, name: true } },
      menu: { select: { id: true, branchId: true } },
    },
  },
  modifierGroups: {
    orderBy: [{ displayOrder: "asc" as const }],
    include: {
      modifierGroup: {
        include: {
          options: { orderBy: [{ displayOrder: "asc" as const }] },
        },
      },
    },
  },
} satisfies Prisma.ProductInclude;

export interface MenuItemSearchResult {
  records: MenuItemRecord[];
  total: number;
  page: number;
  pageSize: number;
}

function businessMenuWhere(scope: MenuTenantScope): Prisma.MenuWhereInput {
  return {
    businessId: scope.businessId,
    ...(scope.branchId ? { OR: [{ branchId: scope.branchId }, { branchId: null }] } : {}),
    status: { not: "ARCHIVED" },
  };
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Prisma-backed menu repository with multi-tenant business scoping. */
export class MenuRepository {
  async listMenus(scope: MenuTenantScope): Promise<MenuRecord[]> {
    const menus = await prisma.menu.findMany({
      where: businessMenuWhere(scope),
      include: menuInclude,
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    });

    return menus.map((menu) => mapMenuToRecord(menu as MenuWithRelations, scope));
  }

  async findMenuById(scope: MenuTenantScope, menuId: string): Promise<MenuRecord | null> {
    const menu = await prisma.menu.findFirst({
      where: { id: menuId, businessId: scope.businessId },
      include: menuInclude,
    });

    return menu ? mapMenuToRecord(menu as MenuWithRelations, scope) : null;
  }

  async findItemById(scope: MenuTenantScope, itemId: string): Promise<MenuItemRecord | null> {
    const product = await prisma.product.findFirst({
      where: { id: itemId, businessId: scope.businessId },
      include: productInclude,
    });

    return product ? mapProductToItemRecord(product as ProductWithRelations, scope) : null;
  }

  async searchItems(
    scope: MenuTenantScope,
    query: MenuSearchQuery = {},
  ): Promise<MenuItemSearchResult> {
    const page = query.page ?? 1;
    const pageSize = query.limit ?? query.pageSize ?? 20;

    const where: Prisma.ProductWhereInput = {
      businessId: scope.businessId,
      ...(query.menuId ? { category: { menuId: query.menuId } } : {}),
      ...(query.status ? { status: mapModuleStatusToProduct(query.status) } : {}),
      ...(query.query
        ? {
            OR: [
              { name: { contains: query.query, mode: "insensitive" } },
              { description: { contains: query.query, mode: "insensitive" } },
              { sku: { contains: query.query, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const orderBy: Prisma.ProductOrderByWithRelationInput[] =
      query.sortBy === "name"
        ? [{ name: query.sortOrder ?? "asc" }]
        : query.sortBy === "price"
          ? [{ price: query.sortOrder ?? "asc" }]
          : query.sortBy === "createdAt"
            ? [{ createdAt: query.sortOrder ?? "desc" }]
            : [{ displayOrder: query.sortOrder ?? "asc" }, { name: "asc" }];

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: productInclude,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      records: products.map((product) =>
        mapProductToItemRecord(product as ProductWithRelations, scope),
      ),
      total,
      page,
      pageSize,
    };
  }

  async createItem(scope: MenuTenantScope, input: CreateMenuItemInput): Promise<MenuItemRecord> {
    const category = await prisma.category.findFirst({
      where: {
        id: input.sectionId ?? input.categoryId,
        businessId: scope.businessId,
        menuId: input.menuId,
      },
      select: { id: true },
    });

    if (!category) {
      throw new Error("Category not found in menu");
    }

    const sku = input.sku?.trim() || `SKU-${Date.now()}`;
    const slugBase = slugify(input.name);

    const product = await prisma.product.create({
      data: {
        businessId: scope.businessId,
        categoryId: category.id,
        sku,
        slug: `${slugBase}-${Date.now()}`,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        status: mapModuleStatusToProduct(input.status ?? "draft"),
        price: input.basePricePence / 100,
        preparationTime: input.prepTimeMinutes ?? 10,
        displayOrder: 0,
      },
      include: productInclude,
    });

    return mapProductToItemRecord(product as ProductWithRelations, scope);
  }

  async updateItem(
    scope: MenuTenantScope,
    input: UpdateMenuItemInput,
  ): Promise<MenuItemRecord | null> {
    const existing = await prisma.product.findFirst({
      where: { id: input.itemId, businessId: scope.businessId },
      select: { id: true },
    });

    if (!existing) {
      return null;
    }

    const product = await prisma.product.update({
      where: { id: input.itemId },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.description !== undefined
          ? { description: input.description?.trim() || null }
          : {}),
        ...(input.status !== undefined ? { status: mapModuleStatusToProduct(input.status) } : {}),
        ...(input.basePricePence !== undefined ? { price: input.basePricePence / 100 } : {}),
        ...(input.prepTimeMinutes !== undefined ? { preparationTime: input.prepTimeMinutes } : {}),
      },
      include: productInclude,
    });

    return mapProductToItemRecord(product as ProductWithRelations, scope);
  }

  async archiveItem(scope: MenuTenantScope, itemId: string): Promise<boolean> {
    const result = await prisma.product.updateMany({
      where: { id: itemId, businessId: scope.businessId },
      data: { status: "ARCHIVED" },
    });

    return result.count > 0;
  }

  async restoreItem(scope: MenuTenantScope, itemId: string): Promise<boolean> {
    const result = await prisma.product.updateMany({
      where: { id: itemId, businessId: scope.businessId, status: "ARCHIVED" },
      data: { status: "INACTIVE" },
    });

    return result.count > 0;
  }

  async publishItem(scope: MenuTenantScope, itemId: string): Promise<boolean> {
    const result = await prisma.product.updateMany({
      where: { id: itemId, businessId: scope.businessId },
      data: { status: "ACTIVE" },
    });

    return result.count > 0;
  }

  async setItemAvailability(
    scope: MenuTenantScope,
    itemId: string,
    isAvailable: boolean,
  ): Promise<boolean> {
    const result = await prisma.product.updateMany({
      where: { id: itemId, businessId: scope.businessId },
      data: { status: isAvailable ? "ACTIVE" : "INACTIVE" },
    });

    return result.count > 0;
  }

  async setItemFeatured(
    scope: MenuTenantScope,
    itemId: string,
    isFeatured: boolean,
  ): Promise<boolean> {
    const result = await prisma.product.updateMany({
      where: { id: itemId, businessId: scope.businessId },
      data: { isFeatured },
    });

    return result.count > 0;
  }

  async duplicateItem(scope: MenuTenantScope, itemId: string): Promise<MenuItemRecord | null> {
    const source = await prisma.product.findFirst({
      where: { id: itemId, businessId: scope.businessId },
    });

    if (!source) {
      return null;
    }

    const product = await prisma.product.create({
      data: {
        businessId: source.businessId,
        categoryId: source.categoryId,
        sku: `${source.sku}-COPY`,
        slug: `${source.slug}-copy-${Date.now()}`,
        name: `${source.name} (Copy)`,
        description: source.description,
        shortDescription: source.shortDescription,
        image: source.image,
        gallery: source.gallery ?? [],
        status: "INACTIVE",
        productType: source.productType,
        price: source.price,
        costPrice: source.costPrice,
        taxRate: source.taxRate,
        preparationTime: source.preparationTime,
        calories: source.calories,
        allergens: source.allergens ?? [],
        ingredients: source.ingredients ?? [],
        isVegetarian: source.isVegetarian,
        isVegan: source.isVegan,
        isHalal: source.isHalal,
        isGlutenFree: source.isGlutenFree,
        isFeatured: false,
        trackInventory: source.trackInventory,
        displayOrder: source.displayOrder,
        seoTitle: source.seoTitle,
        seoDescription: source.seoDescription,
      },
      include: productInclude,
    });

    return mapProductToItemRecord(product as ProductWithRelations, scope);
  }

  async duplicateMenu(scope: MenuTenantScope, menuId: string): Promise<MenuRecord | null> {
    const source = await this.findMenuById(scope, menuId);

    if (!source) {
      return null;
    }

    const menu = await prisma.menu.create({
      data: {
        businessId: scope.businessId,
        branchId: source.menu.branchId === scope.businessId ? null : source.menu.branchId,
        name: `${source.menu.name} (Copy)`,
        description: source.menu.description,
        menuType: "CUSTOM",
        status: "DRAFT",
        displayOrder: source.menu.sortOrder,
        isDefault: false,
      },
    });

    const categoryMap = new Map<string, string>();

    for (const category of source.categories) {
      const created = await prisma.category.create({
        data: {
          businessId: scope.businessId,
          menuId: menu.id,
          name: category.name,
          description: category.description,
          slug: `${slugify(category.name)}-${Date.now()}`,
          displayOrder: category.sortOrder,
          status: category.isVisible ? "ACTIVE" : "INACTIVE",
        },
      });

      categoryMap.set(category.id, created.id);
    }

    for (const item of source.items) {
      const categoryId = categoryMap.get(item.item.categoryId);
      if (!categoryId) continue;

      await prisma.product.create({
        data: {
          businessId: scope.businessId,
          categoryId,
          sku: `${item.item.sku}-COPY-${Date.now()}`,
          slug: slugify(`${item.item.name}-copy-${Date.now()}`),
          name: item.item.name,
          description: item.item.description,
          status: "INACTIVE",
          price: item.pricing.basePricePence / 100,
          preparationTime: item.preparation.prepTimeMinutes,
          displayOrder: item.item.sortOrder,
          isFeatured: item.item.isFeatured,
        },
      });
    }

    return this.findMenuById(scope, menu.id);
  }

  async bulkUpdateItems(
    scope: MenuTenantScope,
    itemIds: string[],
    data: { status?: "ACTIVE" | "INACTIVE" | "ARCHIVED"; isFeatured?: boolean },
  ): Promise<number> {
    const result = await prisma.product.updateMany({
      where: { id: { in: itemIds }, businessId: scope.businessId },
      data: {
        ...(data.status ? { status: data.status } : {}),
        ...(data.isFeatured !== undefined ? { isFeatured: data.isFeatured } : {}),
      },
    });

    return result.count;
  }

  async bulkArchiveItems(scope: MenuTenantScope, itemIds: string[]): Promise<number> {
    return this.bulkUpdateItems(scope, itemIds, { status: "ARCHIVED" });
  }

  async listModifierGroups(scope: MenuTenantScope) {
    const groups = await prisma.modifierGroup.findMany({
      where: { businessId: scope.businessId, status: { not: "ARCHIVED" } },
      include: {
        options: { orderBy: [{ displayOrder: "asc" }] },
        productAssignments: { select: { productId: true } },
      },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    });

    return groups.map((group) => ({
      id: group.id,
      businessId: group.businessId,
      name: group.name,
      description: group.description,
      minSelections: group.minimumSelection,
      maxSelections: group.maximumSelection,
      isRequired: group.isRequired,
      assignedItemCount: group.productAssignments.length,
      options: group.options.map((option) => ({
        id: option.id,
        name: option.name,
        priceAdjustment: Number(option.priceAdjustment),
        isDefault: option.displayOrder === 0,
        sortOrder: option.displayOrder,
      })),
    }));
  }

  async assignModifierGroups(
    scope: MenuTenantScope,
    itemId: string,
    modifierGroupIds: string[],
  ): Promise<void> {
    const product = await prisma.product.findFirst({
      where: { id: itemId, businessId: scope.businessId },
      select: { id: true },
    });

    if (!product) {
      throw new Error("Menu item not found");
    }

    await prisma.productModifierGroup.deleteMany({ where: { productId: itemId } });

    if (modifierGroupIds.length === 0) {
      return;
    }

    await prisma.productModifierGroup.createMany({
      data: modifierGroupIds.map((modifierGroupId, index) => ({
        productId: itemId,
        modifierGroupId,
        displayOrder: index,
      })),
    });
  }

  detectDuplicates(records: MenuItemRecord[]): Array<{ itemId: string; duplicates: string[] }> {
    const results: Array<{ itemId: string; duplicates: string[] }> = [];

    for (const source of records) {
      const normalized = source.item.name.toLowerCase();
      const duplicates = records
        .filter((candidate) => candidate.item.id !== source.item.id)
        .filter((candidate) => {
          const name = candidate.item.name.toLowerCase();
          return name === normalized || name.includes(normalized) || normalized.includes(name);
        })
        .map((candidate) => candidate.item.id);

      if (duplicates.length > 0) {
        results.push({ itemId: source.item.id, duplicates });
      }
    }

    return results;
  }

  async getDashboardStats(scope: MenuTenantScope) {
    const [menus, products, modifierGroups, featured] = await Promise.all([
      prisma.menu.count({ where: { businessId: scope.businessId, status: { not: "ARCHIVED" } } }),
      prisma.product.count({
        where: { businessId: scope.businessId, status: { not: "ARCHIVED" } },
      }),
      prisma.modifierGroup.count({
        where: { businessId: scope.businessId, status: { not: "ARCHIVED" } },
      }),
      prisma.product.count({
        where: { businessId: scope.businessId, isFeatured: true, status: "ACTIVE" },
      }),
    ]);

    return { menus, products, modifierGroups, featured };
  }
}

export const menuRepository = new MenuRepository();
