"use client";

import { useRouter } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { OnboardingButton } from "@/modules/business-onboarding/components/onboarding-ui";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";
import { useWorkspaceWizardStore } from "@/modules/business-onboarding/store/onboarding.store";

export function CompleteStep() {
  const router = useRouter();
  const reset = useWorkspaceWizardStore((s) => s.reset);
  const displayName = useWorkspaceWizardStore((s) => s.displayName);

  function enterBusal() {
    reset();
    router.push(ROUTES.application);
  }

  return (
    <div className="onboarding__complete">
      <span className="onboarding__complete-icon" aria-hidden="true">
        🎉
      </span>
      <h2 className="onboarding__card-title">Congratulations</h2>
      <p className="max-w-sm text-base font-medium text-white/85">
        Your Business Workspace is Ready
      </p>
      <p className="max-w-sm text-sm leading-relaxed text-white/55">
        {displayName ? `${displayName} is provisioned` : "Your workspace is provisioned"} with
        tenant, modules, permissions, and AI configuration.
      </p>
      <div className="flex w-full max-w-md flex-col gap-3">
        <OnboardingButton onClick={enterBusal}>Enter Busal OS</OnboardingButton>
        <OnboardingButton
          type="button"
          variant="ghost"
          onClick={() => router.push(MARKETING_ROUTES.bookDemo)}
        >
          Book Onboarding Call
        </OnboardingButton>
        <OnboardingButton
          type="button"
          variant="ghost"
          onClick={() => router.push(MARKETING_ROUTES.resources)}
        >
          Watch Getting Started
        </OnboardingButton>
      </div>
    </div>
  );
}
