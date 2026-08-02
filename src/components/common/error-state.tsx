"use client";

import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  retry?: {
    label?: string;
    onClick: () => void;
  };
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this content. Please try again.",
  icon,
  retry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "bg-destructive/5 border-destructive/30 flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center sm:p-12",
        className,
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className="bg-destructive/10 mb-4 flex h-12 w-12 items-center justify-center rounded-full">
        {icon ?? <AlertCircle className="text-destructive h-6 w-6" aria-hidden="true" />}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {description ? (
        <p className="text-muted-foreground mt-2 max-w-sm text-sm">{description}</p>
      ) : null}
      {retry ? (
        <Button className="mt-6" variant="outline" onClick={retry.onClick}>
          {retry.label ?? "Try again"}
        </Button>
      ) : null}
    </div>
  );
}
