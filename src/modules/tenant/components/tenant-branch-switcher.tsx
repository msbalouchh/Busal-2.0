"use client";

import { useBranch } from "@/modules/tenant/hooks/use-branch";

interface TenantBranchSwitcherProps {
  className?: string;
}

/** Mock branch switcher for the tenant foundation. */
export function TenantBranchSwitcher({ className }: TenantBranchSwitcherProps) {
  const { branch, branches, switchBranch } = useBranch();

  return (
    <label className={className}>
      <span className="sr-only">Branch</span>
      <select
        aria-label="Switch branch"
        value={branch.id}
        onChange={(event) => switchBranch(event.target.value)}
        className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
      >
        {branches.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
            {item.isMain ? " (Main)" : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
