export const WORKSPACE_ID_SUFFIX = "-ws";

export function buildWorkspaceId(businessId: string): string {
  return `${businessId}${WORKSPACE_ID_SUFFIX}`;
}

export function resolveBusinessIdFromWorkspaceId(workspaceId: string): string {
  return workspaceId.endsWith(WORKSPACE_ID_SUFFIX)
    ? workspaceId.slice(0, -WORKSPACE_ID_SUFFIX.length)
    : workspaceId;
}

export function buildOrganizationId(businessId: string): string {
  return `${businessId}-org`;
}

export function buildTenantIdFromBusiness(businessId: string): string {
  return businessId;
}
