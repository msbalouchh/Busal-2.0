"use client";

import type { ReactNode } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface WidgetContainerProps {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  loading?: boolean;
  action?: ReactNode;
}

export function WidgetContainer({
  id,
  title,
  description,
  children,
  className,
  loading = false,
  action,
}: WidgetContainerProps) {
  return (
    <Card
      className={cn("h-full", className)}
      data-widget-id={id}
      aria-busy={loading}
      aria-live="polite"
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        {action}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3" aria-hidden="true">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
