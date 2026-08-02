"use client";

import { ESTIMATED_SETUP_MINUTES } from "@/modules/business-onboarding/constants/workspace-steps";
import { WORKSPACE_FORM_STEPS } from "@/modules/business-onboarding/types/onboarding.types";

interface WorkspaceProgressProps {
  step: number;
}

export function WorkspaceProgress({ step }: WorkspaceProgressProps) {
  const activeStep = Math.min(step, WORKSPACE_FORM_STEPS);
  const progress = Math.round((activeStep / WORKSPACE_FORM_STEPS) * 100);

  return (
    <div className="onboarding__progress-wrap">
      <div className="onboarding__progress-meta">
        <span>
          Step {activeStep} of {WORKSPACE_FORM_STEPS}
        </span>
        <span className="onboarding__welcome-time">~{ESTIMATED_SETUP_MINUTES}</span>
      </div>
      <div
        className="onboarding__progress-bar"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        aria-label={`Setup progress ${progress}%`}
      >
        <div className="onboarding__progress-fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
