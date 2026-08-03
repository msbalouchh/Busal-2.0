"use client";

import type { ReactNode } from "react";

import { BusalLogo } from "@/components/brand/busal-logo";
import { WorkspaceProgress } from "@/modules/business-onboarding/components/engine/workspace-progress";
import { getWorkspaceStepMeta } from "@/modules/business-onboarding/constants/workspace-steps";
import { WORKSPACE_FORM_STEPS } from "@/modules/business-onboarding/types/onboarding.types";

import "@/modules/business-onboarding/styles/onboarding.css";

interface WorkspaceStepEngineProps {
  step: number;
  children: ReactNode;
  footer?: ReactNode;
  hideProgress?: boolean;
}

export function WorkspaceStepEngine({
  step,
  children,
  footer,
  hideProgress,
}: WorkspaceStepEngineProps) {
  const meta = getWorkspaceStepMeta(step);

  return (
    <div className="onboarding">
      <div className="onboarding__inner">
        <header className="onboarding__header">
          <BusalLogo height={44} priority />
          {!hideProgress ? <WorkspaceProgress step={step} /> : null}
        </header>

        <div className="onboarding__card">
          {step <= WORKSPACE_FORM_STEPS ? (
            <div className="onboarding__card-header">
              <h1 className="onboarding__card-title">{meta.title}</h1>
              <p className="onboarding__card-description">{meta.description}</p>
            </div>
          ) : null}

          <div className="onboarding__card-body">{children}</div>
          {footer ? <footer className="onboarding__footer">{footer}</footer> : null}
        </div>
      </div>
    </div>
  );
}

/** @deprecated Use WorkspaceStepEngine */
export const OnboardingShell = WorkspaceStepEngine;
