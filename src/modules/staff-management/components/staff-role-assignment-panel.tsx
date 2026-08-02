"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { assignStaffRolesManagementAction } from "@/modules/staff-management/actions/staff-management-actions";
import type { SerializedStaffMember } from "@/modules/staff/types/staff-management-types";
import type { RoleData } from "@/services/staff-management.service";

interface StaffRoleAssignmentPanelProps {
  member: SerializedStaffMember;
  roles: RoleData[];
  disabled?: boolean;
}

export function StaffRoleAssignmentPanel({
  member,
  roles,
  disabled = false,
}: StaffRoleAssignmentPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>(
    member.roles.map((role) => role.id),
  );

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds((current) =>
      current.includes(roleId) ? current.filter((id) => id !== roleId) : [...current, roleId],
    );
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        await assignStaffRolesManagementAction({
          staffId: member.id,
          roleIds: selectedRoleIds,
        });
        toast.success("Roles updated");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to assign roles");
      }
    });
  };

  return (
    <section className="space-y-4 rounded-xl border p-4 sm:p-6" aria-label="Role assignment">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Role assignment</h3>
          <p className="text-muted-foreground text-sm">Manage RBAC roles for this staff member.</p>
        </div>
        <Button type="button" disabled={disabled || isPending} onClick={handleSave}>
          Save roles
        </Button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => (
          <label
            key={role.id}
            className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
          >
            <input
              type="checkbox"
              disabled={disabled || isPending}
              checked={selectedRoleIds.includes(role.id)}
              onChange={() => toggleRole(role.id)}
            />
            <span>{role.name}</span>
          </label>
        ))}
      </div>
    </section>
  );
}
