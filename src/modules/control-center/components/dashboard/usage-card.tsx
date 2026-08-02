import type { LucideIcon } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface UsageCardProps {
  title: string;
  value: string;
  description?: string;
  icon?: LucideIcon;
  className?: string;
}

export function UsageCard({ title, value, description, icon: Icon, className }: UsageCardProps) {
  return (
    <Card className={cn(className)} data-component="usage-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        {Icon ? <Icon className="text-muted-foreground h-4 w-4" aria-hidden="true" /> : null}
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;

  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

export function formatStorageUsage(bytes: number): string {
  return formatBytes(bytes);
}

export function formatTokenUsage(tokens: number): string {
  return new Intl.NumberFormat("en-GB", { notation: "compact" }).format(tokens);
}

export function formatRequestCount(count: number): string {
  return new Intl.NumberFormat("en-GB").format(count);
}
