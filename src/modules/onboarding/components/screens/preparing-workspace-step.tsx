"use client";

import { Check, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { finalizePreparingWorkspaceAction } from "@/modules/onboarding/actions/onboarding-actions";
import {
  PREPARING_WORKSPACE_ITEM_DELAY_MS,
  PREPARING_WORKSPACE_ITEMS,
} from "@/modules/onboarding/lib/preparing-workspace-items";
import type { OnboardingStepProps } from "@/modules/onboarding/types/onboarding-step";
import { cn } from "@/lib/utils";

export function PreparingWorkspaceStep(_props: OnboardingStepProps) {
  const [completedCount, setCompletedCount] = useState(0);
  const hasFinalizedRef = useRef(false);

  const allComplete = completedCount >= PREPARING_WORKSPACE_ITEMS.length;
  const activeIndex = allComplete ? -1 : completedCount;

  useEffect(() => {
    if (allComplete) {
      return;
    }

    const timer = window.setTimeout(() => {
      setCompletedCount((count) => count + 1);
    }, PREPARING_WORKSPACE_ITEM_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [allComplete, completedCount]);

  useEffect(() => {
    if (!allComplete || hasFinalizedRef.current) {
      return;
    }

    hasFinalizedRef.current = true;

    void finalizePreparingWorkspaceAction();
  }, [allComplete]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return (
    <div aria-busy={!allComplete} className="space-y-6">
      <ul className="space-y-3">
        {PREPARING_WORKSPACE_ITEMS.map((item, index) => {
          const isComplete = index < completedCount;
          const isActive = index === activeIndex;
          const isVisible = isComplete || isActive;

          if (!isVisible) {
            return null;
          }

          return (
            <li
              key={item}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-4 py-3 text-sm",
                isComplete ? "bg-muted/40" : "bg-background",
              )}
            >
              {isComplete ? (
                <Check className="text-primary h-4 w-4 shrink-0" aria-hidden />
              ) : (
                <Loader2 className="text-muted-foreground h-4 w-4 shrink-0 animate-spin" />
              )}
              <span className={cn(isComplete ? "text-foreground" : "text-muted-foreground")}>
                {item}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
