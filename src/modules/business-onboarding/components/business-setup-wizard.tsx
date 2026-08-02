"use client";

import type { ReactNode } from "react";

import { OnboardingLayout } from "@/modules/onboarding/components/onboarding-layout";

interface BusinessSetupWizardProps {
  title: string;
  description: string;
  step: number;
  totalSteps: number;
  children: ReactNode;
}

export function BusinessSetupWizard({
  title,
  description,
  step,
  totalSteps,
  children,
}: BusinessSetupWizardProps) {
  const progress = Math.round((step / totalSteps) * 100);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-4 py-10">
      <div className="mb-4">
        <div
          className="bg-muted h-2 w-full overflow-hidden rounded-full"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-label={`Setup progress ${progress}%`}
        >
          <div
            className="bg-primary h-full transition-[width] duration-300 motion-reduce:transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <OnboardingLayout title={title} description={description} step={step} totalSteps={totalSteps}>
        {children}
      </OnboardingLayout>
    </div>
  );
}
