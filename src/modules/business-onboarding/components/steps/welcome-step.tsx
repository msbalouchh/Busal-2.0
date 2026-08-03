"use client";

import { Clock } from "lucide-react";

import { OnboardingButton } from "@/modules/business-onboarding/components/onboarding-ui";
import { useOnboardingStore } from "@/modules/business-onboarding/store/onboarding.store";

export function WelcomeStep() {
  const nextStep = useOnboardingStore((state) => state.nextStep);

  return (
    <div className="flex w-full min-w-0 flex-col items-stretch gap-6 py-2 text-center">
      <p className="mx-auto w-full max-w-2xl text-base leading-relaxed text-pretty text-white/70">
        You&apos;re minutes away from a unified operating system for operations, customers, finance,
        and AI agents &mdash; built for modern service businesses.
      </p>

      <p className="onboarding__welcome-time">
        <Clock className="h-4 w-4" aria-hidden="true" />
        Estimated setup time: 2&ndash;3 minutes
      </p>

      <OnboardingButton className="mt-2 max-w-sm" onClick={nextStep}>
        Let&apos;s Build Your Workspace
      </OnboardingButton>
    </div>
  );
}
