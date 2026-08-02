"use client";

import { useEffect, useState } from "react";

import { CREATING_MESSAGES } from "@/modules/business-onboarding/constants/onboarding-steps";
import { mockCompleteOnboarding } from "@/modules/business-onboarding/lib/onboarding.mock";
import { useOnboardingStore } from "@/modules/business-onboarding/store/onboarding.store";

export function CreatingStep() {
  const setStep = useOnboardingStore((state) => state.setStep);
  const businessName = useOnboardingStore((state) => state.businessName);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((index) => (index + 1) % CREATING_MESSAGES.length);
    }, 900);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function provision() {
      const state = useOnboardingStore.getState();
      const {
        currentStep: _step,
        setStep: _setStep,
        nextStep: _next,
        prevStep: _prev,
        patch: _patch,
        reset: _reset,
        ...data
      } = state;

      // TODO: Wire to real workspace provisioning API
      await mockCompleteOnboarding(data);

      if (!cancelled) {
        setStep(11);
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
      <p className="onboarding__creating-message">{CREATING_MESSAGES[messageIndex]}</p>
      <p className="text-sm text-white/45">Setting up {businessName || "your workspace"}…</p>
    </div>
  );
}
