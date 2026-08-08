import { z } from "zod";

import {
  TABLE_KINDS,
  TABLE_STATUSES,
} from "@/modules/table-management/constants/table-status";

const tableStatusSchema = z.enum([
  TABLE_STATUSES.AVAILABLE,
  TABLE_STATUSES.OCCUPIED,
  TABLE_STATUSES.RESERVED,
  TABLE_STATUSES.CLEANING,
  TABLE_STATUSES.OUT_OF_SERVICE,
  TABLE_STATUSES.BLOCKED,
]);

const positionSchema = z.object({
  x: z.number(),
  y: z.number(),
  rotation: z.number().optional(),
});

const sizeSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
});

export const tableSearchSchema = z.object({
  query: z.string().optional(),
  floorId: z.string().uuid().optional(),
  zoneId: z.string().optional(),
  status: tableStatusSchema.optional(),
  kind: z.enum([TABLE_KINDS.SINGLE, TABLE_KINDS.MERGED, TABLE_KINDS.SPLIT]).optional(),
  minCapacity: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  sortBy: z.enum(["label", "number", "capacity", "status", "createdAt"]).optional(),
  sortDirection: z.enum(["asc", "desc"]).optional(),
  includeArchived: z.coerce.boolean().optional(),
});

export const createFloorSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
  displayOrder: z.number().int().min(0).optional(),
});

export const updateFloorSchema = createFloorSchema.partial().extend({
  floorId: z.string().uuid(),
  isActive: z.boolean().optional(),
});

export const createTableSchema = z.object({
  floorId: z.string().uuid(),
  zoneId: z.string().optional(),
  label: z.string().trim().min(1).max(120),
  seatCapacity: z.number().int().min(1).max(50),
  minCapacity: z.number().int().min(1).optional(),
  position: positionSchema.optional(),
  size: sizeSchema.optional(),
  isVip: z.boolean().optional(),
  isOutdoor: z.boolean().optional(),
  isPrivateRoom: z.boolean().optional(),
});

export const updateTableSchema = z.object({
  tableId: z.string().uuid(),
  label: z.string().trim().min(1).max(120).optional(),
  status: tableStatusSchema.optional(),
  seatCapacity: z.number().int().min(1).max(50).optional(),
  position: positionSchema.optional(),
  zoneId: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const mergeTablesSchema = z.object({
  floorId: z.string().uuid(),
  sourceTableIds: z.array(z.string().uuid()).min(2),
  targetTableId: z.string().uuid(),
  mergedLabel: z.string().trim().min(1).max(120).optional(),
});

export const splitTablesSchema = z.object({
  floorId: z.string().uuid(),
  targetTableId: z.string().uuid(),
  sourceTableIds: z.array(z.string().uuid()).min(1),
});

export const assignTableSchema = z.object({
  tableId: z.string().uuid(),
  reservationId: z.string().uuid().optional(),
  partySize: z.number().int().min(1),
  guestName: z.string().trim().max(120).optional(),
  staffId: z.string().uuid().optional(),
});

export const transferTableSchema = z.object({
  fromTableId: z.string().uuid(),
  toTableId: z.string().uuid(),
  orderId: z.string().uuid().optional(),
  partySize: z.number().int().min(1),
});

export const bulkUpdateTablesSchema = z.object({
  tableIds: z.array(z.string().uuid()).min(1),
  status: tableStatusSchema.optional(),
  isActive: z.boolean().optional(),
});

export type TableSearchInput = z.infer<typeof tableSearchSchema>;
export type CreateFloorInput = z.infer<typeof createFloorSchema>;
export type UpdateFloorInput = z.infer<typeof updateFloorSchema>;
export type CreateTableInputValidated = z.infer<typeof createTableSchema>;
export type UpdateTableInputValidated = z.infer<typeof updateTableSchema>;
