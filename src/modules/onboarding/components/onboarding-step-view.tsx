"use client";

import { useRouter } from "next/navigation";
import { type ComponentType } from "react";

import { advanceOnboardingStepAction } from "@/modules/onboarding/actions/onboarding-actions";
import type { OnboardingStepProps } from "@/modules/onboarding/types/onboarding-step";
import type { BusinessProfileData } from "@/types/business-profile";

interface OnboardingStepViewProps {
  profile: BusinessProfileData;
  StepComponent: ComponentType<OnboardingStepProps>;
}

export function OnboardingStepView({ profile, StepComponent }: OnboardingStepViewProps) {
  const router = useRouter();

  const handleNext = async () => {
    await advanceOnboardingStepAction();
    router.refresh();
  };

  const handleBack = async () => {
    // Back navigation will be implemented in a future onboarding step.
  };

  return <StepComponent business={profile} onNext={handleNext} onBack={handleBack} />;
}
