export const FILE_PLATFORM_ROUTES = {
  overview: "/dashboard/files",
  folders: "/dashboard/files/folders",
  registry: "/dashboard/files/registry",
  versions: "/dashboard/files/versions",
  sharing: "/dashboard/files/sharing",
  permissions: "/dashboard/files/permissions",
  retention: "/dashboard/files/retention",
  storage: "/dashboard/files/storage",
  audit: "/dashboard/files/audit",
} as const;

export const FILE_PLATFORM_NAV_ITEMS = [
  { label: "Overview", href: FILE_PLATFORM_ROUTES.overview },
  { label: "Folders", href: FILE_PLATFORM_ROUTES.folders },
  { label: "Registry", href: FILE_PLATFORM_ROUTES.registry },
  { label: "Versions", href: FILE_PLATFORM_ROUTES.versions },
  { label: "Sharing", href: FILE_PLATFORM_ROUTES.sharing },
  { label: "Permissions", href: FILE_PLATFORM_ROUTES.permissions },
  { label: "Retention", href: FILE_PLATFORM_ROUTES.retention },
  { label: "Storage", href: FILE_PLATFORM_ROUTES.storage },
  { label: "Audit", href: FILE_PLATFORM_ROUTES.audit },
] as const;

export const FILE_STORAGE_PROVIDERS = [
  "LOCAL",
  "AWS_S3",
  "AZURE_BLOB",
  "GOOGLE_CLOUD",
  "CLOUDFLARE_R2",
] as const;

export const FILE_FOLDER_TYPES = [
  "PERSONAL",
  "BUSINESS",
  "DEPARTMENT",
  "PROJECT",
  "CUSTOMER",
  "AI_KNOWLEDGE",
  "MARKETPLACE_ASSETS",
  "SHARED",
] as const;

export const FILE_PERMISSION_LEVELS = [
  "VIEW",
  "UPLOAD",
  "DOWNLOAD",
  "EDIT",
  "DELETE",
  "SHARE",
] as const;

export const FILE_AI_PROCESSING_TYPES = [
  "OCR",
  "CLASSIFICATION",
  "METADATA_EXTRACTION",
  "SUMMARY",
  "EMBEDDINGS",
] as const;

export const DEFAULT_RETENTION_DAYS = 365;
