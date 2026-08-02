import type { Metadata } from "next";

import { BusinessOnboardingWizard } from "@/modules/business-onboarding/components/business-onboarding-wizard";

export const metadata: Metadata = {
  title: "Create Your Workspace",
};

/** TODO: Restore ensureBusinessSetupAccess + server profile hydration when onboarding API is live. */
export default function BusinessOnboardingPage() {
  return <BusinessOnboardingWizard />;
}
