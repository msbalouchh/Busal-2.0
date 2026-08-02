import { create } from "zustand";
import { persist } from "zustand/middleware";

import { DEFAULT_WORKSPACE_DATA } from "@/modules/business-onboarding/lib/onboarding.mock";
import type {
  WorkspaceCreationData,
  WorkspaceWizardStep,
} from "@/modules/business-onboarding/types/onboarding.types";

interface WorkspaceWizardStore extends WorkspaceCreationData {
  currentStep: WorkspaceWizardStep;
  setStep: (step: WorkspaceWizardStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  patch: (data: Partial<WorkspaceCreationData>) => void;
  reset: () => void;
}

const initialState = {
  currentStep: 1 as WorkspaceWizardStep,
  ...DEFAULT_WORKSPACE_DATA,
};

export const useWorkspaceWizardStore = create<WorkspaceWizardStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      setStep: (step) => set({ currentStep: step }),
      nextStep: () => {
        const next = Math.min(get().currentStep + 1, 11) as WorkspaceWizardStep;
        set({ currentStep: next });
      },
      prevStep: () => {
        const prev = Math.max(get().currentStep - 1, 1) as WorkspaceWizardStep;
        set({ currentStep: prev });
      },
      patch: (data) => set(data),
      reset: () => set(initialState),
    }),
    { name: "busal-workspace-wizard-v2" },
  ),
);

/** @deprecated Use useWorkspaceWizardStore */
export const useOnboardingStore = useWorkspaceWizardStore;
