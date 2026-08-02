import type { Metadata } from "next";

import { BusinessSetupStepView } from "@/modules/business-onboarding/components/business-setup-step-view";
import { ensureBusinessSetupAccess } from "@/modules/business-onboarding/actions/business-setup-actions";

export const metadata: Metadata = {
  title: "Business Setup",
};

export const dynamic = "force-dynamic";

export default async function BusinessOnboardingPage() {
  const { user, profile } = await ensureBusinessSetupAccess();

  return <BusinessSetupStepView profile={profile} userEmail={user.email} />;
}
