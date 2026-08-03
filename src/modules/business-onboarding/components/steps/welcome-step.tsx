"use client";

import { Clock } from "lucide-react";

import { OnboardingButton } from "@/modules/business-onboarding/components/onboarding-ui";
import { useOnboardingStore } from "@/modules/business-onboarding/store/onboarding.store";

export function WelcomeStep() {
  const nextStep = useOnboardingStore((state) => state.nextStep);

  return (
    <div className="onboarding__welcome-body">
      <p className="onboarding__welcome-copy">
        You&apos;re minutes away from a unified operating system for operations, customers, finance,
        and AI agents &mdash; built for modern service businesses.
      </p>

      <p className="onboarding__welcome-time">
        <Clock className="h-4 w-4" aria-hidden="true" />
        Estimated setup time: 2&ndash;3 minutes
      </p>

      <OnboardingButton className="onboarding__welcome-cta" onClick={nextStep}>
        Let&apos;s Build Your Workspace
      </OnboardingButton>
    </div>
  );
}
