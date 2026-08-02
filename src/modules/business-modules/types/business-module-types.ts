export type IndustryModuleIconKey =
  | "utensils-crossed"
  | "scissors"
  | "stethoscope"
  | "shopping-bag"
  | "hotel"
  | "dumbbell"
  | "pill"
  | "graduation-cap"
  | "building-2"
  | "briefcase"
  | "car";

export type IndustryModuleCategory = "Industry" | "Operations" | "Platform";

export interface IndustryModuleRouteDefinition {
  dashboard: string;
  settings?: string;
}

export interface IndustryModuleDefinition {
  moduleKey: string;
  displayName: string;
  iconKey: IndustryModuleIconKey;
  description: string;
  version: string;
  category: IndustryModuleCategory;
  permissions: string[];
  routes: IndustryModuleRouteDefinition;
  futureCapabilities: string[];
}

export interface SerializedIndustryModuleDefinition {
  moduleKey: string;
  displayName: string;
  iconKey: IndustryModuleIconKey;
  description: string;
  version: string;
  category: IndustryModuleCategory;
  permissions: string[];
  routes: IndustryModuleRouteDefinition;
  futureCapabilities: string[];
}

export function serializeIndustryModuleDefinition(
  definition: IndustryModuleDefinition,
): SerializedIndustryModuleDefinition {
  return {
    moduleKey: definition.moduleKey,
    displayName: definition.displayName,
    iconKey: definition.iconKey,
    description: definition.description,
    version: definition.version,
    category: definition.category,
    permissions: definition.permissions,
    routes: definition.routes,
    futureCapabilities: definition.futureCapabilities,
  };
}
