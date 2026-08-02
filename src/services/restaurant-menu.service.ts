import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { MENU_LIST_PAGE_SIZE } from "@/modules/menu-management/constants/routes";
import {
  buildDuplicateMenuName,
  normalizeMenuName,
  parseDaysAvailable,
  validateMenuInput,
  validateMenuStatusTransition,
} from "@/modules/menu-management/lib/menu-validation";
import type {
  MenuBranchAssignmentInput,
  MenuDashboardStats,
  MenuListQuery,
  MenuListResult,
  MenuManagementInput,
  MenuManagementRecord,
  MenuSortField,
} from "@/modules/menu-management/types/menu-management-types";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

type MenuWithRelations = Prisma.MenuGetPayload<{
  include: {
    branch: { select: { id: true; name: true } };
    branchAssignments: { include: { branch: { select: { id: true; name: true } } } };
  };
}>;

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

function serializeMenu(menu: MenuWithRelations): MenuManagementRecord {
  return {
    id: menu.id,
    businessId: menu.businessId,
    branchId: menu.branchId,
    branchName: menu.branch?.name ?? null,
    name: menu.name,
    description: menu.description,
    menuType: menu.menuType,
    status: menu.status,
    displayOrder: menu.displayOrder,
    isDefault: menu.isDefault,
    availableFrom: menu.availableFrom,
    availableUntil: menu.availableUntil,
    daysAvailable: parseDaysAvailable(menu.daysAvailable),
    image: menu.image,
    branchAssignments: menu.branchAssignments.map((assignment) => ({
      branchId: assignment.branchId,
      branchName: assignment.branch.name,
      assignedAt: assignment.createdAt.toISOString(),
    })),
    createdAt: menu.createdAt.toISOString(),
    updatedAt: menu.updatedAt.toISOString(),
  };
}

