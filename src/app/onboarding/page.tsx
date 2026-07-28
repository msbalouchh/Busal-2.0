import type { Metadata } from "next";

import { OnboardingLayout } from "@/modules/onboarding/components/onboarding-layout";
import { OnboardingStepView } from "@/modules/onboarding/components/onboarding-step-view";
import {
  clampOnboardingStep,
  getDefaultOnboardingStepConfig,
  getOnboardingStepConfig,
  ONBOARDING_TOTAL_STEPS,
} from "@/modules/onboarding/config/onboarding-steps";
import { ensureOnboardingAccess } from "@/modules/onboarding/lib/onboarding-guard";

export const metadata: Metadata = {
  title: "Onboarding",
};

export default async function OnboardingPage() {
  const { profile } = await ensureOnboardingAccess();
  const step = clampOnboardingStep(profile.onboardingStep);
  const stepConfig = getOnboardingStepConfig(step) ?? getDefaultOnboardingStepConfig();

  return (
    <OnboardingLayout
      title={stepConfig.title}
      description={stepConfig.description}
      step={step}
      totalSteps={ONBOARDING_TOTAL_STEPS}
    >
      <OnboardingStepView profile={profile} StepComponent={stepConfig.component} />
    </OnboardingLayout>
  );
}
