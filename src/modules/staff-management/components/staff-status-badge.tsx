"use client";

import { cn } from "@/lib/utils";
import type { StaffEmploymentStatus } from "@prisma/client";

interface StaffStatusBadgeProps {
  employmentStatus: StaffEmploymentStatus;
  isActive: boolean;
}

export function StaffStatusBadge({ employmentStatus, isActive }: StaffStatusBadgeProps) {
  const label = !isActive
    ? "Archived"
    : employmentStatus === "ACTIVE"
      ? "Active"
      : employmentStatus === "ON_LEAVE"
        ? "On leave"
        : employmentStatus === "PROBATION"
          ? "Probation"
          : "Terminated";

  const tone = !isActive
    ? "bg-muted text-muted-foreground"
    : employmentStatus === "ACTIVE"
      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : employmentStatus === "TERMINATED"
        ? "bg-destructive/10 text-destructive"
        : "bg-amber-500/10 text-amber-700 dark:text-amber-300";

  return (
    <span
      className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", tone)}
      aria-label={`Status: ${label}`}
    >
      {label}
    </span>
  );
}
