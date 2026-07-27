export const INDUSTRIES = {
  RESTAURANT: "restaurant",
  RETAIL: "retail",
  SERVICES: "services",
} as const;

export type Industry = (typeof INDUSTRIES)[keyof typeof INDUSTRIES];

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  industry: Industry;
}
