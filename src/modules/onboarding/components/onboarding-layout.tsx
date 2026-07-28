"use client";

import type { ReactNode } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface OnboardingLayoutProps {
  title: string;
  description: string;
  step: number;
  totalSteps: number;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function OnboardingLayout({
  title,
  description,
  step,
  totalSteps,
  children,
  footer,
  className,
}: OnboardingLayoutProps) {
  return (
    <div className={cn("w-full max-w-lg space-y-6", className)}>
      <p className="text-muted-foreground text-center text-sm">
        Step {step} of {totalSteps}
      </p>

      <Card className="shadow-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
        {footer ? <div className="border-t px-6 pb-6">{footer}</div> : null}
      </Card>
    </div>
  );
}
