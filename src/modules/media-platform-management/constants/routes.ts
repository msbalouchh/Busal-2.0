import type { PlatformMediaType, PlatformMediaVisibility } from "@prisma/client";

export const MEDIA_PLATFORM_ROUTES = {
  dashboard: () => `/app/media`,
  library: () => `/app/media/library`,
  folders: () => `/app/media/folders`,
  upload: () => `/app/media/upload`,
  fileDetail: (fileId: string) => `/app/media/${fileId}`,
  analytics: () => `/app/media/analytics`,
  tags: () => `/app/media/tags`,
  search: () => `/app/media/search`,
  recycle: () => `/app/media/recycle`,
} as const;

export const MEDIA_PLATFORM_NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", href: MEDIA_PLATFORM_ROUTES.dashboard() },
  { id: "library", label: "Library", href: MEDIA_PLATFORM_ROUTES.library() },
  { id: "folders", label: "Folders", href: MEDIA_PLATFORM_ROUTES.folders() },
  { id: "upload", label: "Upload", href: MEDIA_PLATFORM_ROUTES.upload() },
  { id: "tags", label: "Tags", href: MEDIA_PLATFORM_ROUTES.tags() },
  { id: "analytics", label: "Analytics", href: MEDIA_PLATFORM_ROUTES.analytics() },
  { id: "search", label: "Search", href: MEDIA_PLATFORM_ROUTES.search() },
  { id: "recycle", label: "Recycle Bin", href: MEDIA_PLATFORM_ROUTES.recycle() },
] as const;

export const MEDIA_TYPE_OPTIONS: Array<{ value: PlatformMediaType | "ALL"; label: string }> = [
  { value: "ALL", label: "All types" },
  { value: "IMAGE", label: "Images" },
  { value: "VIDEO", label: "Videos" },
  { value: "AUDIO", label: "Audio" },
  { value: "DOCUMENT", label: "Documents" },
  { value: "ARCHIVE", label: "Archives" },
  { value: "OTHER", label: "Other" },
];

export const MEDIA_VISIBILITY_OPTIONS: Array<{ value: PlatformMediaVisibility; label: string }> = [
  { value: "PRIVATE", label: "Private" },
  { value: "BUSINESS", label: "Business" },
  { value: "PUBLIC", label: "Public" },
];

export const STORAGE_PROVIDER_OPTIONS = [
  "LOCAL",
  "AMAZON_S3",
  "CLOUDFLARE_R2",
  "GOOGLE_CLOUD_STORAGE",
  "AZURE_BLOB_STORAGE",
  "MINIO",
] as const;
