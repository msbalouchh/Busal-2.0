"use client";

import { useEffect, useState } from "react";

import { PROVISIONING_MESSAGES } from "@/modules/business-onboarding/constants/workspace-steps";
import { provisionWorkspaceAction } from "@/modules/business-onboarding/actions/business-setup-actions";
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
      const state = useWorkspaceWizardStore.getState();
      const businessName = state.displayName.trim() || state.businessName.trim();

      try {
        await provisionWorkspaceAction({
          businessName: state.businessName,
          displayName: state.displayName,
          country: state.country,
          timezone: state.timezone,
          defaultBranchName: state.defaultBranchName,
          subscriptionPlan: state.subscriptionPlan,
          businessEmail: state.businessEmail,
        });

        if (!cancelled) {
          setStep(11);
        }
      } catch {
        if (!cancelled) {
          setError("Provisioning failed. Please refresh and try again.");
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
