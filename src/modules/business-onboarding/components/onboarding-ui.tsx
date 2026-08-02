"use client";

import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

interface OnboardingFieldProps {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
  className?: string;
  hint?: string;
}

export function OnboardingField({
  id,
  label,
  error,
  children,
  className,
  hint,
}: OnboardingFieldProps) {
  return (
    <div className={cn("onboarding__field space-y-2", className)}>
      <label htmlFor={id}>{label}</label>
      {children}
      {hint ? <p className="text-xs text-white/45">{hint}</p> : null}
      {error ? (
        <p className="onboarding__field-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

interface OnboardingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingLabel?: string;
  variant?: "primary" | "ghost";
}

export function OnboardingButton({
  children,
  isLoading,
  loadingLabel,
  variant = "primary",
  className,
  disabled,
  type,
  ...props
}: OnboardingButtonProps) {
  return (
    <button
      type={type ?? "button"}
      className={cn("onboarding__cta", variant === "ghost" && "onboarding__cta--ghost", className)}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 inline h-4 w-4 animate-spin" aria-hidden="true" />
          {loadingLabel ?? "Please wait…"}
        </>
      ) : (
        children
      )}
    </button>
  );
}

export { WorkspaceNavigation } from "@/modules/business-onboarding/components/engine/workspace-navigation";
export { WorkspaceNavigation as OnboardingNav } from "@/modules/business-onboarding/components/engine/workspace-navigation";
