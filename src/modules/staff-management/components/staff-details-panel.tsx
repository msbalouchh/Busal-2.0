"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  archiveStaffManagementAction,
  restoreStaffManagementAction,
} from "@/modules/staff-management/actions/staff-management-actions";
import { StaffBranchAssignmentPanel } from "@/modules/staff-management/components/staff-branch-assignment-panel";
import { StaffRoleAssignmentPanel } from "@/modules/staff-management/components/staff-role-assignment-panel";
import { StaffStatusBadge } from "@/modules/staff-management/components/staff-status-badge";
import { STAFF_MANAGEMENT_ROUTES } from "@/modules/staff-management/constants/routes";
import type { StaffManagementContext } from "@/modules/staff-management/lib/get-staff-management-context";
import { getStaffInitials } from "@/modules/staff/utils/staff-profile";
import type { SerializedStaffMember } from "@/modules/staff/types/staff-management-types";

interface StaffDetailsPanelProps {
  context: StaffManagementContext;
  member: SerializedStaffMember;
}

export function StaffDetailsPanel({ context, member }: StaffDetailsPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleArchive = () => {
    startTransition(async () => {
      try {
        await archiveStaffManagementAction(member.id);
        toast.success("Staff member archived");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to archive staff member");
      }
    });
  };

  const handleRestore = () => {
    startTransition(async () => {
      try {
        await restoreStaffManagementAction(member.id);
        toast.success("Staff member restored");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to restore staff member");
      }
    });
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 text-primary flex h-16 w-16 items-center justify-center rounded-full text-lg font-semibold">
              {getStaffInitials(member.firstName, member.lastName)}
            </div>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                {member.fullName || `${member.firstName} ${member.lastName}`}
              </h2>
              <p className="text-muted-foreground text-sm">
                {member.jobTitle || "No job title"} · {member.employeeCode || "No employee code"}
              </p>
              <div className="mt-2">
                <StaffStatusBadge
                  employmentStatus={member.employmentStatus}
                  isActive={member.isActive}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {context.permissionsFlags.canUpdate ? (
              <Button asChild variant="outline">
                <Link href={STAFF_MANAGEMENT_ROUTES.edit(member.id)}>Edit profile</Link>
              </Button>
            ) : null}
            {context.permissionsFlags.canDelete && member.isActive ? (
              <Button variant="destructive" disabled={isPending} onClick={handleArchive}>
                Archive
              </Button>
            ) : null}
            {context.permissionsFlags.canUpdate && !member.isActive ? (
              <Button disabled={isPending} onClick={handleRestore}>
                Restore
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3 rounded-xl border p-4 sm:p-6">
          <h3 className="text-lg font-semibold">Contact</h3>
          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Email</dt>
              <dd>{member.email || "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Phone</dt>
              <dd>{member.phone || "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Department</dt>
              <dd>{member.department || "—"}</dd>
            </div>
          </dl>
        </section>

        <section className="space-y-3 rounded-xl border p-4 sm:p-6">
          <h3 className="text-lg font-semibold">Employment</h3>
          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Hire date</dt>
              <dd>{member.hireDate ? member.hireDate.slice(0, 10) : "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Salary type</dt>
              <dd>{member.salaryType || "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Roles</dt>
              <dd>{member.roles.map((role) => role.name).join(", ") || "—"}</dd>
            </div>
          </dl>
        </section>
      </div>

      {context.permissionsFlags.canAssignRole ? (
        <StaffRoleAssignmentPanel member={member} roles={context.roles} disabled={isPending} />
      ) : null}

      {context.permissionsFlags.canAssignBranch ? (
        <StaffBranchAssignmentPanel
          member={member}
          branches={context.branches}
          disabled={isPending}
        />
      ) : null}

      {member.profile.notes ? (
        <section className="rounded-xl border p-4 sm:p-6">
          <h3 className="mb-2 text-lg font-semibold">Notes</h3>
          <p className="text-muted-foreground text-sm whitespace-pre-wrap">
            {member.profile.notes}
          </p>
        </section>
      ) : null}
    </div>
  );
}
