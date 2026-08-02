import { z } from "zod";

import { BUSINESS_TYPE_OPTIONS } from "@/modules/onboarding/lib/business-interview-questions";

const businessTypeValues = BUSINESS_TYPE_OPTIONS.map((option) => option.value);

export const businessIdentitySchema = z.object({
  businessName: z.string().trim().min(2, "Business name is required"),
  businessType: z.enum(businessTypeValues as [string, ...string[]], {
    required_error: "Select a business type",
  }),
});

export const businessRegionSchema = z.object({
  industry: z.string().trim().min(2, "Industry is required"),
  country: z.string().trim().min(2, "Country is required"),
  currency: z.string().trim().min(3, "Currency is required"),
  timezone: z.string().trim().min(2, "Timezone is required"),
});

export const businessContactSchema = z.object({
  phone: z.string().trim().min(6, "Phone number is required"),
  businessEmail: z.string().trim().email("Enter a valid business email"),
});

export type BusinessIdentityValues = z.infer<typeof businessIdentitySchema>;
export type BusinessRegionValues = z.infer<typeof businessRegionSchema>;
export type BusinessContactValues = z.infer<typeof businessContactSchema>;
