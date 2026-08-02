"use client";

import { useMemo } from "react";

import { WorkspaceStepEngine } from "@/modules/business-onboarding/components/engine/workspace-step-engine";
import { WorkspaceNavigation } from "@/modules/business-onboarding/components/onboarding-ui";
import { AiConfigurationStep } from "@/modules/business-onboarding/components/steps/ai-configuration-step";
import { BrandIdentityStep } from "@/modules/business-onboarding/components/steps/brand-identity-step";
import { BusinessIdentityStep } from "@/modules/business-onboarding/components/steps/business-identity-step";
import { CompleteStep } from "@/modules/business-onboarding/components/steps/complete-step";
import { LocationStep } from "@/modules/business-onboarding/components/steps/location-step";
import { ModulesStep } from "@/modules/business-onboarding/components/steps/modules-step";
import { OrganizationStructureStep } from "@/modules/business-onboarding/components/steps/organization-structure-step";
import { ProvisioningStep } from "@/modules/business-onboarding/components/steps/provisioning-step";
import { SubscriptionStep } from "@/modules/business-onboarding/components/steps/subscription-step";
import { TeamStep } from "@/modules/business-onboarding/components/steps/team-step";
import { WelcomeStep } from "@/modules/business-onboarding/components/steps/welcome-step";
import { useWorkspaceWizard } from "@/modules/business-onboarding/hooks/use-workspace-wizard";
import { WORKSPACE_FORM_STEPS } from "@/modules/business-onboarding/types/onboarding.types";

export function BusinessOnboardingWizard() {
  const { currentStep, isSaving, prevStep, persistAndAdvance, submitActiveForm } =
    useWorkspaceWizard();

  const footer = useMemo(() => {
    if ([1, 8, 10, 11].includes(currentStep)) return null;

    return (
      <WorkspaceNavigation
        onBack={prevStep}
        showBack={currentStep > 1}
        onNext={currentStep === 9 ? submitActiveForm : submitActiveForm}
        isLoading={isSaving}
        nextLabel={currentStep === 9 ? "Create workspace" : "Continue"}
      />
    );
  }, [currentStep, isSaving, prevStep, submitActiveForm]);

  if (currentStep === 11) {
    return (
      <WorkspaceStepEngine step={WORKSPACE_FORM_STEPS} hideProgress>
        <CompleteStep />
      </WorkspaceStepEngine>
    );
  }

  if (currentStep === 10) {
    return (
      <WorkspaceStepEngine step={10} hideProgress>
        <ProvisioningStep />
      </WorkspaceStepEngine>
    );
  }

  return (
    <WorkspaceStepEngine step={currentStep} footer={footer}>
      {currentStep === 1 ? <WelcomeStep /> : null}
      {currentStep === 2 ? (
        <BusinessIdentityStep onContinue={() => void persistAndAdvance()} />
      ) : null}
      {currentStep === 3 ? <LocationStep onContinue={() => void persistAndAdvance()} /> : null}
      {currentStep === 4 ? (
        <OrganizationStructureStep onContinue={() => void persistAndAdvance()} />
      ) : null}
      {currentStep === 5 ? <BrandIdentityStep onContinue={() => void persistAndAdvance()} /> : null}
      {currentStep === 6 ? <ModulesStep onContinue={() => void persistAndAdvance()} /> : null}
      {currentStep === 7 ? (
        <AiConfigurationStep onContinue={() => void persistAndAdvance()} />
      ) : null}
      {currentStep === 8 ? (
        <TeamStep
          onContinue={() => void persistAndAdvance()}
          onSkip={() => void persistAndAdvance()}
        />
      ) : null}
      {currentStep === 9 ? <SubscriptionStep onContinue={() => void persistAndAdvance()} /> : null}
    </WorkspaceStepEngine>
  );
}
