"use client";

import type { ReactNode } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";

import { cn } from "@/lib/utils";

interface FormWrapperProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  onSubmit: (values: T) => void | Promise<void>;
  children: ReactNode;
  className?: string;
}

export function FormWrapper<T extends FieldValues>({
  form,
  onSubmit,
  children,
  className,
}: FormWrapperProps<T>) {
  return (
    <form className={cn("space-y-6", className)} onSubmit={form.handleSubmit(onSubmit)} noValidate>
      {children}
    </form>
  );
}
