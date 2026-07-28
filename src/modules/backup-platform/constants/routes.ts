export const BACKUP_PLATFORM_ROUTES = {
  overview: "/dashboard/backup-platform",
  backups: "/dashboard/backup-platform/backups",
  recovery: "/dashboard/backup-platform/recovery",
  plans: "/dashboard/backup-platform/plans",
  retention: "/dashboard/backup-platform/retention",
  monitoring: "/dashboard/backup-platform/monitoring",
  registry: "/dashboard/backup-platform/registry",
  audit: "/dashboard/backup-platform/audit",
} as const;

export const BACKUP_PLATFORM_NAV_ITEMS = [
  { label: "Overview", href: BACKUP_PLATFORM_ROUTES.overview },
  { label: "Backups", href: BACKUP_PLATFORM_ROUTES.backups },
  { label: "Recovery", href: BACKUP_PLATFORM_ROUTES.recovery },
  { label: "DR Plans", href: BACKUP_PLATFORM_ROUTES.plans },
  { label: "Retention", href: BACKUP_PLATFORM_ROUTES.retention },
  { label: "Monitoring", href: BACKUP_PLATFORM_ROUTES.monitoring },
  { label: "Registry", href: BACKUP_PLATFORM_ROUTES.registry },
  { label: "Audit", href: BACKUP_PLATFORM_ROUTES.audit },
] as const;

export const BACKUP_SCOPES = [
  "TENANT",
  "BUSINESS",
  "BRANCH",
  "DATABASE",
  "FILE",
  "CONFIGURATION",
] as const;

export const BACKUP_TRIGGER_TYPES = ["AUTOMATED", "MANUAL"] as const;

export const RECOVERY_JOB_TYPES = [
  "PITR",
  "TENANT_RESTORE",
  "BUSINESS_RESTORE",
  "BRANCH_RESTORE",
  "PREVIEW",
] as const;

export const DEFAULT_BACKUP_RETENTION_DAYS = 30;

export const DEFAULT_ENCRYPTION_KEY_ID = "busal-backup-key-v1";
