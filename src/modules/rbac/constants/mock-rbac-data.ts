import { PERMISSION_CATEGORIES } from "@/modules/rbac/constants/permission-categories";
import {
  ALL_RBAC_PERMISSION_KEYS,
  buildPermissionKey,
  RBAC_PERMISSION_CATALOG,
  READ_ONLY_PERMISSION_KEYS,
} from "@/modules/rbac/constants/permission-catalog";
import { PERMISSION_TYPES } from "@/modules/rbac/constants/permission-types";
import { RBAC_PERMISSION_GROUPS } from "@/modules/rbac/constants/permission-groups";
import { RBAC_ROLE_GROUPS } from "@/modules/rbac/constants/role-groups";
import {
  SYSTEM_ROLE_LABELS,
  SYSTEM_ROLE_PRIORITY,
  SYSTEM_ROLE_SLUGS,
} from "@/modules/rbac/constants/system-roles";
import { ACCESS_SCOPE_LEVELS } from "@/modules/rbac/types/access-scope";
import type {
  BranchAssignment,
  TenantAssignment,
  UserRoleAssignment,
  WorkspaceAssignment,
} from "@/modules/rbac/types/assignment";
import type { PermissionKey } from "@/modules/rbac/types/permission";
import type { Role } from "@/modules/rbac/types/role";

function keysMatching(prefix: string): PermissionKey[] {
  return RBAC_PERMISSION_CATALOG.filter((permission) => permission.key.startsWith(prefix)).map(
    (permission) => permission.key,
  );
}

function keysForCategories(
  categories: (typeof PERMISSION_CATEGORIES)[keyof typeof PERMISSION_CATEGORIES][],
): PermissionKey[] {
  return RBAC_PERMISSION_CATALOG.filter((permission) =>
    categories.includes(permission.category),
  ).map((permission) => permission.key);
}

const OPERATIONS_KEYS = keysForCategories([
  PERMISSION_CATEGORIES.ORDERS,
  PERMISSION_CATEGORIES.POS,
  PERMISSION_CATEGORIES.KITCHEN,
  PERMISSION_CATEGORIES.RESERVATIONS,
  PERMISSION_CATEGORIES.MENU,
]);

const ROLE_PERMISSION_TEMPLATES: Record<
  (typeof SYSTEM_ROLE_SLUGS)[keyof typeof SYSTEM_ROLE_SLUGS],
  PermissionKey[]
