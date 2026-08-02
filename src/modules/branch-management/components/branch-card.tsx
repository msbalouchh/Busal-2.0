"use client";

import { MapPin } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { BranchStatusBadge } from "@/modules/branch-management/components/branch-status-badge";
import { BRANCH_MANAGEMENT_ROUTES } from "@/modules/branch-management/constants/routes";
import type { BranchManagementPermissions } from "@/modules/branch-management/lib/get-branch-management-context";
import type { BranchManagementRecord } from "@/modules/branch-management/types/branch-management-types";
import { BRANCH_TYPE_OPTIONS } from "@/modules/branch-management/types/branch-management-types";

interface BranchCardProps {
  branch: BranchManagementRecord;
  permissions: BranchManagementPermissions;
}

export function BranchCard({ branch, permissions }: BranchCardProps) {
  const typeLabel =
    BRANCH_TYPE_OPTIONS.find((option) => option.value === branch.type)?.label ?? branch.type;

  return (
    <Card
      className={cn("rounded-xl shadow-sm", motion.cardInteractive)}
      aria-label={`${branch.name} branch card`}
    >
      <CardHeader className="space-y-3 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base tracking-tight">{branch.name}</CardTitle>
            <CardDescription className="font-mono text-xs">{branch.code}</CardDescription>
          </div>
          <BranchStatusBadge status={branch.status} isPrimary={branch.isPrimary} />
        </div>
        <p className="text-muted-foreground text-sm">{typeLabel}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-muted-foreground flex items-start gap-2 text-sm">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            {[branch.addressLine1, branch.city, branch.country].filter(Boolean).join(", ") ||
              "No address"}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline" aria-label={`View ${branch.name}`}>
            <Link href={BRANCH_MANAGEMENT_ROUTES.details(branch.id)}>View</Link>
          </Button>
          {permissions.canUpdate ? (
            <Button asChild size="sm" variant="ghost" aria-label={`Edit ${branch.name}`}>
              <Link href={BRANCH_MANAGEMENT_ROUTES.edit(branch.id)}>Edit</Link>
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
