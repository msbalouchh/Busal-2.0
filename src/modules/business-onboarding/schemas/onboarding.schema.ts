import { z } from "zod";

import { BUSAL_COMMERCIAL_PLAN_SLUGS } from "@/modules/control-center/billing/registry/subscription-plan-registry";

const emailSchema = z.string().trim().email("Enter a valid business email");
const colorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color");
const optionalUrl = z.union([z.literal(""), z.string().trim().url("Enter a valid URL")]);

export const businessIdentitySchema = z.object({
  businessName: z.string().trim().min(2, "Business name is required"),
  legalBusinessName: z.string().trim().min(2, "Legal business name is required"),
  displayName: z.string().trim().min(2, "Display name is required"),
  businessType: z.string().trim().min(1, "Select a business type"),
  industry: z.string().trim().min(1, "Select an industry"),
  businessEmail: emailSchema,
  phone: z.string().trim().min(6, "Phone number is required"),
  website: optionalUrl,
  taxNumber: z.string().trim(),
  registrationNumber: z.string().trim(),
});

export const locationSchema = z.object({
  country: z.string().trim().min(1, "Select a country"),
  state: z.string().trim().min(1, "State / region is required"),
  city: z.string().trim().min(2, "City is required"),
  address: z.string().trim().min(3, "Address is required"),
  postalCode: z.string().trim().min(2, "Postal code is required"),
  timezone: z.string().trim().min(1, "Select a timezone"),
  currency: z.string().trim().min(1, "Select a currency"),
  language: z.string().trim().min(1, "Select a language"),
  dateFormat: z.string().trim().min(1, "Select a date format"),
  timeFormat: z.enum(["12h", "24h"]),
});

export const organizationSchema = z
  .object({
    structure: z.enum(["single", "multi"]),
    branchCount: z.coerce.number().int().min(1).max(5000),
    defaultBranchName: z.string().trim().min(2, "Default branch name is required"),
  })
  .refine((data) => data.structure === "single" || data.branchCount >= 2, {
    message: "Multi-location requires at least 2 branches",
    path: ["branchCount"],
  });

export const brandIdentitySchema = z.object({
  primaryColor: colorSchema,
  secondaryColor: colorSchema,
  accentColor: colorSchema,
  themePreference: z.enum(["light", "dark", "system"]),
  logoDataUrl: z.string().nullable(),
});

export const modulesSchema = z.object({
  modules: z.array(z.string()).min(1, "Select at least one module"),
});

export const aiConfigurationSchema = z.object({
  aiAgents: z.array(z.string()).min(1, "Select at least one AI agent"),
});

export const teamInviteSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  role: z.enum(["owner", "admin", "manager", "cashier", "chef", "waiter", "accountant", "support"]),
});

export const subscriptionSchema = z.object({
  subscriptionPlan: z.enum([
    "trial",
    BUSAL_COMMERCIAL_PLAN_SLUGS.CORE,
    BUSAL_COMMERCIAL_PLAN_SLUGS.GROWTH,
    BUSAL_COMMERCIAL_PLAN_SLUGS.PRO,
    BUSAL_COMMERCIAL_PLAN_SLUGS.ENTERPRISE,
  ]),
});

export type BusinessIdentityValues = z.infer<typeof businessIdentitySchema>;
export type LocationValues = z.infer<typeof locationSchema>;
export type OrganizationValues = z.infer<typeof organizationSchema>;
export type BrandIdentityValues = z.infer<typeof brandIdentitySchema>;
export type ModulesValues = z.infer<typeof modulesSchema>;
export type AiConfigurationValues = z.infer<typeof aiConfigurationSchema>;
export type TeamInviteValues = z.infer<typeof teamInviteSchema>;
export type SubscriptionValues = z.infer<typeof subscriptionSchema>;

/** @deprecated */
export const businessInfoSchema = businessIdentitySchema;
/** @deprecated */
export type BusinessInfoValues = BusinessIdentityValues;
/** @deprecated */
export const structureSchema = organizationSchema;
/** @deprecated */
export type StructureValues = OrganizationValues;
/** @deprecated */
export const brandingSchema = brandIdentitySchema;
/** @deprecated */
export type BrandingValues = BrandIdentityValues;
/** @deprecated */
export const aiSetupSchema = aiConfigurationSchema;
/** @deprecated */
export type AiSetupValues = AiConfigurationValues;
