"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ControlCenterErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ControlCenterErrorState({
  title = "Unable to load control center",
  description = "Something went wrong while loading platform data. Please try again.",
  onRetry,
}: ControlCenterErrorStateProps) {
  return (
    <Card className="mx-6 my-8" data-component="error-state">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertTriangle className="text-destructive h-5 w-5" aria-hidden="true" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {onRetry ? (
        <CardContent>
          <Button onClick={onRetry}>Try again</Button>
        </CardContent>
      ) : null}
    </Card>
  );
}