const menuInclude = {
  branch: { select: { id: true, name: true } },
  branchAssignments: {
    include: { branch: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" as const },
  },
} satisfies Prisma.MenuInclude;

function resolveOrderBy(
  sortBy: MenuSortField = "displayOrder",
  sortDirection: "asc" | "desc" = "asc",
): Prisma.MenuOrderByWithRelationInput[] {
  const direction = sortDirection;

  switch (sortBy) {
    case "name":
      return [{ name: direction }];
    case "createdAt":
      return [{ createdAt: direction }];
    case "status":
      return [{ status: direction }, { displayOrder: "asc" }];
    case "menuType":
      return [{ menuType: direction }, { displayOrder: "asc" }];
    case "displayOrder":
    default:
      return [{ displayOrder: direction }, { name: "asc" }];
  }
}

async function assertUniqueMenuName(
  businessId: string,
  branchId: string | null | undefined,
  name: string,
  excludeMenuId?: string,
): Promise<void> {
  const existing = await prisma.menu.findFirst({
    where: {
      businessId,
      branchId: branchId ?? null,
      name: normalizeMenuName(name),
      ...(excludeMenuId ? { NOT: { id: excludeMenuId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw new Error("Menu name must be unique within this branch");
  }
}

async function assertBranchBelongsToBusiness(businessId: string, branchId: string): Promise<void> {
  const branch = await prisma.branch.findFirst({
    where: { id: branchId, businessId },
    select: { id: true },
  });

  if (!branch) {
    throw new Error("Branch not found");
  }
}

async function getOwnedMenu(businessId: string, menuId: string): Promise<MenuWithRelations | null> {
  return prisma.menu.findFirst({
    where: { id: menuId, businessId },
    include: menuInclude,
  });
}

function buildMenuData(
  input: MenuManagementInput,
): Omit<Prisma.MenuCreateInput, "business" | "branch" | "branchAssignments"> {
  return {
    name: normalizeMenuName(input.name),
    description: input.description?.trim() || null,
    menuType: input.menuType,
    displayOrder: input.displayOrder ?? 0,
    availableFrom: input.availableFrom?.trim() || null,
    availableUntil: input.availableUntil?.trim() || null,
    daysAvailable: parseDaysAvailable(input.daysAvailable),
    image: input.image?.trim() || null,
  };
}

export async function getMenuDashboardStats(businessId: string): Promise<MenuDashboardStats> {
  const [total, active, draft, archived] = await Promise.all([
    prisma.menu.count({ where: { businessId } }),
    prisma.menu.count({ where: { businessId, status: "ACTIVE" } }),
    prisma.menu.count({ where: { businessId, status: "DRAFT" } }),
    prisma.menu.count({ where: { businessId, status: "ARCHIVED" } }),
  ]);

  return { total, active, draft, archived };
}

export async function listManagedMenus(
  businessId: string,
  query: MenuListQuery = {},
): Promise<MenuListResult> {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, query.pageSize ?? MENU_LIST_PAGE_SIZE));
  const search = query.search?.trim();

  const where: Prisma.MenuWhereInput = {
    businessId,
    ...(query.status && query.status !== "ALL" ? { status: query.status } : {}),
    ...(query.menuType && query.menuType !== "ALL" ? { menuType: query.menuType } : {}),
    ...(query.branchId ? { branchId: query.branchId } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, menus] = await Promise.all([
    prisma.menu.count({ where }),
    prisma.menu.findMany({
      where,
      include: menuInclude,
      orderBy: resolveOrderBy(query.sortBy, query.sortDirection),
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    items: menus.map(serializeMenu),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getManagedMenu(
  businessId: string,
  menuId: string,
): Promise<MenuManagementRecord | null> {
  const menu = await getOwnedMenu(businessId, menuId);
  return menu ? serializeMenu(menu) : null;
}

export async function createManagedMenu(
  ownerId: string,
  input: MenuManagementInput,
): Promise<MenuManagementRecord> {
  validateMenuInput(input);
  const businessId = await getOwnedBusinessId(ownerId);
  const branchId = input.branchId?.trim() || null;

  if (branchId) {
    await assertBranchBelongsToBusiness(businessId, branchId);
  }

  await assertUniqueMenuName(businessId, branchId, input.name);

  const menu = await prisma.menu.create({
    data: {
      business: { connect: { id: businessId } },
      ...(branchId ? { branch: { connect: { id: branchId } } } : {}),
      ...buildMenuData(input),
      status: "DRAFT",
    },
    include: menuInclude,
  });

  return serializeMenu(menu);
}

export async function updateManagedMenu(
  ownerId: string,
  menuId: string,
  input: MenuManagementInput,
): Promise<MenuManagementRecord> {
  validateMenuInput(input);
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await getOwnedMenu(businessId, menuId);

  if (!existing) {
    throw new Error("Menu not found");
  }

  if (existing.status === "ARCHIVED") {
    throw new Error("Archived menus cannot be edited. Restore the menu first.");
  }

  const branchId = input.branchId?.trim() || null;

  if (branchId) {
    await assertBranchBelongsToBusiness(businessId, branchId);
  }

  await assertUniqueMenuName(businessId, branchId, input.name, menuId);

  const menu = await prisma.menu.update({
    where: { id: menuId },
    data: {
      ...buildMenuData(input),
      ...(branchId ? { branch: { connect: { id: branchId } } } : { branch: { disconnect: true } }),
    },
    include: menuInclude,
  });

  return serializeMenu(menu);
}

export async function duplicateManagedMenu(
  ownerId: string,
  menuId: string,
): Promise<MenuManagementRecord> {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await getOwnedMenu(businessId, menuId);

  if (!existing) {
    throw new Error("Menu not found");
  }

  let duplicateName = buildDuplicateMenuName(existing.name);
  let attempt = 2;

  while (
    await prisma.menu.findFirst({
      where: {
        businessId,
        branchId: existing.branchId,
        name: duplicateName,
      },
      select: { id: true },
    })
  ) {
    duplicateName = `${buildDuplicateMenuName(existing.name)} ${attempt}`;
    attempt += 1;
  }

  const menu = await prisma.menu.create({
    data: {
      business: { connect: { id: businessId } },
      ...(existing.branchId ? { branch: { connect: { id: existing.branchId } } } : {}),
      name: duplicateName,
      description: existing.description,
      menuType: existing.menuType,
      status: "DRAFT",
      displayOrder: existing.displayOrder,
      isDefault: false,
      availableFrom: existing.availableFrom,
      availableUntil: existing.availableUntil,
      daysAvailable: parseDaysAvailable(existing.daysAvailable),
      image: existing.image,
      branchAssignments: {
        create: existing.branchAssignments.map((assignment) => ({
          branch: { connect: { id: assignment.branchId } },
        })),
      },
    },
    include: menuInclude,
  });

  return serializeMenu(menu);
}

export async function archiveManagedMenu(ownerId: string, menuId: string): Promise<void> {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await getOwnedMenu(businessId, menuId);

  if (!existing) {
    throw new Error("Menu not found");
  }

  if (existing.status === "ARCHIVED") {
    throw new Error("Menu is already archived");
  }

  await prisma.menu.update({
    where: { id: menuId },
    data: {
      status: "ARCHIVED",
      isDefault: false,
    },
  });
}

export async function restoreManagedMenu(ownerId: string, menuId: string): Promise<void> {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await getOwnedMenu(businessId, menuId);

  if (!existing) {
    throw new Error("Menu not found");
  }

  if (existing.status !== "ARCHIVED") {
    throw new Error("Only archived menus can be restored");
  }

  validateMenuStatusTransition(existing.status, "INACTIVE");

  await prisma.menu.update({
    where: { id: menuId },
    data: { status: "INACTIVE" },
  });
}

export async function publishManagedMenu(ownerId: string, menuId: string): Promise<void> {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await getOwnedMenu(businessId, menuId);

  if (!existing) {
    throw new Error("Menu not found");
  }

  if (existing.status === "ARCHIVED") {
    throw new Error("Archived menus cannot be published");
  }

  validateMenuStatusTransition(existing.status, "ACTIVE");

  await prisma.menu.update({
    where: { id: menuId },
    data: { status: "ACTIVE" },
  });
}

export async function setDefaultManagedMenu(ownerId: string, menuId: string): Promise<void> {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await getOwnedMenu(businessId, menuId);

  if (!existing) {
    throw new Error("Menu not found");
  }

  if (existing.status === "ARCHIVED") {
    throw new Error("Archived menus cannot be set as default");
  }

  await prisma.$transaction([
    prisma.menu.updateMany({
      where: {
        businessId,
        branchId: existing.branchId,
        NOT: { id: menuId },
      },
      data: { isDefault: false },
    }),
    prisma.menu.update({
      where: { id: menuId },
      data: { isDefault: true },
    }),
  ]);
}

export async function assignManagedMenuBranches(
  ownerId: string,
  input: MenuBranchAssignmentInput,
): Promise<MenuManagementRecord> {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await getOwnedMenu(businessId, input.menuId);

  if (!existing) {
    throw new Error("Menu not found");
  }

  const uniqueBranchIds = [...new Set(input.branchIds.filter(Boolean))];

  for (const branchId of uniqueBranchIds) {
    await assertBranchBelongsToBusiness(businessId, branchId);
  }

  await prisma.$transaction([
    prisma.menuAssignment.deleteMany({
      where: {
        menuId: input.menuId,
        ...(uniqueBranchIds.length > 0 ? { branchId: { notIn: uniqueBranchIds } } : {}),
      },
    }),
    ...uniqueBranchIds.map((branchId) =>
      prisma.menuAssignment.upsert({
        where: {
          menuId_branchId: {
            menuId: input.menuId,
            branchId,
          },
        },
        create: {
          menu: { connect: { id: input.menuId } },
          branch: { connect: { id: branchId } },
        },
        update: {},
      }),
    ),
  ]);

  const menu = await getOwnedMenu(businessId, input.menuId);

  if (!menu) {
    throw new Error("Menu not found");
  }

  return serializeMenu(menu);
}
