export const BUSINESS_SETUP_TOTAL_STEPS = 4 as const;

export const CURRENCY_OPTIONS = [
  { value: "GBP", label: "GBP — British Pound" },
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "CAD", label: "CAD — Canadian Dollar" },
  { value: "AUD", label: "AUD — Australian Dollar" },
] as const;

export const INDUSTRY_OPTIONS = [
  { value: "Hospitality", label: "Hospitality & Food Service" },
  { value: "Retail", label: "Retail" },
  { value: "Health & Wellness", label: "Health & Wellness" },
  { value: "Professional Services", label: "Professional Services" },
  { value: "Technology", label: "Technology" },
  { value: "Other", label: "Other" },
] as const;

export const TIMEZONE_OPTIONS = [
  { value: "Europe/London", label: "Europe/London (GMT/BST)" },
  { value: "Europe/Dublin", label: "Europe/Dublin" },
  { value: "Europe/Paris", label: "Europe/Paris" },
  { value: "America/New_York", label: "America/New_York" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles" },
  { value: "Asia/Dubai", label: "Asia/Dubai" },
  { value: "Asia/Singapore", label: "Asia/Singapore" },
  { value: "Australia/Sydney", label: "Australia/Sydney" },
] as const;

export const BUSINESS_SETUP_STEPS = [
  {
    step: 1,
    title: "Business identity",
    description: "Tell us about your business name and type.",
  },
  {
    step: 2,
    title: "Industry & region",
    description: "Set your industry, country, currency, and timezone.",
  },
  {
    step: 3,
    title: "Contact details",
    description: "How can customers and Busal reach your business?",
  },
  {
    step: 4,
    title: "Review & launch",
    description: "Confirm your details and receive your Business ID.",
  },
] as const;

export function clampBusinessSetupStep(step: number): number {
  return Math.min(Math.max(step, 1), BUSINESS_SETUP_TOTAL_STEPS);
}

export function getBusinessSetupStepConfig(step: number) {
  return BUSINESS_SETUP_STEPS.find((item) => item.step === step) ?? BUSINESS_SETUP_STEPS[0];
}
