export const SYSTEM_ROLE_SLUGS = {
  OWNER: "owner",
  SUPER_ADMIN: "super-admin",
  BUSINESS_ADMIN: "business-admin",
  BRANCH_MANAGER: "branch-manager",
  SUPERVISOR: "supervisor",
  CASHIER: "cashier",
  WAITER: "waiter",
  KITCHEN_STAFF: "kitchen-staff",
  DELIVERY_DRIVER: "delivery-driver",
  MARKETING_MANAGER: "marketing-manager",
  INVENTORY_MANAGER: "inventory-manager",
  FINANCE_MANAGER: "finance-manager",
  HR_MANAGER: "hr-manager",
  CUSTOMER_SUPPORT: "customer-support",
  VIEWER: "viewer",
} as const;

export type SystemRoleSlug = (typeof SYSTEM_ROLE_SLUGS)[keyof typeof SYSTEM_ROLE_SLUGS];

export const SYSTEM_ROLE_LABELS: Record<SystemRoleSlug, string> = {
  owner: "Owner",
  "super-admin": "Super Admin",
  "business-admin": "Business Admin",
  "branch-manager": "Branch Manager",
  supervisor: "Supervisor",
  cashier: "Cashier",
  waiter: "Waiter",
  "kitchen-staff": "Kitchen Staff",
  "delivery-driver": "Delivery Driver",
  "marketing-manager": "Marketing Manager",
  "inventory-manager": "Inventory Manager",
  "finance-manager": "Finance Manager",
  "hr-manager": "HR Manager",
  "customer-support": "Customer Support",
  viewer: "Viewer",
};

/** Higher value = more authority for `canManageUser` comparisons. */
export const SYSTEM_ROLE_PRIORITY: Record<SystemRoleSlug, number> = {
  owner: 100,
  "super-admin": 95,
  "business-admin": 85,
  "branch-manager": 75,
  supervisor: 65,
  "finance-manager": 60,
  "inventory-manager": 60,
  "marketing-manager": 60,
  "hr-manager": 60,
  "customer-support": 55,
  cashier: 40,
  waiter: 40,
  "kitchen-staff": 40,
  "delivery-driver": 35,
  viewer: 10,
};

export const ALL_SYSTEM_ROLE_SLUGS = Object.values(SYSTEM_ROLE_SLUGS);
