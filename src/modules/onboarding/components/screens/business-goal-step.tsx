"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { saveBusinessGoalAction } from "@/modules/onboarding/actions/onboarding-actions";
import {
  BUSINESS_GOAL_OPTIONS,
  isBusinessGoalValue,
  type BusinessGoalValue,
} from "@/modules/onboarding/lib/business-goals";
import type { OnboardingStepProps } from "@/modules/onboarding/types/onboarding-step";
import { cn } from "@/lib/utils";

function resolveInitialGoal(businessGoal: string | null | undefined): BusinessGoalValue | null {
  if (!businessGoal?.trim()) {
    return null;
  }

  const trimmed = businessGoal.trim();
  return isBusinessGoalValue(trimmed) ? trimmed : null;
}

export function BusinessGoalStep({ business, onNext }: OnboardingStepProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedGoal, setSelectedGoal] = useState<BusinessGoalValue | null>(
    resolveInitialGoal(business.businessGoal),
  );

  const handleSubmit = () => {
    if (!selectedGoal) {
      return;
    }

    startTransition(async () => {
      await saveBusinessGoalAction({ businessGoal: selectedGoal });
      await onNext();
    });
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-3">
        {BUSINESS_GOAL_OPTIONS.map((option) => {
          const isSelected = selectedGoal === option.value;

          return (
            <button
              key={option.value}
              type="button"
              disabled={isPending}
              onClick={() => setSelectedGoal(option.value)}
              className={cn(
                "rounded-lg border p-4 text-left transition-colors",
                "hover:bg-muted/50 focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
                isSelected
                  ? "border-primary bg-primary/5 ring-primary ring-2 ring-offset-2"
                  : "bg-background",
              )}
            >
              <p className="text-sm font-semibold">{option.label}</p>
            </button>
          );
        })}
      </div>

      <Button
        type="button"
        className="h-11 w-full"
        disabled={isPending || !selectedGoal}
        onClick={handleSubmit}
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Continue
      </Button>
    </div>
  );
}
