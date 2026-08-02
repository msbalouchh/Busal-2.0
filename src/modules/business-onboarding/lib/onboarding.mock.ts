import {
  DEFAULT_ACCENT_COLOR,
  DEFAULT_PRIMARY_COLOR,
  DEFAULT_SECONDARY_COLOR,
} from "@/modules/business-onboarding/constants/onboarding-options";
import {
  generateBusinessId,
  generateTenantId,
  generateWorkspaceSlug,
} from "@/modules/business-onboarding/lib/workspace-identifiers";
import type { WorkspaceProvisioningProvider } from "@/modules/business-onboarding/lib/workspace-provisioning.types";
import type { ProvisionedWorkspace } from "@/modules/business-onboarding/types/workspace.types";
import type {
  WorkspaceCreationData,
  WorkspaceWizardStep,
} from "@/modules/business-onboarding/types/onboarding.types";

const MOCK_DELAY_MS = 1200;

function delay(ms = MOCK_DELAY_MS) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export const DEFAULT_WORKSPACE_DATA: WorkspaceCreationData = {
  businessName: "",
  legalBusinessName: "",
  displayName: "",
  businessType: "",
  industry: "",
  businessEmail: "",
  phone: "",
  website: "",
  taxNumber: "",
  registrationNumber: "",
  workspaceSlug: generateWorkspaceSlug("workspace"),
  businessId: generateBusinessId(),
  tenantId: generateTenantId(),
  country: "",
  state: "",
  city: "",
  address: "",
  postalCode: "",
  timezone: "",
  currency: "",
  language: "",
  dateFormat: "DD/MM/YYYY",
  timeFormat: "24h",
  structure: "single",
  branchCount: 1,
  defaultBranchName: "Main Branch",
  primaryColor: DEFAULT_PRIMARY_COLOR,
  secondaryColor: DEFAULT_SECONDARY_COLOR,
  accentColor: DEFAULT_ACCENT_COLOR,
  themePreference: "dark",
  logoDataUrl: null,
  modules: [],
  aiAgents: [],
  teamInvites: [],
  subscriptionPlan: "trial",
};

/** @deprecated */
export const DEFAULT_ONBOARDING_DATA = DEFAULT_WORKSPACE_DATA;

/**
 * Mock implementation of `WorkspaceProvisioningProvider["saveProgress"]`.
 * Typed against the future provider contract so the real
 * `WorkspaceProvisioningProvider` implementation is a drop-in replacement.
 */
export const mockSaveWorkspaceProgress: WorkspaceProvisioningProvider["saveProgress"] = async (
  step: WorkspaceWizardStep,
  data: Partial<WorkspaceCreationData>,
) => {
  await delay(300);
  void step;
  void data;
  return { success: true as const };
};

/**
 * Mock implementation of `WorkspaceProvisioningProvider["provision"]`.
 * Typed against the future provider contract (backed by
 * `DatabaseProvisioningAdapter`, `StripeProvisioningAdapter`, and
 * `AiInitializationAdapter`) so swapping in the real implementation
 * requires no changes to callers.
 */
export const mockProvisionWorkspace: WorkspaceProvisioningProvider["provision"] = async (
  data: WorkspaceCreationData,
): Promise<ProvisionedWorkspace> => {
  await delay(4000);

  const now = new Date().toISOString();

  return {
    tenant: {
      id: data.tenantId,
      slug: data.workspaceSlug,
      name: data.displayName,
      status: "active",
      createdAt: now,
    },
    workspace: {
      id: `WS-${data.businessId.replace("BUS-", "")}`,
      tenantId: data.tenantId,
      name: data.displayName,
      slug: data.workspaceSlug,
      status: "ready",
      ownerId: "mock-owner",
    },
    business: {
      id: data.businessId,
      tenantId: data.tenantId,
      workspaceId: `WS-${data.businessId.replace("BUS-", "")}`,
      legalName: data.legalBusinessName,
      displayName: data.displayName,
      businessType: data.businessType,
      industry: data.industry,
      email: data.businessEmail,
      phone: data.phone,
      website: data.website || null,
      taxNumber: data.taxNumber || null,
      registrationNumber: data.registrationNumber || null,
    },
    organization: {
      id: `ORG-${data.businessId.replace("BUS-", "")}`,
      tenantId: data.tenantId,
      workspaceId: `WS-${data.businessId.replace("BUS-", "")}`,
      structure: data.structure,
      branchCount: data.branchCount,
      defaultBranchName: data.defaultBranchName,
    },
    defaultBranch: {
      id: `BR-${data.businessId.replace("BUS-", "")}-001`,
      tenantId: data.tenantId,
      organizationId: `ORG-${data.businessId.replace("BUS-", "")}`,
      name: data.defaultBranchName,
      isDefault: true,
      country: data.country,
      city: data.city,
      timezone: data.timezone,
      currency: data.currency,
    },
    subscription: {
      planId: data.subscriptionPlan,
      trial: data.subscriptionPlan === "trial",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
    },
    modules: data.modules.map((moduleId) => ({
      moduleId,
      enabled: true,
      tenantId: data.tenantId,
    })),
    ai: {
      tenantId: data.tenantId,
      enabledAgents: data.aiAgents,
      orchestratorId: null,
    },
    brand: {
      tenantId: data.tenantId,
      logoUrl: data.logoDataUrl,
      primaryColor: data.primaryColor,
      secondaryColor: data.secondaryColor,
      accentColor: data.accentColor,
      themePreference: data.themePreference,
    },
  };
};

/**
 * Mock team invitation sender.
 *
 * Note: `WorkspaceProvisioningProvider["sendTeamInvites"]` expects
 * `{ tenantId, invites }` and returns `{ sent }`. This mock intentionally
 * keeps its original flat signature (invites-only, `{ success, sent }`)
 * to avoid changing call-site behavior. When the real
 * `WorkspaceProvisioningProvider` is wired in, the call site must adapt
 * to the `{ tenantId, invites }` input shape defined by that interface.
 */
export async function mockSendTeamInvites(invites: WorkspaceCreationData["teamInvites"]) {
  await delay(400);
  void invites;
  return { success: true as const, sent: invites.length };
}

/** @deprecated */
export const mockSaveOnboardingProgress = mockSaveWorkspaceProgress;
/** @deprecated */
export const mockCompleteOnboarding = mockProvisionWorkspace;
