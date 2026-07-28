import type { MarketplaceInstallAction, MarketplaceInstallStatus } from "@prisma/client";

import { validateMarketplaceCompatibility } from "@/modules/marketplace/engine/compatibility-engine";
import type {
  CompatibilityContext,
  InstallationRequest,
} from "@/modules/marketplace/types/marketplace-types";

export interface InstallationEngineDependencies {
  getItemVersion: (versionId: string) => Promise<{
    id: string;
    itemId: string;
    versionNumber: number;
    minBusalVersion: string | null;
    requiredModules: string[];
    requiredIndustries: string[];
    requiresAi: boolean;
    status: string;
  } | null>;
  getItem: (itemId: string) => Promise<{
    id: string;
    dependencies: string[];
    permissionsRequired: string[];
    status: string;
  } | null>;
  getInstallation: (
    businessId: string,
    itemId: string,
  ) => Promise<{
    id: string;
    versionId: string;
    previousVersionId: string | null;
    status: string;
  } | null>;
  getInstalledSlugs: (businessId: string) => Promise<string[]>;
  upsertInstallation: (input: {
    businessId: string;
    itemId: string;
    versionId: string;
    previousVersionId?: string | null;
    status: MarketplaceInstallStatus;
  }) => Promise<{ id: string }>;
  recordHistory: (
    input: InstallationRequest & {
      status: MarketplaceInstallStatus;
      installationId?: string | null;
    },
  ) => Promise<void>;
}

export async function runInstallationAction(
  request: InstallationRequest,
  context: CompatibilityContext,
  dependencies: InstallationEngineDependencies,
): Promise<{ installationId: string; status: MarketplaceInstallStatus }> {
  const item = await dependencies.getItem(request.itemId);
  const version = await dependencies.getItemVersion(request.versionId);

  if (!item || !version) {
    throw new Error("Marketplace item or version not found");
  }

  if (item.status !== "PUBLISHED" && request.action === "INSTALL") {
    throw new Error("Item is not published");
  }

  if (request.action !== "UNINSTALL") {
    const compatibility = validateMarketplaceCompatibility(
      {
        minBusalVersion: version.minBusalVersion,
        requiredModules: version.requiredModules,
        requiredIndustries: version.requiredIndustries,
        requiresAi: version.requiresAi,
        dependencies: item.dependencies,
        permissionsRequired: item.permissionsRequired,
      },
      context,
    );

    if (!compatibility.compatible) {
      throw new Error(compatibility.errors.join("; "));
    }
  }

  const existing = await dependencies.getInstallation(request.businessId, request.itemId);
  const isActiveInstallation =
    existing?.status === "INSTALLED" || existing?.status === "ROLLED_BACK";

  if (request.action === "INSTALL" && isActiveInstallation) {
    throw new Error("Item is already installed");
  }

  if ((request.action === "UPDATE" || request.action === "ROLLBACK") && !isActiveInstallation) {
    throw new Error("Item is not installed");
  }

  if (request.action === "UNINSTALL") {
    if (!isActiveInstallation || !existing) {
      throw new Error("Item is not installed");
    }

    await dependencies.recordHistory({
      ...request,
      installationId: existing.id,
      status: "UNINSTALLED",
    });

    await dependencies.upsertInstallation({
      businessId: request.businessId,
      itemId: request.itemId,
      versionId: existing.versionId,
      previousVersionId: existing.previousVersionId,
      status: "UNINSTALLED",
    });

    return { installationId: existing.id, status: "UNINSTALLED" };
  }

  const status: MarketplaceInstallStatus =
    request.action === "ROLLBACK" ? "ROLLED_BACK" : "INSTALLED";

  const installation = await dependencies.upsertInstallation({
    businessId: request.businessId,
    itemId: request.itemId,
    versionId: request.versionId,
    previousVersionId: existing?.versionId ?? null,
    status,
  });

  await dependencies.recordHistory({
    ...request,
    installationId: installation.id,
    fromVersionId: existing?.versionId ?? request.fromVersionId ?? null,
    status,
  });

  return { installationId: installation.id, status };
}

export function mapActionToStatus(action: MarketplaceInstallAction): MarketplaceInstallStatus {
  switch (action) {
    case "INSTALL":
    case "UPDATE":
      return "INSTALLED";
    case "ROLLBACK":
      return "ROLLED_BACK";
    case "UNINSTALL":
      return "UNINSTALLED";
    default:
      return "INSTALLED";
  }
}
