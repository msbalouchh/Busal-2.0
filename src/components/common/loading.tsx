"use client";

import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

export function LoadingSpinner({ className, size = "md" }: LoadingSpinnerProps) {
  return (
    <Loader2
      className={cn(
        "text-muted-foreground motion-safe:animate-spin motion-reduce:animate-none",
        sizeClasses[size],
        className,
      )}
      aria-hidden="true"
    />
  );
}

interface LoadingOverlayProps {
  label?: string;
}

export function LoadingOverlay({ label = "Loading..." }: LoadingOverlayProps) {
  return (
    <div
      className="bg-background/80 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-muted-foreground text-sm">{label}</p>
      </div>
    </div>
  );
}

interface PageLoadingProps {
  label?: string;
}

export function PageLoading({ label = "Loading page..." }: PageLoadingProps) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-muted-foreground text-sm">{label}</p>
      </div>
    </div>
  );
}
