import type {
  CompatibilityContext,
  CompatibilityResult,
} from "@/modules/marketplace/types/marketplace-types";

function compareVersions(current: string, required: string): boolean {
  const currentParts = current.split(".").map(Number);
  const requiredParts = required.split(".").map(Number);

  for (let index = 0; index < 3; index += 1) {
    const currentValue = currentParts[index] ?? 0;
    const requiredValue = requiredParts[index] ?? 0;

    if (currentValue > requiredValue) {
      return true;
    }

    if (currentValue < requiredValue) {
      return false;
    }
  }

  return true;
}

export function validateMarketplaceCompatibility(
  input: {
    minBusalVersion: string | null;
    requiredModules: string[];
    requiredIndustries: string[];
    requiresAi: boolean;
    dependencies: string[];
    permissionsRequired: string[];
  },
  context: CompatibilityContext,
): CompatibilityResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (input.minBusalVersion && !compareVersions(context.busalVersion, input.minBusalVersion)) {
    errors.push(`Requires Busal ${input.minBusalVersion} or later`);
  }

  for (const moduleName of input.requiredModules) {
    if (!context.installedModules.includes(moduleName)) {
      errors.push(`Required module missing: ${moduleName}`);
    }
  }

  if (
    input.requiredIndustries.length > 0 &&
    context.industry &&
    !input.requiredIndustries.includes(context.industry)
  ) {
    errors.push(`Not compatible with industry: ${context.industry}`);
  }

  if (input.requiresAi && !context.hasAiFeatures) {
    errors.push("Requires AI platform features");
  }

  for (const dependency of input.dependencies) {
    if (!context.installedDependencies.includes(dependency)) {
      errors.push(`Missing dependency: ${dependency}`);
    }
  }

  for (const permission of input.permissionsRequired) {
    if (!context.permissions.includes(permission)) {
      warnings.push(`Permission recommended: ${permission}`);
    }
  }

  return {
    compatible: errors.length === 0,
    errors,
    warnings,
  };
}
