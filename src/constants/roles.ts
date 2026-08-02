export const USER_ROLES = {
  OWNER: "owner",
  ADMIN: "admin",
  MANAGER: "manager",
  STAFF: "staff",
  CUSTOMER: "customer",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [USER_ROLES.OWNER]: 100,
  [USER_ROLES.ADMIN]: 80,
  [USER_ROLES.MANAGER]: 60,
  [USER_ROLES.STAFF]: 40,
  [USER_ROLES.CUSTOMER]: 10,
};

export function hasMinimumRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}