> = {
  [SYSTEM_ROLE_SLUGS.OWNER]: [...ALL_RBAC_PERMISSION_KEYS],
  [SYSTEM_ROLE_SLUGS.SUPER_ADMIN]: ALL_RBAC_PERMISSION_KEYS.filter(
    (key) => !key.startsWith(`${PERMISSION_CATEGORIES.BILLING}.`),
  ),
  [SYSTEM_ROLE_SLUGS.BUSINESS_ADMIN]: [
    ...keysForCategories([
      PERMISSION_CATEGORIES.DASHBOARD,
      PERMISSION_CATEGORIES.BUSINESS,
      PERMISSION_CATEGORIES.BRANCHES,
      PERMISSION_CATEGORIES.STAFF,
      PERMISSION_CATEGORIES.SETTINGS,
      PERMISSION_CATEGORIES.REPORTS,
      PERMISSION_CATEGORIES.ANALYTICS,
    ]),
    ...OPERATIONS_KEYS,
    ...keysMatching(`${PERMISSION_CATEGORIES.CUSTOMERS}.`),
    ...keysMatching(`${PERMISSION_CATEGORIES.INVENTORY}.`),
    ...keysMatching(`${PERMISSION_CATEGORIES.MARKETING}.`),
    ...keysMatching(`${PERMISSION_CATEGORIES.FINANCE}.`),
  ],
  [SYSTEM_ROLE_SLUGS.BRANCH_MANAGER]: [
    ...keysForCategories([
      PERMISSION_CATEGORIES.DASHBOARD,
      PERMISSION_CATEGORIES.BRANCHES,
      PERMISSION_CATEGORIES.STAFF,
      PERMISSION_CATEGORIES.REPORTS,
    ]),
    ...OPERATIONS_KEYS,
    buildPermissionKey(PERMISSION_CATEGORIES.INVENTORY, PERMISSION_TYPES.READ),
    buildPermissionKey(PERMISSION_CATEGORIES.FINANCE, PERMISSION_TYPES.READ),
  ],
  [SYSTEM_ROLE_SLUGS.SUPERVISOR]: [
    buildPermissionKey(PERMISSION_CATEGORIES.DASHBOARD, PERMISSION_TYPES.READ),
    ...OPERATIONS_KEYS.filter((key) => !key.endsWith(`.${PERMISSION_TYPES.DELETE}`)),
    buildPermissionKey(PERMISSION_CATEGORIES.STAFF, PERMISSION_TYPES.READ),
  ],
  [SYSTEM_ROLE_SLUGS.CASHIER]: [
    buildPermissionKey(PERMISSION_CATEGORIES.DASHBOARD, PERMISSION_TYPES.READ),
    buildPermissionKey(PERMISSION_CATEGORIES.POS, PERMISSION_TYPES.READ),
    buildPermissionKey(PERMISSION_CATEGORIES.POS, PERMISSION_TYPES.CREATE),
    buildPermissionKey(PERMISSION_CATEGORIES.ORDERS, PERMISSION_TYPES.READ),
    buildPermissionKey(PERMISSION_CATEGORIES.ORDERS, PERMISSION_TYPES.CREATE),
    buildPermissionKey(PERMISSION_CATEGORIES.ORDERS, PERMISSION_TYPES.UPDATE),
  ],
  [SYSTEM_ROLE_SLUGS.WAITER]: [
    buildPermissionKey(PERMISSION_CATEGORIES.DASHBOARD, PERMISSION_TYPES.READ),
    buildPermissionKey(PERMISSION_CATEGORIES.ORDERS, PERMISSION_TYPES.READ),
    buildPermissionKey(PERMISSION_CATEGORIES.ORDERS, PERMISSION_TYPES.CREATE),
    buildPermissionKey(PERMISSION_CATEGORIES.ORDERS, PERMISSION_TYPES.UPDATE),
    buildPermissionKey(PERMISSION_CATEGORIES.RESERVATIONS, PERMISSION_TYPES.READ),
    buildPermissionKey(PERMISSION_CATEGORIES.RESERVATIONS, PERMISSION_TYPES.UPDATE),
    buildPermissionKey(PERMISSION_CATEGORIES.MENU, PERMISSION_TYPES.READ),
  ],
  [SYSTEM_ROLE_SLUGS.KITCHEN_STAFF]: keysMatching(`${PERMISSION_CATEGORIES.KITCHEN}.`),
  [SYSTEM_ROLE_SLUGS.DELIVERY_DRIVER]: [
    buildPermissionKey(PERMISSION_CATEGORIES.DASHBOARD, PERMISSION_TYPES.READ),
    buildPermissionKey(PERMISSION_CATEGORIES.ORDERS, PERMISSION_TYPES.READ),
    buildPermissionKey(PERMISSION_CATEGORIES.ORDERS, PERMISSION_TYPES.UPDATE),
  ],
  [SYSTEM_ROLE_SLUGS.MARKETING_MANAGER]: keysMatching(`${PERMISSION_CATEGORIES.MARKETING}.`),
  [SYSTEM_ROLE_SLUGS.INVENTORY_MANAGER]: keysMatching(`${PERMISSION_CATEGORIES.INVENTORY}.`),
  [SYSTEM_ROLE_SLUGS.FINANCE_MANAGER]: [
    ...keysMatching(`${PERMISSION_CATEGORIES.FINANCE}.`),
    buildPermissionKey(PERMISSION_CATEGORIES.REPORTS, PERMISSION_TYPES.READ),
    buildPermissionKey(PERMISSION_CATEGORIES.REPORTS, PERMISSION_TYPES.EXPORT),
    buildPermissionKey(PERMISSION_CATEGORIES.BILLING, PERMISSION_TYPES.READ),
  ],
  [SYSTEM_ROLE_SLUGS.HR_MANAGER]: keysMatching(`${PERMISSION_CATEGORIES.STAFF}.`),
  [SYSTEM_ROLE_SLUGS.CUSTOMER_SUPPORT]: [
    buildPermissionKey(PERMISSION_CATEGORIES.DASHBOARD, PERMISSION_TYPES.READ),
    ...keysMatching(`${PERMISSION_CATEGORIES.CUSTOMERS}.`),
    buildPermissionKey(PERMISSION_CATEGORIES.ORDERS, PERMISSION_TYPES.READ),
    buildPermissionKey(PERMISSION_CATEGORIES.RESERVATIONS, PERMISSION_TYPES.READ),
  ],
  [SYSTEM_ROLE_SLUGS.VIEWER]: [...READ_ONLY_PERMISSION_KEYS],
};

function buildSystemRole(
  slug: (typeof SYSTEM_ROLE_SLUGS)[keyof typeof SYSTEM_ROLE_SLUGS],
  scope: Pick<Role, "tenantId" | "workspaceId" | "businessId">,
): Role {
  return {
    id: `role-${slug}-${scope.workspaceId ?? "global"}`,
    slug,
    name: SYSTEM_ROLE_LABELS[slug],
    description: `${SYSTEM_ROLE_LABELS[slug]} system role`,
    permissionKeys: ROLE_PERMISSION_TEMPLATES[slug],
    isSystem: true,
    priority: SYSTEM_ROLE_PRIORITY[slug],
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    businessId: scope.businessId,
  };
}

