"use client";

import { useWorkspace } from "@/modules/tenant/hooks/use-workspace";

interface TenantWorkspaceSwitcherProps {
  className?: string;
}

/** Mock workspace switcher for the tenant foundation. */
export function TenantWorkspaceSwitcher({ className }: TenantWorkspaceSwitcherProps) {
  const { workspace, workspaces, switchWorkspace } = useWorkspace();

  return (
    <label className={className}>
      <span className="sr-only">Workspace</span>
      <select
        aria-label="Switch workspace"
        value={workspace.id}
        onChange={(event) => switchWorkspace(event.target.value)}
        className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
      >
        {workspaces.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
    </label>
  );
}
