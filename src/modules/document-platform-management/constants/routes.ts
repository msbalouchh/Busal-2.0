import type { PlatformDocumentStatus, PlatformDocumentType } from "@prisma/client";

export const DOCUMENT_PLATFORM_ROUTES = {
  dashboard: () => `/app/documents`,
  library: () => `/app/documents/library`,
  folders: () => `/app/documents/folders`,
  templates: () => `/app/documents/templates`,
  documentDetail: (documentId: string) => `/app/documents/${documentId}`,
  documentVersions: (documentId: string) => `/app/documents/${documentId}/versions`,
  search: () => `/app/documents/search`,
} as const;

export const DOCUMENT_PLATFORM_NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", href: DOCUMENT_PLATFORM_ROUTES.dashboard() },
  { id: "library", label: "Library", href: DOCUMENT_PLATFORM_ROUTES.library() },
  { id: "folders", label: "Folders", href: DOCUMENT_PLATFORM_ROUTES.folders() },
  { id: "templates", label: "Templates", href: DOCUMENT_PLATFORM_ROUTES.templates() },
  { id: "search", label: "Search", href: DOCUMENT_PLATFORM_ROUTES.search() },
] as const;

export const DOCUMENT_TYPE_OPTIONS: Array<{ value: PlatformDocumentType; label: string }> = [
  { value: "INVOICE", label: "Invoice" },
  { value: "RECEIPT", label: "Receipt" },
  { value: "QUOTE", label: "Quote" },
  { value: "PURCHASE_ORDER", label: "Purchase Order" },
  { value: "CONTRACT", label: "Contract" },
  { value: "REPORT", label: "Report" },
  { value: "CERTIFICATE", label: "Certificate" },
  { value: "LETTER", label: "Letter" },
  { value: "FORM", label: "Form" },
  { value: "CUSTOM", label: "Custom" },
];

export const DOCUMENT_STATUS_OPTIONS: Array<{
  value: PlatformDocumentStatus | "ALL";
  label: string;
}> = [
  { value: "ALL", label: "All statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "ACTIVE", label: "Active" },
  { value: "ARCHIVED", label: "Archived" },
];

export const EXPORT_FORMAT_OPTIONS = ["PDF", "DOCX", "XLSX", "CSV", "HTML", "JSON"] as const;
