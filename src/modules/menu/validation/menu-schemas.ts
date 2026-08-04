import { z } from "zod";

import { MENU_ITEM_STATUSES } from "@/modules/menu/constants/menu-status";

const menuItemStatusSchema = z.enum([
  MENU_ITEM_STATUSES.DRAFT,
  MENU_ITEM_STATUSES.ACTIVE,
  MENU_ITEM_STATUSES.HIDDEN,
  MENU_ITEM_STATUSES.ARCHIVED,
  MENU_ITEM_STATUSES.SEASONAL,
]);

export const createMenuItemSchema = z.object({
  menuId: z.string().uuid(),
  categoryId: z.string().uuid(),
  sectionId: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).nullable().optional(),
  sku: z.string().trim().max(80).optional(),
  basePricePence: z.number().int().min(0),
  status: menuItemStatusSchema.optional(),
  prepTimeMinutes: z.number().int().min(0).optional(),
});

export const updateMenuItemSchema = createMenuItemSchema.partial().extend({
  itemId: z.string().uuid(),
});

export const menuSearchSchema = z.object({
  query: z.string().trim().optional(),
  menuId: z.string().uuid().optional(),
  status: menuItemStatusSchema.optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  sortBy: z.enum(["name", "createdAt", "displayOrder", "price"]).optional().default("displayOrder"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
});

export const bulkUpdateMenuItemsSchema = z.object({
  itemIds: z.array(z.string().uuid()).min(1),
  status: menuItemStatusSchema.optional(),
  isFeatured: z.boolean().optional(),
});

export const bulkDeleteMenuItemsSchema = z.object({
  itemIds: z.array(z.string().uuid()).min(1),
});

export type CreateMenuItemPayload = z.infer<typeof createMenuItemSchema>;
export type UpdateMenuItemPayload = z.infer<typeof updateMenuItemSchema>;
export type MenuSearchPayload = z.infer<typeof menuSearchSchema>;
