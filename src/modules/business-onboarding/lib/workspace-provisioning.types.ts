import type { ProvisionedWorkspace } from "@/modules/business-onboarding/types/workspace.types";
import type {
  WorkspaceCreationData,
  WorkspaceWizardStep,
} from "@/modules/business-onboarding/types/onboarding.types";

/** Stripe billing — TODO: integrate @/lib/stripe when ready */
export interface StripeProvisioningAdapter {
  createCustomer(input: { email: string; businessName: string; tenantId: string }): Promise<{
    customerId: string;
  }>;
  attachSubscription(input: {
    customerId: string;
    planId: string;
    trial: boolean;
  }): Promise<{ subscriptionId: string }>;
}

/** Database tenant provisioning — TODO: integrate Prisma transaction layer */
export interface DatabaseProvisioningAdapter {
  createTenantBundle(data: WorkspaceCreationData): Promise<ProvisionedWorkspace>;
  rollbackTenant(tenantId: string): Promise<void>;
}

/** AI platform initialization — TODO: integrate AI orchestrator service */
export interface AiInitializationAdapter {
  provisionAgents(input: {
    tenantId: string;
    agents: string[];
  }): Promise<{ orchestratorId: string }>;
  seedKnowledgeBase(input: { tenantId: string; industry: string }): Promise<void>;
}

/** Full workspace provisioning contract */
export interface WorkspaceProvisioningProvider {
  saveProgress(
    step: WorkspaceWizardStep,
    data: Partial<WorkspaceCreationData>,
  ): Promise<{ success: boolean }>;
  provision(data: WorkspaceCreationData): Promise<ProvisionedWorkspace>;
  sendTeamInvites(input: {
    tenantId: string;
    invites: WorkspaceCreationData["teamInvites"];
  }): Promise<{ sent: number }>;
  stripe?: StripeProvisioningAdapter;
  database?: DatabaseProvisioningAdapter;
  ai?: AiInitializationAdapter;
}
