/**
 * RBAC contracts for the multi-tenant foundation.
 * Mock-only — wire to a real authorization engine later.
 */

export const DEFAULT_ROLE_SLUGS = {
  OWNER: "owner",
  ADMINISTRATOR: "administrator",
  MANAGER: "manager",
  SUPERVISOR: "supervisor",
  CASHIER: "cashier",
  CHEF: "chef",
  WAITER: "waiter",
  ACCOUNTANT: "accountant",
  SUPPORT: "support",
} as const;

export type DefaultRoleSlug = (typeof DEFAULT_ROLE_SLUGS)[keyof typeof DEFAULT_ROLE_SLUGS];

export type RoleSlug = DefaultRoleSlug | (string & {});

export interface Permission {
  id: string;
  key: string;
  label: string;
  description: string;
  module: string;
}

export interface Role {
  id: string;
  slug: RoleSlug;
  name: string;
  description: string;
  workspaceId: string;
  permissionKeys: string[];
  isSystem: boolean;
}

export interface RoleAssignment {
  id: string;
  staffId: string;
  roleId: string;
  workspaceId: string;
  branchId: string | null;
}
