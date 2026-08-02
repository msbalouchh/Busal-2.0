import { Activity } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface HealthCardProps {
  score: number;
  label?: string;
  description?: string;
  className?: string;
}

export function HealthCard({
  score,
  label = "Platform Health",
  description = "Aggregate tenant health across the platform",
  className,
}: HealthCardProps) {
  const percentage = Math.round(score * 100);
  const status = percentage >= 90 ? "Healthy" : percentage >= 70 ? "Degraded" : "Critical";

  return (
    <Card className={cn(className)} data-component="health-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">{label}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Activity className="text-muted-foreground h-4 w-4" aria-hidden="true" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-end justify-between">
          <span className="text-3xl font-bold">{percentage}%</span>
          <span className="text-muted-foreground text-sm">{status}</span>
        </div>
        <div
          className="bg-muted h-2 w-full overflow-hidden rounded-full"
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Platform health ${percentage} percent`}
        >
          <div
            className="bg-primary h-full rounded-full transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
