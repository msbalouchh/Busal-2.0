"use client";

import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

interface AuthSubmitButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingLabel?: string;
}

export function AuthSubmitButton({
  children,
  isLoading,
  loadingLabel,
  className,
  disabled,
  type = "submit",
  ...props
}: AuthSubmitButtonProps) {
  return (
    <button
      type={type}
      className={cn("auth-submit", className)}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="auth-submit__spinner mr-2 inline h-4 w-4" aria-hidden="true" />
          {loadingLabel ?? "Please wait…"}
        </>
      ) : (
        children
      )}
    </button>
  );
}
