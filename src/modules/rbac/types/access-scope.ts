export const ACCESS_SCOPE_LEVELS = {
  GLOBAL: "global",
  TENANT: "tenant",
  WORKSPACE: "workspace",
  BUSINESS: "business",
  BRANCH: "branch",
} as const;

export type AccessScopeLevel = (typeof ACCESS_SCOPE_LEVELS)[keyof typeof ACCESS_SCOPE_LEVELS];

export interface AccessScope {
  level: AccessScopeLevel;
  tenantId: string | null;
  workspaceId: string | null;
  businessId: string | null;
  branchId: string | null;
}
