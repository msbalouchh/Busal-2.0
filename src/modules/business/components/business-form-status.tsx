"use client";

import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

type FormSaveState = "idle" | "saving" | "saved" | "error";

interface BusinessFormStatusProps {
  state: FormSaveState;
  errorMessage?: string;
}

export function BusinessFormStatus({ state, errorMessage }: BusinessFormStatusProps) {
  if (state === "idle") {
    return null;
  }

  if (state === "saving") {
    return (
      <p className="text-muted-foreground flex items-center gap-2 text-sm" role="status">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Saving changes…
      </p>
    );
  }

  if (state === "saved") {
    return (
      <p className="text-muted-foreground flex items-center gap-2 text-sm" role="status">
        <CheckCircle2 className="h-4 w-4 text-green-600" aria-hidden="true" />
        All changes saved
      </p>
    );
  }

  return (
    <p className="text-destructive flex items-center gap-2 text-sm" role="alert">
      <AlertCircle className="h-4 w-4" aria-hidden="true" />
      {errorMessage ?? "Unable to save changes"}
    </p>
  );
}
