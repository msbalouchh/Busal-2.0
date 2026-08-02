import "server-only";

import { prisma } from "@/lib/prisma";
import { getOwnedBusinessId } from "@/services/app-marketplace-context.service";

export interface CompatibilityResult {
  compatible: boolean;
  reason?: string;
  simulated: boolean;
}

export async function checkAppCompatibility(
  ownerId: string,
  appId: string,
): Promise<CompatibilityResult> {
  const businessId = await getOwnedBusinessId(ownerId);
  const app = await prisma.platformMarketplaceApp.findFirst({ where: { id: appId } });
  if (!app || app.status !== "PUBLISHED") {
    return { compatible: false, reason: "App is not available", simulated: true };
  }

  const metadata =
    app.metadata && typeof app.metadata === "object" && !Array.isArray(app.metadata)
      ? (app.metadata as Record<string, unknown>)
      : {};
  const requiredModules = Array.isArray(metadata.requiredModules)
    ? (metadata.requiredModules as string[])
    : [];

  if (requiredModules.includes("enterprise-only")) {
    return { compatible: false, reason: "Requires enterprise plan", simulated: true };
  }

  void businessId;
  return { compatible: true, simulated: true };
}

export function validateSandboxPermissions(required: string[], granted: string[]): boolean {
  if (required.length === 0) return true;
  return required.every((perm) => granted.includes(perm) || granted.includes("*"));
}
