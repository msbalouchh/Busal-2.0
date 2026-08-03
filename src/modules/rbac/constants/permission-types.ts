export const PERMISSION_TYPES = {
  CREATE: "create",
  READ: "read",
  UPDATE: "update",
  DELETE: "delete",
  EXPORT: "export",
  APPROVE: "approve",
  MANAGE: "manage",
  ASSIGN: "assign",
  INVITE: "invite",
  CONFIGURE: "configure",
} as const;

export type PermissionTypeSlug = (typeof PERMISSION_TYPES)[keyof typeof PERMISSION_TYPES];

export const PERMISSION_TYPE_LABELS: Record<PermissionTypeSlug, string> = {
  create: "Create",
  read: "Read",
  update: "Update",
  delete: "Delete",
  export: "Export",
  approve: "Approve",
  manage: "Manage",
  assign: "Assign",
  invite: "Invite",
  configure: "Configure",
};

export const ALL_PERMISSION_TYPES = Object.values(PERMISSION_TYPES);
