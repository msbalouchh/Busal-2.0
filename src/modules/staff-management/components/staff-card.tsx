"use client";

import Link from "next/link";
import { Mail, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { STAFF_MANAGEMENT_ROUTES } from "@/modules/staff-management/constants/routes";
import { StaffStatusBadge } from "@/modules/staff-management/components/staff-status-badge";
import type { StaffManagementPermissions } from "@/modules/staff-management/lib/get-staff-management-context";
import { getStaffInitials } from "@/modules/staff/utils/staff-profile";
import type { SerializedStaffMember } from "@/modules/staff/types/staff-management-types";

interface StaffCardProps {
  member: SerializedStaffMember;
  permissions: StaffManagementPermissions;
}

export function StaffCard({ member, permissions }: StaffCardProps) {
  const primaryBranch =
    member.branchAssignments.find((entry) => entry.isPrimary)?.branchName ??
    member.branch?.name ??
    "No branch";

  return (
    <Card
      className={cn("rounded-xl shadow-sm", motion.cardInteractive)}
      aria-label={`${member.fullName || member.firstName} staff card`}
    >
      <CardHeader className="space-y-3 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold">
              {getStaffInitials(member.firstName, member.lastName)}
            </div>
            <div>
              <CardTitle className="text-base tracking-tight">
                {member.fullName || `${member.firstName} ${member.lastName}`}
              </CardTitle>
              <CardDescription className="font-mono text-xs">
                {member.employeeCode || "No code"}
              </CardDescription>
            </div>
          </div>
          <StaffStatusBadge employmentStatus={member.employmentStatus} isActive={member.isActive} />
        </div>
        <p className="text-muted-foreground text-sm">
          {member.jobTitle || "No title"} · {member.roles[0]?.name ?? "No role"}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-muted-foreground text-sm">{primaryBranch}</p>
        <div className="text-muted-foreground space-y-1 text-sm">
          {member.email ? (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{member.email}</span>
            </div>
          ) : null}
          {member.phone ? (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{member.phone}</span>
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href={STAFF_MANAGEMENT_ROUTES.details(member.id)}>View</Link>
          </Button>
          {permissions.canUpdate ? (
            <Button asChild size="sm" variant="ghost">
              <Link href={STAFF_MANAGEMENT_ROUTES.edit(member.id)}>Edit</Link>
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
