import "server-only";

import { getPrimaryBusinessByOwnerId } from "@/services/business-profile.service";

export type WorkspaceAccessState =
  "no_workspace" | "provisioning_incomplete" | "provisioning_complete";

export interface WorkspaceAccessSnapshot {
  state: WorkspaceAccessState;
  businessId: string | null;
  businessSetupStep: number | null;
}

export async function getWorkspaceAccessSnapshot(
  ownerId: string,
): Promise<WorkspaceAccessSnapshot> {
  const business = await getPrimaryBusinessByOwnerId(ownerId);

  if (!business) {
    return {
      state: "no_workspace",
      businessId: null,
      businessSetupStep: null,
    };
  }

  if (!business.businessSetupCompleted) {
    return {
      state: "provisioning_incomplete",
      businessId: business.id,
      businessSetupStep: business.businessSetupStep,
    };
  }

  return {
    state: "provisioning_complete",
    businessId: business.id,
    businessSetupStep: business.businessSetupStep,
  };
}

export function hasProvisionedWorkspace(snapshot: WorkspaceAccessSnapshot): boolean {
  return snapshot.state === "provisioning_complete";
}
