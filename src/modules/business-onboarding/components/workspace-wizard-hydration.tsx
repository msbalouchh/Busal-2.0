"use client";

import { useEffect, useRef } from "react";

import { loadWorkspaceWizardDraftAction } from "@/modules/business-onboarding/actions/business-setup-actions";
import { useWorkspaceWizardStore } from "@/modules/business-onboarding/store/onboarding.store";
import type {
  WorkspaceCreationData,
  WorkspaceWizardStep,
} from "@/modules/business-onboarding/types/onboarding.types";

interface WorkspaceWizardHydrationProps {
  businessSetupStep: number;
}

function toWizardStep(value: number): WorkspaceWizardStep | null {
  if (value >= 1 && value <= 11) {
    return value as WorkspaceWizardStep;
  }

  return null;
}

export function WorkspaceWizardHydration({ businessSetupStep }: WorkspaceWizardHydrationProps) {
  const patch = useWorkspaceWizardStore((state) => state.patch);
  const setStep = useWorkspaceWizardStore((state) => state.setStep);
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (hydratedRef.current) {
      return;
    }

    hydratedRef.current = true;

    void loadWorkspaceWizardDraftAction().then((draft) => {
      if (draft?.data) {
        patch(draft.data as Partial<WorkspaceCreationData>);
      }

      const draftStep = draft?.step ? toWizardStep(draft.step) : null;
      if (draftStep) {
        setStep(draftStep);
        return;
      }

      const profileStep = toWizardStep(businessSetupStep);
      if (profileStep) {
        setStep(profileStep);
      }
    });
  }, [businessSetupStep, patch, setStep]);

  return null;
}