export const MOCK_RBAC_ROLES: Role[] = [
  buildSystemRole(SYSTEM_ROLE_SLUGS.OWNER, {
    tenantId: "tenant-harbour",
    workspaceId: "ws-harbour-kitchen",
    businessId: "biz-harbour-kitchen",
  }),
  buildSystemRole(SYSTEM_ROLE_SLUGS.BRANCH_MANAGER, {
    tenantId: "tenant-harbour",
    workspaceId: "ws-harbour-kitchen",
    businessId: "biz-harbour-kitchen",
  }),
  buildSystemRole(SYSTEM_ROLE_SLUGS.CASHIER, {
    tenantId: "tenant-harbour",
    workspaceId: "ws-harbour-kitchen",
    businessId: "biz-harbour-kitchen",
  }),
  buildSystemRole(SYSTEM_ROLE_SLUGS.KITCHEN_STAFF, {
    tenantId: "tenant-harbour",
    workspaceId: "ws-harbour-kitchen",
    businessId: "biz-harbour-kitchen",
  }),
  buildSystemRole(SYSTEM_ROLE_SLUGS.OWNER, {
    tenantId: "tenant-northside",
    workspaceId: "ws-northside-retail",
    businessId: "biz-northside-retail",
  }),
  buildSystemRole(SYSTEM_ROLE_SLUGS.INVENTORY_MANAGER, {
    tenantId: "tenant-northside",
    workspaceId: "ws-northside-retail",
    businessId: "biz-northside-retail",
  }),
  buildSystemRole(SYSTEM_ROLE_SLUGS.OWNER, {
    tenantId: "tenant-atlas",
    workspaceId: "ws-atlas-clinic",
    businessId: "biz-atlas-clinic",
  }),
  buildSystemRole(SYSTEM_ROLE_SLUGS.VIEWER, {
    tenantId: "tenant-atlas",
    workspaceId: "ws-atlas-clinic",
    businessId: "biz-atlas-clinic",
  }),
];

export const MOCK_TENANT_ASSIGNMENTS: TenantAssignment[] = [
  {
    id: "ta-harbour-owner",
    userId: "user-harbour-owner",
    tenantId: "tenant-harbour",
    roleSlug: SYSTEM_ROLE_SLUGS.OWNER,
    assignedAt: "2025-01-12T10:00:00.000Z",
  },
  {
    id: "ta-northside-owner",
    userId: "user-northside-owner",
    tenantId: "tenant-northside",
    roleSlug: SYSTEM_ROLE_SLUGS.OWNER,
    assignedAt: "2025-03-05T10:00:00.000Z",
  },
];

export const MOCK_WORKSPACE_ASSIGNMENTS: WorkspaceAssignment[] = [
  {
    id: "wa-harbour-manager",
    userId: "user-harbour-manager",
    tenantId: "tenant-harbour",
    workspaceId: "ws-harbour-kitchen",
    roleSlug: SYSTEM_ROLE_SLUGS.BRANCH_MANAGER,
    assignedAt: "2025-01-15T10:00:00.000Z",
  },
  {
    id: "wa-northside-inventory",
    userId: "user-northside-inventory",
    tenantId: "tenant-northside",
    workspaceId: "ws-northside-retail",
    roleSlug: SYSTEM_ROLE_SLUGS.INVENTORY_MANAGER,
    assignedAt: "2025-03-10T10:00:00.000Z",
  },
];

export const MOCK_BRANCH_ASSIGNMENTS: BranchAssignment[] = [
  {
    id: "ba-harbour-cashier",
    userId: "user-harbour-cashier",
    tenantId: "tenant-harbour",
    workspaceId: "ws-harbour-kitchen",
    businessId: "biz-harbour-kitchen",
    branchId: "branch-harbour-main",
    roleSlug: SYSTEM_ROLE_SLUGS.CASHIER,
    assignedAt: "2025-01-20T10:00:00.000Z",
  },
  {
    id: "ba-harbour-kitchen",
    userId: "user-harbour-kitchen",
    tenantId: "tenant-harbour",
    workspaceId: "ws-harbour-kitchen",
    businessId: "biz-harbour-kitchen",
    branchId: "branch-harbour-harbourfront",
    roleSlug: SYSTEM_ROLE_SLUGS.KITCHEN_STAFF,
    assignedAt: "2025-01-22T10:00:00.000Z",
  },
  {
    id: "ba-northside-outlet",
    userId: "user-northside-inventory",
    tenantId: "tenant-northside",
    workspaceId: "ws-northside-retail",
    businessId: "biz-northside-retail",
    branchId: "branch-northside-outlet",
    roleSlug: SYSTEM_ROLE_SLUGS.INVENTORY_MANAGER,
    assignedAt: "2025-04-05T10:00:00.000Z",
  },
  {
    id: "ba-atlas-viewer",
    userId: "user-atlas-viewer",
    tenantId: "tenant-atlas",
    workspaceId: "ws-atlas-clinic",
    businessId: "biz-atlas-clinic",
    branchId: "branch-atlas-main",
    roleSlug: SYSTEM_ROLE_SLUGS.VIEWER,
    assignedAt: "2025-06-25T10:00:00.000Z",
  },
];

