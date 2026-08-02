"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { RbacPermissionsMatrix } from "@/modules/rbac/components/rbac-permissions-matrix";
import { RbacRolesPanel } from "@/modules/rbac/components/rbac-roles-panel";
import type { RbacManagementContext } from "@/modules/rbac/lib/get-rbac-context";

interface RbacManagementPanelProps {
  context: Pick<RbacManagementContext, "roles" | "matrix" | "permissionsFlags">;
}

type RbacTab = "roles" | "permissions";

export function RbacManagementPanel({ context }: RbacManagementPanelProps) {
  const { roles, matrix, permissionsFlags } = context;
  const [activeTab, setActiveTab] = useState<RbacTab>("roles");

  return (
    <div className="space-y-6">
      <div
        role="tablist"
        aria-label="Roles and permissions sections"
        className="inline-flex flex-wrap gap-2 rounded-lg border p-1"
      >
        <Button
          type="button"
          role="tab"
          id="rbac-tab-roles"
          aria-selected={activeTab === "roles"}
          aria-controls="rbac-panel-roles"
          variant={activeTab === "roles" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("roles")}
        >
          Roles
        </Button>
        <Button
          type="button"
          role="tab"
          id="rbac-tab-permissions"
          aria-selected={activeTab === "permissions"}
          aria-controls="rbac-panel-permissions"
          variant={activeTab === "permissions" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("permissions")}
        >
          Permissions
        </Button>
      </div>

      <div
        role="tabpanel"
        id="rbac-panel-roles"
        aria-labelledby="rbac-tab-roles"
        hidden={activeTab !== "roles"}
        tabIndex={0}
      >
        {activeTab === "roles" ? (
          <RbacRolesPanel roles={roles} permissions={permissionsFlags} />
        ) : null}
      </div>

      <div
        role="tabpanel"
        id="rbac-panel-permissions"
        aria-labelledby="rbac-tab-permissions"
        hidden={activeTab !== "permissions"}
        tabIndex={0}
      >
        {activeTab === "permissions" ? (
          <RbacPermissionsMatrix matrix={matrix} canEdit={permissionsFlags.canManagePermissions} />
        ) : null}
      </div>
    </div>
  );
}
