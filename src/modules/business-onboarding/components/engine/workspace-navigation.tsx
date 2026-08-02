"use client";

import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

interface WorkspaceNavigationProps {
  onBack: () => void;
  showBack: boolean;
  onNext: () => void;
  isLoading?: boolean;
  nextLabel: string;
}

export function WorkspaceNavigation({
  onBack,
  showBack,
  onNext,
  isLoading,
  nextLabel,
}: WorkspaceNavigationProps) {
  return (
    <>
      {showBack ? (
        <button
          type="button"
          className="onboarding__cta onboarding__cta--ghost"
          onClick={onBack}
          disabled={isLoading}
        >
          Back
        </button>
      ) : (
        <span />
      )}
      <button
        type="button"
        className={cn("onboarding__cta")}
        onClick={onNext}
        disabled={isLoading}
        aria-busy={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 inline h-4 w-4 animate-spin" aria-hidden="true" />
            Please wait…
          </>
        ) : (
          nextLabel
        )}
      </button>
    </>
  );
}
