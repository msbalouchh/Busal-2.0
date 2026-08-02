export const ONBOARDING_STEP_META = [
  {
    step: 1,
    title: "Welcome to Busal OS",
    description: "Let's configure your intelligent operating system in a few minutes.",
  },
  {
    step: 2,
    title: "Business information",
    description: "Tell us about your business so Busal OS can adapt to your operation.",
  },
  {
    step: 3,
    title: "Location",
    description: "Set your region, timezone, currency, and language preferences.",
  },
  {
    step: 4,
    title: "Business structure",
    description: "Single location or multi-location — we'll scale with you.",
  },
  {
    step: 5,
    title: "Modules",
    description: "Choose the capabilities you want on day one.",
  },
  {
    step: 6,
    title: "AI setup",
    description: "Define what Busal AI should help your team with.",
  },
  {
    step: 7,
    title: "Branding",
    description: "Upload your logo and colors for a branded workspace.",
  },
  {
    step: 8,
    title: "Invite team",
    description: "Optionally invite staff and assign roles.",
  },
  {
    step: 9,
    title: "Review",
    description: "Confirm everything before we create your workspace.",
  },
] as const;

export const CREATING_MESSAGES = [
  "Preparing workspace…",
  "Configuring AI…",
  "Creating database…",
  "Optimizing operations…",
  "Almost ready…",
] as const;

export const ESTIMATED_SETUP_MINUTES = "2–3 minutes";

export function getOnboardingStepMeta(step: number) {
  return ONBOARDING_STEP_META.find((item) => item.step === step) ?? ONBOARDING_STEP_META[0];
}
