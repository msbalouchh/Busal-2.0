"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ROUTES } from "@/constants/routes";
import { finalizeWorkspaceOnboardingAction, confirmBillingActivationAction } from "@/modules/business-onboarding/actions/business-setup-actions";
import { OnboardingButton } from "@/modules/business-onboarding/components/onboarding-ui";
import { useWorkspaceWizardStore } from "@/modules/business-onboarding/store/onboarding.store";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";

export function CompleteStep() {
  const router = useRouter();
  const reset = useWorkspaceWizardStore((s) => s.reset);
  const displayName = useWorkspaceWizardStore((s) => s.displayName);
  const wizardData = useWorkspaceWizardStore();
  const [isEntering, setIsEntering] = useState(false);
  const [enterError, setEnterError] = useState<string | null>(null);

  async function enterBusal() {
    setIsEntering(true);
    setEnterError(null);

    try {
      await confirmBillingActivationAction();
      await finalizeWorkspaceOnboardingAction({
        businessName: wizardData.businessName,
        displayName: wizardData.displayName,
        businessType: wizardData.businessType,
        industry: wizardData.industry,
        country: wizardData.country,
        timezone: wizardData.timezone,
        currency: wizardData.currency,
        defaultBranchName: wizardData.defaultBranchName,
        phone: wizardData.phone,
        businessEmail: wizardData.businessEmail,
      });
      reset();
      router.push(ROUTES.dashboard);
    } catch {
      setEnterError("Could not finish setup. Please try again.");
    } finally {
      setIsEntering(false);
    }
  }

  return (
    <div className="onboarding__complete">
      <span className="onboarding__complete-icon" aria-hidden="true">
        🎉
      </span>
      <h2 className="onboarding__card-title">Congratulations</h2>
      <p className="onboarding__complete-copy onboarding__complete-copy--lead">
        Your Business Workspace is Ready
      </p>
      <p className="onboarding__complete-copy onboarding__complete-copy--detail">
        {displayName ? `${displayName} is provisioned` : "Your workspace is provisioned"} with
        tenant, modules, permissions, and AI configuration.
      </p>
      {enterError ? (
        <p className="onboarding__field-error" role="alert">
          {enterError}
        </p>
      ) : null}
      <div className="onboarding__complete-actions">
        <OnboardingButton
          isLoading={isEntering}
          loadingLabel="Entering Busal OS…"
          onClick={() => void enterBusal()}
        >
          Enter Busal OS
        </OnboardingButton>
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
