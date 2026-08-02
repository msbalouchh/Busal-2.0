"use client";

import { useEffect, useState } from "react";

import { PROVISIONING_MESSAGES } from "@/modules/business-onboarding/constants/workspace-steps";
import { mockProvisionWorkspace } from "@/modules/business-onboarding/lib/onboarding.mock";
import { useWorkspaceWizardStore } from "@/modules/business-onboarding/store/onboarding.store";

export function ProvisioningStep() {
  const setStep = useWorkspaceWizardStore((s) => s.setStep);
  const displayName = useWorkspaceWizardStore((s) => s.displayName);
  const [messageIndex, setMessageIndex] = useState(0);

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
      const {
        currentStep: _s,
        setStep: _set,
        nextStep: _n,
        prevStep: _p,
        patch: _pa,
        reset: _r,
        ...payload
      } = state;
      // TODO: WorkspaceProvisioningProvider.provision()
      await mockProvisionWorkspace(payload);
      if (!cancelled) setStep(11);
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
    </div>
  );
}

/** @deprecated Use ProvisioningStep */
export const CreatingStep = ProvisioningStep;