export const MOCK_USER_ROLE_ASSIGNMENTS: UserRoleAssignment[] = [
  {
    id: "ura-harbour-owner",
    userId: "user-harbour-owner",
    roleId: "role-owner-ws-harbour-kitchen",
    roleSlug: SYSTEM_ROLE_SLUGS.OWNER,
    scope: ACCESS_SCOPE_LEVELS.WORKSPACE,
    tenantId: "tenant-harbour",
    workspaceId: "ws-harbour-kitchen",
    businessId: "biz-harbour-kitchen",
    branchId: null,
    assignedBy: null,
    assignedAt: "2025-01-12T10:00:00.000Z",
  },
  {
    id: "ura-harbour-manager",
    userId: "user-harbour-manager",
    roleId: "role-branch-manager-ws-harbour-kitchen",
    roleSlug: SYSTEM_ROLE_SLUGS.BRANCH_MANAGER,
    scope: ACCESS_SCOPE_LEVELS.WORKSPACE,
    tenantId: "tenant-harbour",
    workspaceId: "ws-harbour-kitchen",
    businessId: "biz-harbour-kitchen",
    branchId: null,
    assignedBy: "user-harbour-owner",
    assignedAt: "2025-01-15T10:00:00.000Z",
  },
  {
    id: "ura-harbour-cashier",
    userId: "user-harbour-cashier",
    roleId: "role-cashier-ws-harbour-kitchen",
    roleSlug: SYSTEM_ROLE_SLUGS.CASHIER,
    scope: ACCESS_SCOPE_LEVELS.BRANCH,
    tenantId: "tenant-harbour",
    workspaceId: "ws-harbour-kitchen",
    businessId: "biz-harbour-kitchen",
    branchId: "branch-harbour-main",
    assignedBy: "user-harbour-manager",
    assignedAt: "2025-01-20T10:00:00.000Z",
  },
  {
    id: "ura-harbour-kitchen",
    userId: "user-harbour-kitchen",
    roleId: "role-kitchen-staff-ws-harbour-kitchen",
    roleSlug: SYSTEM_ROLE_SLUGS.KITCHEN_STAFF,
    scope: ACCESS_SCOPE_LEVELS.BRANCH,
    tenantId: "tenant-harbour",
    workspaceId: "ws-harbour-kitchen",
    businessId: "biz-harbour-kitchen",
    branchId: "branch-harbour-harbourfront",
    assignedBy: "user-harbour-manager",
    assignedAt: "2025-01-22T10:00:00.000Z",
  },
  {
    id: "ura-northside-owner",
    userId: "user-northside-owner",
    roleId: "role-owner-ws-northside-retail",
    roleSlug: SYSTEM_ROLE_SLUGS.OWNER,
    scope: ACCESS_SCOPE_LEVELS.WORKSPACE,
    tenantId: "tenant-northside",
    workspaceId: "ws-northside-retail",
    businessId: "biz-northside-retail",
    branchId: null,
    assignedBy: null,
    assignedAt: "2025-03-05T10:00:00.000Z",
  },
  {
    id: "ura-atlas-viewer",
    userId: "user-atlas-viewer",
    roleId: "role-viewer-ws-atlas-clinic",
    roleSlug: SYSTEM_ROLE_SLUGS.VIEWER,
    scope: ACCESS_SCOPE_LEVELS.BRANCH,
    tenantId: "tenant-atlas",
    workspaceId: "ws-atlas-clinic",
    businessId: "biz-atlas-clinic",
    branchId: "branch-atlas-main",
    assignedBy: "user-atlas-owner",
    assignedAt: "2025-06-25T10:00:00.000Z",
  },
];

export const DEFAULT_MOCK_RBAC_USER_ID = "user-harbour-owner";

export const DEFAULT_MOCK_RBAC_SELECTION = {
  tenantId: "tenant-harbour",
  workspaceId: "ws-harbour-kitchen",
  businessId: "biz-harbour-kitchen",
  branchId: "branch-harbour-main",
} as const;

export {
  RBAC_PERMISSION_CATALOG as MOCK_RBAC_PERMISSIONS,
  RBAC_PERMISSION_GROUPS as MOCK_RBAC_PERMISSION_GROUPS,
  RBAC_ROLE_GROUPS as MOCK_RBAC_ROLE_GROUPS,
};
