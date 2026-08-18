"use client";

import { useCallback, useState } from "react";

import { saveWorkspaceWizardProgressAction } from "@/modules/business-onboarding/actions/business-setup-actions";
import { WORKSPACE_FORM_STEP_MAP } from "@/modules/business-onboarding/constants/workspace-steps";
import { useWorkspaceWizardStore } from "@/modules/business-onboarding/store/onboarding.store";
import type { WorkspaceWizardStep } from "@/modules/business-onboarding/types/onboarding.types";

function extractWorkspaceData(state: ReturnType<typeof useWorkspaceWizardStore.getState>) {
  const {
    currentStep: _step,
    setStep: _setStep,
    nextStep: _next,
    prevStep: _prev,
    patch: _patch,
    reset: _reset,
    ...data
  } = state;
  return data;
}

export function useWorkspaceWizard() {
  const { currentStep, nextStep, prevStep, setStep } = useWorkspaceWizardStore();
  const [isSaving, setIsSaving] = useState(false);

  const persistAndAdvance = useCallback(async () => {
    setIsSaving(true);
    try {
      const state = useWorkspaceWizardStore.getState();
      await saveWorkspaceWizardProgressAction({
        step: state.currentStep,
        data: extractWorkspaceData(state),
      });
      nextStep();
    } finally {
      setIsSaving(false);
    }
  }, [nextStep]);

  const submitActiveForm = useCallback(() => {
    const formId = WORKSPACE_FORM_STEP_MAP[currentStep];
    if (!formId) {
      void persistAndAdvance();
      return;
    }
    const form = document.getElementById(formId) as HTMLFormElement | null;
    form?.requestSubmit();
  }, [currentStep, persistAndAdvance]);

  const startProvisioning = useCallback(async () => {
    setIsSaving(true);
    try {
      const state = useWorkspaceWizardStore.getState();
      await saveWorkspaceWizardProgressAction({
        step: state.currentStep,
        data: extractWorkspaceData(state),
      });
      setStep(10 as WorkspaceWizardStep);
    } finally {
      setIsSaving(false);
    }
  }, [setStep]);

  return {
    currentStep,
    isSaving,
    nextStep,
    prevStep,
    setStep,
    persistAndAdvance,
    submitActiveForm,
    startProvisioning,
  };
}
