import type { ConfigEnvironment } from "@prisma/client";

import { CONFIG_ENVIRONMENTS } from "@/modules/settings-engine/constants/routes";

export function normalizeEnvironment(environment?: ConfigEnvironment): ConfigEnvironment {
  if (environment && CONFIG_ENVIRONMENTS.includes(environment)) {
    return environment;
  }

  return "PRODUCTION";
}

export function getEnvironmentFallbackOrder(environment: ConfigEnvironment): ConfigEnvironment[] {
  if (environment === "PRODUCTION") {
    return ["PRODUCTION"];
  }

  return [environment, "PRODUCTION"];
}

export function isProductionEnvironment(environment: ConfigEnvironment): boolean {
  return environment === "PRODUCTION";
}

export function resolveEnvironmentLabel(environment: ConfigEnvironment): string {
  switch (environment) {
    case "DEVELOPMENT":
      return "Development";
    case "STAGING":
      return "Staging";
    default:
      return "Production";
  }
}
