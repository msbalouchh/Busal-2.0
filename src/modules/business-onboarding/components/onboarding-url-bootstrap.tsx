"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

import { useWorkspaceWizardStore } from "@/modules/business-onboarding/store/onboarding.store";
import type { WorkspaceWizardStep } from "@/modules/business-onboarding/types/onboarding.types";

function parseWizardStep(value: string | null): WorkspaceWizardStep | null {
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 11) {
    return null;
  }

  return parsed as WorkspaceWizardStep;
}

export function OnboardingUrlBootstrap() {
  const searchParams = useSearchParams();
  const setStep = useWorkspaceWizardStore((state) => state.setStep);

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    const billing = searchParams.get("billing");
    const stepParam = searchParams.get("step");

    if (checkout === "success") {
      setStep(11);
      return;
    }

    if (checkout === "cancelled" || billing === "required") {
      setStep(9);
      return;
    }

    const step = parseWizardStep(stepParam);
    if (step) {
      setStep(step);
    }
  }, [searchParams, setStep]);

  return null;
}
