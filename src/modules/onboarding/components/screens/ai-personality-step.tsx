"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { saveAiPersonalityAction } from "@/modules/onboarding/actions/onboarding-actions";
import {
  AI_PERSONALITY_OPTIONS,
  type AiPersonalityValue,
} from "@/modules/onboarding/lib/ai-personalities";
import type { OnboardingStepProps } from "@/modules/onboarding/types/onboarding-step";
import { cn } from "@/lib/utils";

export function AiPersonalityStep({ onNext }: OnboardingStepProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedPersonality, setSelectedPersonality] = useState<AiPersonalityValue | null>(null);

  const handleSubmit = () => {
    if (!selectedPersonality) {
      return;
    }

    startTransition(async () => {
      await saveAiPersonalityAction({ aiPersonality: selectedPersonality });
      await onNext();
    });
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-3">
        {AI_PERSONALITY_OPTIONS.map((option) => {
          const isSelected = selectedPersonality === option.value;

          return (
            <button
              key={option.value}
              type="button"
              disabled={isPending}
              onClick={() => setSelectedPersonality(option.value)}
              className={cn(
                "rounded-lg border p-4 text-left transition-colors",
                "hover:bg-muted/50 focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
                isSelected
                  ? "border-primary bg-primary/5 ring-primary ring-2 ring-offset-2"
                  : "bg-background",
              )}
            >
              <p className="text-sm font-semibold">{option.label}</p>
              <p className="text-muted-foreground mt-1 text-sm">{option.description}</p>
            </button>
          );
        })}
      </div>

      <Button
        type="button"
        className="h-11 w-full"
        disabled={isPending || !selectedPersonality}
        onClick={handleSubmit}
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Continue
      </Button>
    </div>
  );
}
