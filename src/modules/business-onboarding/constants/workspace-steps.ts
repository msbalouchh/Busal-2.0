export const WORKSPACE_STEP_META = [
  {
    step: 1,
    title: "Welcome to Busal OS",
    description:
      "Create your company workspace — the intelligent operating system for modern business.",
  },
  {
    step: 2,
    title: "Business identity",
    description: "Establish your legal entity, contact details, and workspace identifiers.",
  },
  {
    step: 3,
    title: "Location & locale",
    description: "Configure regional settings for branches, billing, and operations.",
  },
  {
    step: 4,
    title: "Organization structure",
    description: "Single or multi-location — built for scalable branch architecture.",
  },
  {
    step: 5,
    title: "Brand identity",
    description: "Logo, colors, and theme — preview your workspace live.",
  },
  {
    step: 6,
    title: "Business modules",
    description: "Enable the capabilities your industry needs on day one.",
  },
  {
    step: 7,
    title: "AI configuration",
    description: "Select AI agents Busal will provision for your workspace.",
  },
  {
    step: 8,
    title: "Invite your team",
    description: "Add staff with roles and permissions — or skip and invite later.",
  },
  {
    step: 9,
    title: "Choose your plan",
    description: "Select a subscription tier — billing integration coming soon.",
  },
] as const;

export const PROVISIONING_MESSAGES = [
  "Creating workspace…",
  "Provisioning database…",
  "Creating tenant…",
  "Preparing AI…",
  "Generating permissions…",
  "Configuring modules…",
  "Setting up dashboard…",
  "Almost ready…",
] as const;

export const ESTIMATED_SETUP_MINUTES = "2 minutes";

export function getWorkspaceStepMeta(step: number) {
  return WORKSPACE_STEP_META.find((item) => item.step === step) ?? WORKSPACE_STEP_META[0];
}

/** Form element IDs for programmatic submit from navigation */
export const WORKSPACE_FORM_IDS = {
  identity: "workspace-form-identity",
  location: "workspace-form-location",
  organization: "workspace-form-organization",
  brand: "workspace-form-brand",
  modules: "workspace-form-modules",
  ai: "workspace-form-ai",
  subscription: "workspace-form-subscription",
} as const;

export const WORKSPACE_FORM_STEP_MAP: Partial<Record<number, string>> = {
  2: WORKSPACE_FORM_IDS.identity,
  3: WORKSPACE_FORM_IDS.location,
  4: WORKSPACE_FORM_IDS.organization,
  5: WORKSPACE_FORM_IDS.brand,
  6: WORKSPACE_FORM_IDS.modules,
  7: WORKSPACE_FORM_IDS.ai,
  9: WORKSPACE_FORM_IDS.subscription,
};
