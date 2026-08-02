export type BusinessStructure = "single" | "multi";

export type ThemePreference = "light" | "dark" | "system";

export type SubscriptionPlan = "trial" | "starter" | "growth" | "professional" | "enterprise";

export type TeamRole =
  "owner" | "admin" | "manager" | "cashier" | "chef" | "waiter" | "accountant" | "support";

export interface TeamInvite {
  email: string;
  role: TeamRole;
}

/** Wizard-collected data — maps to multi-tenant provisioning payload. */
export interface WorkspaceCreationData {
  businessName: string;
  legalBusinessName: string;
  displayName: string;
  businessType: string;
  industry: string;
  businessEmail: string;
  phone: string;
  website: string;
  taxNumber: string;
  registrationNumber: string;
  workspaceSlug: string;
  businessId: string;
  tenantId: string;
  country: string;
  state: string;
  city: string;
  address: string;
  postalCode: string;
  timezone: string;
  currency: string;
  language: string;
  dateFormat: string;
  timeFormat: string;
  structure: BusinessStructure;
  branchCount: number;
  defaultBranchName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  themePreference: ThemePreference;
  logoDataUrl: string | null;
  modules: string[];
  aiAgents: string[];
  teamInvites: TeamInvite[];
  subscriptionPlan: SubscriptionPlan;
}

/** 1–9 form steps, 10 provisioning, 11 complete */
export type WorkspaceWizardStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

export const WORKSPACE_FORM_STEPS = 9 as const;

/** @deprecated Use WorkspaceCreationData */
export type OnboardingData = WorkspaceCreationData;

/** @deprecated Use WorkspaceWizardStep */
export type OnboardingStep = WorkspaceWizardStep;

/** @deprecated Use WORKSPACE_FORM_STEPS */
export const ONBOARDING_FORM_STEPS = WORKSPACE_FORM_STEPS;

export interface WorkspaceWizardState extends WorkspaceCreationData {
  currentStep: WorkspaceWizardStep;
}
