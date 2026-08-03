import type { Metadata } from "next";

import { BusinessOnboardingWizard } from "@/modules/business-onboarding/components/business-onboarding-wizard";
import { ensureBusinessSetupAccess } from "@/modules/business-onboarding/actions/business-setup-actions";

export const metadata: Metadata = {
  title: "Create Your Workspace",
};

export default async function BusinessOnboardingPage() {
  await ensureBusinessSetupAccess();
  return <BusinessOnboardingWizard />;
}
