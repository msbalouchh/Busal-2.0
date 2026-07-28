"use client";

import { MapPin } from "lucide-react";

import { useBusinessContext } from "@/modules/business-context/components/business-context-provider";

export function BranchSwitcher() {
  const { branchId, branchName, accessibleBranches, switchBranch, isPending } =
    useBusinessContext();

  if (accessibleBranches.length <= 1) {
    return branchName ? (
      <p className="text-muted-foreground truncate text-xs">{branchName}</p>
    ) : null;
  }

  return (
    <label className="flex min-w-0 items-center gap-2">
      <MapPin className="h-3.5 w-3.5 shrink-0" />
      <select
        className="text-muted-foreground max-w-[220px] truncate bg-transparent text-xs outline-none"
        value={branchId ?? ""}
        disabled={isPending}
        onChange={(event) => switchBranch(event.target.value)}
        aria-label="Switch branch"
      >
        {accessibleBranches.map((branch) => (
          <option key={branch.id} value={branch.id}>
            {branch.name}
          </option>
        ))}
      </select>
    </label>
  );
}
