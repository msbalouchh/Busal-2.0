import type { ComponentType } from "react";

import type { BusinessProfileData } from "@/types/business-profile";

export interface OnboardingStepProps {
  business: BusinessProfileData;
  onNext: () => void | Promise<void>;
  onBack: () => void | Promise<void>;
}

export interface OnboardingStepDefinition {
  step: number;
  slug: string;
  title: string;
  component: ComponentType<OnboardingStepProps>;
}

export interface OnboardingStepConfig extends OnboardingStepDefinition {
  description: string;
}
