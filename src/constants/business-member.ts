export const BUSINESS_MEMBER_ROLES = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  MEMBER: "MEMBER",
} as const;

export type BusinessMemberRole = (typeof BUSINESS_MEMBER_ROLES)[keyof typeof BUSINESS_MEMBER_ROLES];

export const BUSINESS_MEMBER_STATUSES = {
  ACTIVE: "ACTIVE",
  INVITED: "INVITED",
  SUSPENDED: "SUSPENDED",
} as const;

export type BusinessMemberStatus =
  (typeof BUSINESS_MEMBER_STATUSES)[keyof typeof BUSINESS_MEMBER_STATUSES];

/** Role hierarchy for future RBAC expansion. Higher value = more access. */
export const BUSINESS_MEMBER_ROLE_HIERARCHY: Record<BusinessMemberRole, number> = {
  [BUSINESS_MEMBER_ROLES.OWNER]: 100,
  [BUSINESS_MEMBER_ROLES.ADMIN]: 80,
  [BUSINESS_MEMBER_ROLES.MANAGER]: 60,
  [BUSINESS_MEMBER_ROLES.MEMBER]: 40,
};

export function hasMinimumBusinessMemberRole(
  role: BusinessMemberRole,
  requiredRole: BusinessMemberRole,
): boolean {
  return BUSINESS_MEMBER_ROLE_HIERARCHY[role] >= BUSINESS_MEMBER_ROLE_HIERARCHY[requiredRole];
}
