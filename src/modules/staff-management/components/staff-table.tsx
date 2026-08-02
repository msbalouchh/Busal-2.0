"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { STAFF_MANAGEMENT_ROUTES } from "@/modules/staff-management/constants/routes";
import { StaffStatusBadge } from "@/modules/staff-management/components/staff-status-badge";
import type { StaffManagementPermissions } from "@/modules/staff-management/lib/get-staff-management-context";
import { getStaffInitials } from "@/modules/staff/utils/staff-profile";
import type { SerializedStaffMember } from "@/modules/staff/types/staff-management-types";

interface StaffTableProps {
  items: SerializedStaffMember[];
  permissions: StaffManagementPermissions;
}

export function StaffTable({ items, permissions }: StaffTableProps) {
  if (items.length === 0) {
    return (
      <p className="text-muted-foreground rounded-lg border p-6 text-center text-sm">
        No staff members match your filters.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table aria-label="Staff directory table">
        <TableHeader>
          <TableRow>
            <TableHead>Staff member</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Branch</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((member) => {
            const primaryBranch =
              member.branchAssignments.find((entry) => entry.isPrimary)?.branchName ??
              member.branch?.name ??
              "—";

            return (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold">
                      {getStaffInitials(member.firstName, member.lastName)}
                    </div>
                    <div>
                      <p className="font-medium">
                        {member.fullName || `${member.firstName} ${member.lastName}`}
                      </p>
                      <p className="text-muted-foreground text-xs">{member.email || "No email"}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs">{member.employeeCode || "—"}</TableCell>
                <TableCell>{member.roles[0]?.name ?? "—"}</TableCell>
                <TableCell>{primaryBranch}</TableCell>
                <TableCell>{member.department || "—"}</TableCell>
                <TableCell>
                  <StaffStatusBadge
                    employmentStatus={member.employmentStatus}
                    isActive={member.isActive}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={STAFF_MANAGEMENT_ROUTES.details(member.id)}>View</Link>
                    </Button>
                    {permissions.canUpdate ? (
                      <Button asChild size="sm" variant="ghost">
                        <Link href={STAFF_MANAGEMENT_ROUTES.edit(member.id)}>Edit</Link>
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
