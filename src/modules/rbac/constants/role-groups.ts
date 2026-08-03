import { SYSTEM_ROLE_SLUGS } from "@/modules/rbac/constants/system-roles";
import type { RoleGroup } from "@/modules/rbac/types/role";

export const RBAC_ROLE_GROUPS: RoleGroup[] = [
  {
    id: "rg-leadership",
    slug: "leadership",
    name: "Leadership",
    description: "Executive and administrative leadership roles",
    roleSlugs: [
      SYSTEM_ROLE_SLUGS.OWNER,
      SYSTEM_ROLE_SLUGS.SUPER_ADMIN,
      SYSTEM_ROLE_SLUGS.BUSINESS_ADMIN,
    ],
    tenantId: null,
  },
  {
    id: "rg-operations",
    slug: "operations",
    name: "Operations",
    description: "Front-of-house and branch operations",
    roleSlugs: [
      SYSTEM_ROLE_SLUGS.BRANCH_MANAGER,
      SYSTEM_ROLE_SLUGS.SUPERVISOR,
      SYSTEM_ROLE_SLUGS.CASHIER,
      SYSTEM_ROLE_SLUGS.WAITER,
      SYSTEM_ROLE_SLUGS.KITCHEN_STAFF,
      SYSTEM_ROLE_SLUGS.DELIVERY_DRIVER,
    ],
    tenantId: null,
  },
  {
    id: "rg-specialists",
    slug: "specialists",
    name: "Specialists",
    description: "Functional area specialists",
    roleSlugs: [
      SYSTEM_ROLE_SLUGS.MARKETING_MANAGER,
      SYSTEM_ROLE_SLUGS.INVENTORY_MANAGER,
      SYSTEM_ROLE_SLUGS.FINANCE_MANAGER,
      SYSTEM_ROLE_SLUGS.HR_MANAGER,
      SYSTEM_ROLE_SLUGS.CUSTOMER_SUPPORT,
    ],
    tenantId: null,
  },
  {
    id: "rg-readonly",
    slug: "readonly",
    name: "Read Only",
    description: "View-only access across modules",
    roleSlugs: [SYSTEM_ROLE_SLUGS.VIEWER],
    tenantId: null,
  },
];
