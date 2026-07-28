"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveMeetYourAiAction } from "@/modules/onboarding/actions/onboarding-actions";
import {
  AI_NAME_PRESETS,
  generateAiName,
  isAiNamePreset,
  resolveInitialAiName,
} from "@/modules/onboarding/lib/ai-names";
import type { OnboardingStepProps } from "@/modules/onboarding/types/onboarding-step";
import { cn } from "@/lib/utils";

export function AiIntroductionStep({ business, onNext }: OnboardingStepProps) {
  const [isPending, startTransition] = useTransition();
  const [ownerName, setOwnerName] = useState(business.ownerName ?? "");
  const [selectedAiName, setSelectedAiName] = useState<string | null>(
    resolveInitialAiName(business.aiName),
  );

  const handleGenerateName = () => {
    setSelectedAiName(generateAiName(selectedAiName ? [selectedAiName] : []));
  };

  const handleSubmit = () => {
    if (!selectedAiName) {
      return;
    }

    startTransition(async () => {
      await saveMeetYourAiAction({
        ownerName: ownerName.trim() || undefined,
        aiName: selectedAiName,
      });
      await onNext();
    });
  };

  return (
    <div className="space-y-8">
      <div className="text-muted-foreground space-y-3 text-center text-sm leading-relaxed">
        <p>Hi 👋</p>
        <p>I&apos;m your AI Business Partner.</p>
        <p>I&apos;ll learn how your business works so I can help automate it.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="owner-name">What should I call you?</Label>
        <Input
          id="owner-name"
          type="text"
          placeholder="Your name (optional)"
          value={ownerName}
          onChange={(event) => setOwnerName(event.target.value)}
          disabled={isPending}
        />
      </div>

      <div className="space-y-3">
        <Label>Choose a name for your AI</Label>
        <div className="grid grid-cols-2 gap-2">
          {AI_NAME_PRESETS.map((name) => (
            <Button
              key={name}
              type="button"
              variant={selectedAiName === name ? "default" : "outline"}
              className={cn("h-10", selectedAiName === name && "ring-primary ring-2 ring-offset-2")}
              disabled={isPending}
              onClick={() => setSelectedAiName(name)}
            >
              {name}
            </Button>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-10 w-full"
          disabled={isPending}
          onClick={handleGenerateName}
        >
          <Sparkles className="h-4 w-4" />
          Generate Name
          {selectedAiName && !isAiNamePreset(selectedAiName) ? `: ${selectedAiName}` : null}
        </Button>
      </div>

      <Button
        type="button"
        className="h-11 w-full"
        disabled={isPending || !selectedAiName}
        onClick={handleSubmit}
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Let&apos;s Get Started
      </Button>
    </div>
  );
}
