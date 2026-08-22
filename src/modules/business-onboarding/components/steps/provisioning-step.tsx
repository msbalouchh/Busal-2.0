"use client";

import { useEffect, useState } from "react";

import { PROVISIONING_MESSAGES } from "@/modules/business-onboarding/constants/workspace-steps";
import {
  provisionWorkspaceAction,
  resolvePostCheckoutOnboardingAction,
} from "@/modules/business-onboarding/actions/business-setup-actions";
import { useWorkspaceWizardStore } from "@/modules/business-onboarding/store/onboarding.store";

export function ProvisioningStep() {
  const setStep = useWorkspaceWizardStore((s) => s.setStep);
  const displayName = useWorkspaceWizardStore((s) => s.displayName);
  const [messageIndex, setMessageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((i) => (i + 1) % PROVISIONING_MESSAGES.length);
    }, 900);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function provision() {
      try {
        const resume = await resolvePostCheckoutOnboardingAction();
        if (!cancelled && resume.skipProvisioning) {
          setStep(resume.redirectToStep);
          return;
        }

        const state = useWorkspaceWizardStore.getState();

        const response = await provisionWorkspaceAction({
          businessName: state.businessName,
          displayName: state.displayName,
          country: state.country,
          timezone: state.timezone,
          defaultBranchName: state.defaultBranchName,
          subscriptionPlan: state.subscriptionPlan,
          businessEmail: state.businessEmail,
        });

        if (!cancelled) {
          if ("checkoutUrl" in response && response.checkoutUrl) {
            window.location.assign(response.checkoutUrl);
            return;
          }
          setStep(11);
        }
      } catch (provisionError) {
        if (!cancelled) {
          const message =
            provisionError instanceof Error
              ? provisionError.message
              : "Provisioning failed. Please refresh and try again.";
          setError(message);
        }
      }
    }
    void provision();
    return () => {
      cancelled = true;
    };
  }, [setStep]);

  return (
    <div className="onboarding__creating" role="status" aria-live="polite">
      <div className="onboarding__creating-orb" aria-hidden="true" />
      <p className="onboarding__creating-message">{PROVISIONING_MESSAGES[messageIndex]}</p>
      <p className="text-sm text-white/45">Provisioning {displayName || "your workspace"}…</p>
      {error ? (
        <p className="onboarding__field-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** @deprecated Use ProvisioningStep */
export const CreatingStep = ProvisioningStep;
