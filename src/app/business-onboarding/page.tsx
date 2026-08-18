import type { Metadata } from "next";

import { BusinessOnboardingWizard } from "@/modules/business-onboarding/components/business-onboarding-wizard";
import { ensureBusinessSetupAccess } from "@/modules/business-onboarding/actions/business-setup-actions";

export const metadata: Metadata = {
  title: "Create Your Workspace",
};

export default async function BusinessOnboardingPage() {
  const { profile } = await ensureBusinessSetupAccess();
  return <BusinessOnboardingWizard businessSetupStep={profile.businessSetupStep} />;
}
