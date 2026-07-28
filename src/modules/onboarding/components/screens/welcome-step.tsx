"use client";

import { Loader2 } from "lucide-react";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import type { OnboardingStepProps } from "@/modules/onboarding/types/onboarding-step";

const PREPARED_ITEMS = ["Dashboard", "Customers", "Orders", "Team", "AI Automations"] as const;

export function WelcomeStep({ business, onNext }: OnboardingStepProps) {
  const [isPending, startTransition] = useTransition();
  const aiName = business.aiName?.trim() || "Busal AI";

  const handleContinue = () => {
    startTransition(async () => {
      await onNext();
    });
  };

  return (
    <div className="space-y-8">
      <p className="text-muted-foreground text-center text-sm leading-relaxed">
        Instead of filling out long forms, I&apos;ll learn about your business through a short
        conversation and prepare your workspace automatically.
      </p>

      <div className="bg-muted/50 space-y-4 rounded-lg border p-5">
        <div className="space-y-1">
          <p className="text-sm font-semibold">Hi! I&apos;m {aiName}.</p>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Over the next few minutes I&apos;ll learn how your business works.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Then I&apos;ll prepare:</p>
          <ul className="text-muted-foreground space-y-1.5 text-sm">
            {PREPARED_ITEMS.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span aria-hidden className="bg-primary h-1 w-1 shrink-0 rounded-full" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-muted-foreground text-sm leading-relaxed">
          Everything will be customised for your business.
        </p>
      </div>

      <Button type="button" className="h-11 w-full" disabled={isPending} onClick={handleContinue}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Continue
      </Button>
    </div>
  );
}
