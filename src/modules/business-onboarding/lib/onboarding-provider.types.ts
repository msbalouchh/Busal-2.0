import type { WorkspaceCreationData } from "@/modules/business-onboarding/types/onboarding.types";

/** @deprecated Use WorkspaceProvisioningProvider from workspace-provisioning.types.ts */
export interface OnboardingProvider {
  saveProgress(step: number, data: Partial<WorkspaceCreationData>): Promise<{ success: boolean }>;
  complete(data: WorkspaceCreationData): Promise<{ workspaceId: string; businessCode: string }>;
  sendTeamInvites(email: string): Promise<{ message: string }>;
}
