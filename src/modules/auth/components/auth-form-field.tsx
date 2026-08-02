"use client";

import type { ReactNode } from "react";
import type { FieldError } from "react-hook-form";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface AuthFormFieldProps {
  id: string;
  label: string;
  error?: FieldError;
  children: ReactNode;
  className?: string;
}

export function AuthFormField({ id, label, error, children, className }: AuthFormFieldProps) {
  return (
    <div className={cn("auth-field space-y-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p className="auth-field__error" role="alert">
          {error.message}
        </p>
      ) : null}
    </div>
  );
}
