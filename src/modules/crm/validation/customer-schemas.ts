import { z } from "zod";

import { CUSTOMER_STATUSES } from "@/modules/crm/constants/customer-status";

const customerStatusSchema = z.enum([
  CUSTOMER_STATUSES.ACTIVE,
  CUSTOMER_STATUSES.INACTIVE,
  CUSTOMER_STATUSES.PROSPECT,
  CUSTOMER_STATUSES.VIP,
  CUSTOMER_STATUSES.BLOCKED,
]);

export const createCustomerSchema = z.object({
  firstName: z.string().trim().min(1).max(120),
  lastName: z.string().trim().max(120).optional().default(""),
  email: z.string().trim().email().nullable().optional(),
  phone: z.string().trim().max(40).nullable().optional(),
  status: customerStatusSchema.optional(),
  tagIds: z.array(z.string()).optional(),
  segmentIds: z.array(z.string()).optional(),
  branchId: z.string().nullable().optional(),
  marketingConsent: z.boolean().optional(),
  notes: z.string().trim().max(5000).nullable().optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial().extend({
  customerId: z.string().uuid(),
});

export const customerSearchSchema = z.object({
  query: z.string().trim().optional(),
  status: customerStatusSchema.optional(),
  segmentId: z.string().uuid().optional(),
  tagId: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  sortBy: z.enum(["name", "createdAt", "lastOrderAt", "totalSpend"]).optional().default("name"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
  includeDeleted: z.coerce.boolean().optional().default(false),
});

export const addCustomerNoteSchema = z.object({
  customerId: z.string().uuid(),
  content: z.string().trim().min(1).max(5000),
});

export const mergeCustomersSchema = z.object({
  primaryCustomerId: z.string().uuid(),
  secondaryCustomerId: z.string().uuid(),
});

export const customerImportRowSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email().nullable().optional(),
  phone: z.string().trim().nullable().optional(),
  tags: z.string().optional(),
  group: z.string().optional(),
});

export const customerAddressSchema = z.object({
  customerId: z.string().uuid(),
  label: z.string().trim().min(1).max(80),
  line1: z.string().trim().min(1).max(200),
  line2: z.string().trim().max(200).nullable().optional(),
  city: z.string().trim().max(120).optional(),
  region: z.string().trim().max(120).nullable().optional(),
  postalCode: z.string().trim().max(20).optional(),
  country: z.string().trim().max(2).optional().default("GB"),
  isDefault: z.boolean().optional().default(false),
});

export type CreateCustomerPayload = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerPayload = z.infer<typeof updateCustomerSchema>;
export type CustomerSearchPayload = z.infer<typeof customerSearchSchema>;
export type CustomerImportRowPayload = z.infer<typeof customerImportRowSchema>;
