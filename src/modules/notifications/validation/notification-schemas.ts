import { z } from "zod";

import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_EVENT_SOURCES,
  NOTIFICATION_PRIORITIES,
} from "@/modules/notifications/constants/notification-status";

export const notificationSearchSchema = z.object({
  query: z.string().optional(),
  channel: z.nativeEnum(NOTIFICATION_CHANNELS).optional(),
  status: z.string().optional(),
  eventSource: z.nativeEnum(NOTIFICATION_EVENT_SOURCES).optional(),
  isRead: z.coerce.boolean().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const sendNotificationSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  channel: z.nativeEnum(NOTIFICATION_CHANNELS),
  recipientId: z.string().min(1),
  templateId: z.string().optional(),
  priority: z.nativeEnum(NOTIFICATION_PRIORITIES).optional(),
  scheduledAt: z.string().optional(),
  eventSource: z.nativeEnum(NOTIFICATION_EVENT_SOURCES).optional(),
});

export const bulkNotificationSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  channels: z.array(z.nativeEnum(NOTIFICATION_CHANNELS)).min(1),
  recipientIds: z.array(z.string()).min(1),
  priority: z.nativeEnum(NOTIFICATION_PRIORITIES).optional(),
});

export const createTemplateSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  subject: z.string().default(""),
  bodyTemplate: z.string().min(1),
  channel: z.nativeEnum(NOTIFICATION_CHANNELS),
  eventSource: z.nativeEnum(NOTIFICATION_EVENT_SOURCES),
  eventKey: z.string().min(1),
  variables: z.array(z.string()).default([]),
});

export const createCampaignSchema = z.object({
  name: z.string().min(1),
  description: z.string().default(""),
  templateId: z.string().nullable().optional(),
  channels: z.array(z.nativeEnum(NOTIFICATION_CHANNELS)).min(1),
  recipientIds: z.array(z.string()).min(1),
  scheduledAt: z.string().nullable().optional(),
});

export const createRuleSchema = z.object({
  name: z.string().min(1),
  eventSource: z.nativeEnum(NOTIFICATION_EVENT_SOURCES),
  eventKey: z.string().min(1),
  templateId: z.string().optional(),
  channels: z.array(z.nativeEnum(NOTIFICATION_CHANNELS)).min(1),
  isActive: z.boolean().default(true),
});

export const updatePreferenceSchema = z.object({
  channel: z.nativeEnum(NOTIFICATION_CHANNELS),
  eventSource: z.nativeEnum(NOTIFICATION_EVENT_SOURCES),
  eventKey: z.string().min(1),
  isEnabled: z.boolean(),
  quietHoursStart: z.string().nullable().optional(),
  quietHoursEnd: z.string().nullable().optional(),
});

export const retryDeliverySchema = z.object({
  deliveryId: z.string().min(1),
});

export const webhookPayloadSchema = z.object({
  deliveryId: z.string().min(1),
  status: z.enum(["delivered", "failed", "bounced"]),
  messageId: z.string().optional(),
  errorMessage: z.string().optional(),
});

export type NotificationSearchSchemaInput = z.infer<typeof notificationSearchSchema>;
export type SendNotificationSchemaInput = z.infer<typeof sendNotificationSchema>;
export type BulkNotificationSchemaInput = z.infer<typeof bulkNotificationSchema>;
export type CreateTemplateSchemaInput = z.infer<typeof createTemplateSchema>;
export type CreateCampaignSchemaInput = z.infer<typeof createCampaignSchema>;
export type CreateRuleSchemaInput = z.infer<typeof createRuleSchema>;
export type UpdatePreferenceSchemaInput = z.infer<typeof updatePreferenceSchema>;
export type RetryDeliverySchemaInput = z.infer<typeof retryDeliverySchema>;
export type WebhookPayloadSchemaInput = z.infer<typeof webhookPayloadSchema>;
