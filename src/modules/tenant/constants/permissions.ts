import type { Permission } from "@/modules/tenant/types/rbac";

/**
 * Catalog of platform permission keys.
 * Future: sync with RBAC / authorization module and Prisma policy tables.
 */
export const TENANT_PERMISSION_CATALOG: Permission[] = [
  {
    id: "perm-workspace-read",
    key: "workspace.read",
    label: "View workspace",
    description: "View workspace shell and dashboard",
    module: "workspace",
  },
  {
    id: "perm-workspace-manage",
    key: "workspace.manage",
    label: "Manage workspace",
    description: "Update workspace settings",
    module: "workspace",
  },
  {
    id: "perm-business-read",
    key: "business.read",
    label: "View business",
    description: "View business profile",
    module: "business",
  },
  {
    id: "perm-business-manage",
    key: "business.manage",
    label: "Manage business",
    description: "Update business profile and branding",
    module: "business",
  },
  {
    id: "perm-branch-read",
    key: "branch.read",
    label: "View branches",
    description: "View branch directory",
    module: "branch",
  },
  {
    id: "perm-branch-manage",
    key: "branch.manage",
    label: "Manage branches",
    description: "Create and update branches",
    module: "branch",
  },
  {
    id: "perm-staff-read",
    key: "staff.read",
    label: "View staff",
    description: "View staff directory",
    module: "staff",
  },
  {
    id: "perm-staff-manage",
    key: "staff.manage",
    label: "Manage staff",
    description: "Invite and manage staff members",
    module: "staff",
  },
  {
    id: "perm-orders-read",
    key: "orders.read",
    label: "View orders",
    description: "View order history",
    module: "pos",
  },
  {
    id: "perm-orders-manage",
    key: "orders.manage",
    label: "Manage orders",
    description: "Create and update orders",
    module: "pos",
  },
  {
    id: "perm-crm-read",
    key: "crm.read",
    label: "View CRM",
    description: "View customers and segments",
    module: "crm",
  },
  {
    id: "perm-inventory-read",
    key: "inventory.read",
    label: "View inventory",
    description: "View stock levels",
    module: "inventory",
  },
  {
    id: "perm-reservations-read",
    key: "reservations.read",
    label: "View reservations",
    description: "View reservation calendar",
    module: "reservations",
  },
  {
    id: "perm-marketing-read",
    key: "marketing.read",
    label: "View marketing",
    description: "View campaigns",
    module: "marketing",
  },
  {
    id: "perm-finance-read",
    key: "finance.read",
    label: "View finance",
    description: "View payments and reports",
    module: "finance",
  },
  {
    id: "perm-ai-use",
    key: "ai.use",
    label: "Use AI agents",
    description: "Access AI assistant and agents",
    module: "ai",
  },
  {
    id: "perm-billing-manage",
    key: "billing.manage",
    label: "Manage billing",
    description: "Manage subscription and invoices",
    module: "billing",
  },
];

export const OWNER_PERMISSION_KEYS = TENANT_PERMISSION_CATALOG.map((permission) => permission.key);

export const MANAGER_PERMISSION_KEYS = [
  "workspace.read",
  "business.read",
  "business.manage",
  "branch.read",
  "branch.manage",
  "staff.read",
  "orders.read",
  "orders.manage",
  "crm.read",
  "inventory.read",
  "reservations.read",
  "marketing.read",
  "finance.read",
  "ai.use",
] as const;
