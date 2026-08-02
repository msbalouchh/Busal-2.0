"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { assignStaffBranchesManagementAction } from "@/modules/staff-management/actions/staff-management-actions";
import type { SerializedStaffMember } from "@/modules/staff/types/staff-management-types";
import type { BranchData } from "@/services/staff-management.service";

interface StaffBranchAssignmentPanelProps {
  member: SerializedStaffMember;
  branches: BranchData[];
  disabled?: boolean;
}

export function StaffBranchAssignmentPanel({
  member,
  branches,
  disabled = false,
}: StaffBranchAssignmentPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [branchIds, setBranchIds] = useState<string[]>(
    member.branchAssignments.map((entry) => entry.branchId),
  );
  const [primaryBranchId, setPrimaryBranchId] = useState<string | null>(
    member.branchAssignments.find((entry) => entry.isPrimary)?.branchId ?? member.branchId,
  );

  const toggleBranch = (branchId: string) => {
    setBranchIds((current) => {
      const next = current.includes(branchId)
        ? current.filter((id) => id !== branchId)
        : [...current, branchId];
      setPrimaryBranchId((primary) =>
        primary && next.includes(primary) ? primary : (next[0] ?? null),
      );
      return next;
    });
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        await assignStaffBranchesManagementAction({
          staffId: member.id,
          branchIds,
          primaryBranchId,
        });
        toast.success("Branch assignments updated");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to assign branches");
      }
    });
  };

  return (
    <section className="space-y-4 rounded-xl border p-4 sm:p-6" aria-label="Branch assignment">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Branch assignment</h3>
          <p className="text-muted-foreground text-sm">
            Assign one or more branches and set a primary location.
          </p>
        </div>
        <Button type="button" disabled={disabled || isPending} onClick={handleSave}>
          Save branches
        </Button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {branches.map((branch) => (
          <label
            key={branch.id}
            className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
          >
            <input
              type="checkbox"
              disabled={disabled || isPending}
              checked={branchIds.includes(branch.id)}
              onChange={() => toggleBranch(branch.id)}
            />
            <span>{branch.name}</span>
          </label>
        ))}
      </div>
      <div className="space-y-2">
        <Label htmlFor="staff-detail-primary-branch">Primary branch</Label>
        <select
          id="staff-detail-primary-branch"
          className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
          disabled={disabled || isPending}
          value={primaryBranchId ?? ""}
          onChange={(event) => setPrimaryBranchId(event.target.value || null)}
        >
          <option value="">Select primary branch</option>
          {branchIds.map((branchId) => {
            const branch = branches.find((entry) => entry.id === branchId);
            return (
              <option key={branchId} value={branchId}>
                {branch?.name ?? branchId}
              </option>
            );
          })}
        </select>
      </div>
    </section>
  );
}
