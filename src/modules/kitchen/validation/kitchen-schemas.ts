import { z } from "zod";

import {
  KITCHEN_PRIORITIES,
  KITCHEN_QUEUE_SORT_STRATEGIES,
  KITCHEN_SCREEN_MODES,
  KITCHEN_STATION_TYPES,
  KITCHEN_STATUSES,
} from "@/modules/kitchen/constants/kitchen-status";

const kitchenStatusSchema = z.enum([
  KITCHEN_STATUSES.PENDING,
  KITCHEN_STATUSES.QUEUED,
  KITCHEN_STATUSES.ACCEPTED,
  KITCHEN_STATUSES.PREPARING,
  KITCHEN_STATUSES.READY,
  KITCHEN_STATUSES.SERVED,
  KITCHEN_STATUSES.COMPLETED,
  KITCHEN_STATUSES.DELAYED,
  KITCHEN_STATUSES.CANCELLED,
  KITCHEN_STATUSES.HELD,
]);

const kitchenPrioritySchema = z.enum([
  KITCHEN_PRIORITIES.LOW,
  KITCHEN_PRIORITIES.NORMAL,
  KITCHEN_PRIORITIES.HIGH,
  KITCHEN_PRIORITIES.URGENT,
  KITCHEN_PRIORITIES.VIP,
]);

const kitchenStationTypeSchema = z.enum([
  KITCHEN_STATION_TYPES.GRILL,
  KITCHEN_STATION_TYPES.FRYER,
  KITCHEN_STATION_TYPES.PIZZA,
  KITCHEN_STATION_TYPES.DRINKS,
  KITCHEN_STATION_TYPES.DESSERTS,
  KITCHEN_STATION_TYPES.SALADS,
  KITCHEN_STATION_TYPES.BAR,
  KITCHEN_STATION_TYPES.CUSTOM,
]);

export const kitchenSearchSchema = z.object({
  query: z.string().trim().optional(),
  kitchenId: z.string().trim().optional(),
  stationId: z.string().trim().optional(),
  status: kitchenStatusSchema.optional(),
  priority: kitchenPrioritySchema.optional(),
  stationType: kitchenStationTypeSchema.optional(),
  isRecalled: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  sortBy: z.enum(["queuedAt", "priority", "orderNumber", "status"]).default("queuedAt"),
  sortDirection: z.enum(["asc", "desc"]).default("asc"),
});

export const createKitchenStationSchema = z.object({
  name: z.string().trim().min(1).max(80),
  stationType: kitchenStationTypeSchema.default(KITCHEN_STATION_TYPES.CUSTOM),
  customLabel: z.string().trim().max(80).nullable().optional(),
  displayOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  maxConcurrentItems: z.coerce.number().int().min(1).max(50).default(4),
  avgPrepMinutes: z.coerce.number().int().min(1).max(180).default(10),
});

export const updateKitchenStationSchema = createKitchenStationSchema.partial().extend({
  stationId: z.string().trim().min(1),
});

export const kitchenOrderActionSchema = z.object({
  kitchenOrderId: z.string().trim().min(1),
  reason: z.string().trim().max(500).optional(),
  actorId: z.string().trim().optional(),
  actorName: z.string().trim().optional(),
});

export const assignKitchenStationSchema = z.object({
  ticketId: z.string().trim().min(1),
  stationId: z.string().trim().min(1),
  assignedBy: z.string().trim().optional(),
  isAutoAssigned: z.boolean().optional(),
});

export const updateKitchenItemStatusSchema = z.object({
  itemId: z.string().trim().min(1),
  status: kitchenStatusSchema,
  updatedBy: z.string().trim().optional(),
});

export const addKitchenNoteSchema = z.object({
  kitchenOrderId: z.string().trim().min(1),
  ticketId: z.string().trim().optional(),
  itemId: z.string().trim().optional(),
  body: z.string().trim().min(1).max(1000),
  authorId: z.string().trim().min(1),
  authorName: z.string().trim().min(1),
  isInternal: z.boolean().default(true),
});

export const receiveOmsOrderSchema = z.object({
  restaurantOrderId: z.string().trim().min(1),
  priority: kitchenPrioritySchema.optional(),
});

export const createKitchenQueueSchema = z.object({
  name: z.string().trim().min(1).max(80),
  stationId: z.string().trim().nullable().optional(),
  sortStrategy: z
    .enum([
      KITCHEN_QUEUE_SORT_STRATEGIES.FIFO,
      KITCHEN_QUEUE_SORT_STRATEGIES.PRIORITY,
      KITCHEN_QUEUE_SORT_STRATEGIES.PROMISED_TIME,
      KITCHEN_QUEUE_SORT_STRATEGIES.STATION,
    ])
    .default(KITCHEN_QUEUE_SORT_STRATEGIES.PRIORITY),
  maxVisibleTickets: z.coerce.number().int().min(1).max(200).default(50),
  isActive: z.boolean().default(true),
});

export const createKitchenScreenSchema = z.object({
  name: z.string().trim().min(1).max(80),
  mode: z
    .enum([
      KITCHEN_SCREEN_MODES.EXPEDITE,
      KITCHEN_SCREEN_MODES.STATION,
      KITCHEN_SCREEN_MODES.ALL_DAY,
      KITCHEN_SCREEN_MODES.SUMMARY,
    ])
    .default(KITCHEN_SCREEN_MODES.STATION),
  stationIds: z.array(z.string().trim().min(1)).default([]),
  showCompletedOrders: z.boolean().default(false),
  autoBumpEnabled: z.boolean().default(false),
  refreshIntervalMs: z.coerce.number().int().min(5_000).max(120_000).default(15_000),
  isActive: z.boolean().default(true),
});

export const preparationStageSchema = z.object({
  kitchenOrderId: z.string().trim().min(1),
  name: z.string().trim().min(1).max(80),
  stationId: z.string().trim().nullable().optional(),
});

export type KitchenSearchSchemaInput = z.infer<typeof kitchenSearchSchema>;
export type CreateKitchenStationSchemaInput = z.infer<typeof createKitchenStationSchema>;
export type UpdateKitchenStationSchemaInput = z.infer<typeof updateKitchenStationSchema>;
export type KitchenOrderActionSchemaInput = z.infer<typeof kitchenOrderActionSchema>;
export type AssignKitchenStationSchemaInput = z.infer<typeof assignKitchenStationSchema>;
export type AddKitchenNoteSchemaInput = z.infer<typeof addKitchenNoteSchema>;
export type ReceiveOmsOrderSchemaInput = z.infer<typeof receiveOmsOrderSchema>;
