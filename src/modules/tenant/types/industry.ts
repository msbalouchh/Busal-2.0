export const INDUSTRIES = {
  RESTAURANT: "restaurant",
  RETAIL: "retail",
  SERVICES: "services",
} as const;

export type Industry = (typeof INDUSTRIES)[keyof typeof INDUSTRIES];
