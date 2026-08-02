"use client";

import {
  BUSINESS_SETUP_TOTAL_STEPS,
  clampBusinessSetupStep,
  getBusinessSetupStepConfig,
} from "@/modules/business-onboarding/constants/business-setup-steps";
import { BusinessSetupWizard } from "@/modules/business-onboarding/components/business-setup-wizard";
import { BusinessContactStep } from "@/modules/business-onboarding/components/steps/business-contact-step";
import { BusinessIdentityStep } from "@/modules/business-onboarding/components/steps/business-identity-step";
import { BusinessRegionStep } from "@/modules/business-onboarding/components/steps/business-region-step";
import { BusinessReviewStep } from "@/modules/business-onboarding/components/steps/business-review-step";
import type { BusinessSetupProfile } from "@/services/business-setup.service";

interface BusinessSetupStepViewProps {
  profile: BusinessSetupProfile;
  userEmail: string;
}

export function BusinessSetupStepView({ profile, userEmail }: BusinessSetupStepViewProps) {
  const step = clampBusinessSetupStep(profile.businessSetupStep);
  const stepConfig = getBusinessSetupStepConfig(step);

  return (
    <BusinessSetupWizard
      title={stepConfig.title}
      description={stepConfig.description}
      step={step}
      totalSteps={BUSINESS_SETUP_TOTAL_STEPS}
    >
      {step === 1 ? <BusinessIdentityStep profile={profile} /> : null}
      {step === 2 ? <BusinessRegionStep profile={profile} /> : null}
      {step === 3 ? <BusinessContactStep profile={profile} userEmail={userEmail} /> : null}
      {step === 4 ? <BusinessReviewStep profile={profile} /> : null}
    </BusinessSetupWizard>
  );
}
