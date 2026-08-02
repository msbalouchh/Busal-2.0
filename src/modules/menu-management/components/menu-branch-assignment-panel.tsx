"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { assignMenuBranchesManagementAction } from "@/modules/menu-management/actions/menu-management-actions";
import type { MenuManagementRecord } from "@/modules/menu-management/types/menu-management-types";
import type { BranchData } from "@/services/staff-management.service";

interface MenuBranchAssignmentPanelProps {
  menu: MenuManagementRecord;
  branches: BranchData[];
  disabled?: boolean;
}

export function MenuBranchAssignmentPanel({
  menu,
  branches,
  disabled = false,
}: MenuBranchAssignmentPanelProps) {
  const [isPending, startTransition] = useTransition();
  const assignedIds = new Set(menu.branchAssignments.map((entry) => entry.branchId));

  const toggleBranch = (branchId: string) => {
    const next = assignedIds.has(branchId)
      ? [...assignedIds].filter((id) => id !== branchId)
      : [...assignedIds, branchId];

    startTransition(async () => {
      try {
        await assignMenuBranchesManagementAction({ menuId: menu.id, branchIds: next });
        toast.success("Branch assignments updated");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to update branch assignments");
      }
    });
  };

  return (
    <section className="space-y-4 rounded-xl border p-4 sm:p-6">
      <div>
        <h3 className="text-lg font-semibold">Branch assignment</h3>
        <p className="text-muted-foreground text-sm">
          Choose which branches can serve this menu. Primary branch is configured on the menu
          profile.
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {branches.map((branch) => {
          const selected = assignedIds.has(branch.id);
          return (
            <Button
              key={branch.id}
              type="button"
              variant={selected ? "default" : "outline"}
              className="justify-start"
              disabled={disabled || isPending}
              aria-pressed={selected}
              onClick={() => toggleBranch(branch.id)}
            >
              {branch.name}
            </Button>
          );
        })}
      </div>
    </section>
  );
}
