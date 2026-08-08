import { CONTROL_CENTER_ROUTES } from "@/modules/control-center/constants/routes";

export const PLATFORM_INTELLIGENCE_ROUTES = {
  hub: CONTROL_CENTER_ROUTES.intelligence,
} as const;

export const INTELLIGENCE_PAGE_SIZE = 10;

export const INTELLIGENCE_RANGE_OPTIONS = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
  { value: "365", label: "12 months" },
  { value: "all", label: "All time" },
] as const;

export const INTELLIGENCE_DRILL_DOWN_OPTIONS = [
  { value: "platform", label: "Platform" },
  { value: "tenant", label: "Tenant" },
  { value: "workspace", label: "Workspace" },
  { value: "business", label: "Business" },
  { value: "module", label: "Module" },
] as const;
