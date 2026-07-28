export const AI_KNOWLEDGE_ROUTES = {
  overview: "/dashboard/ai-knowledge",
  collections: "/dashboard/ai-knowledge/collections",
  documents: "/dashboard/ai-knowledge/documents",
  search: "/dashboard/ai-knowledge/search",
  audit: "/dashboard/ai-knowledge/audit",
  connectors: "/dashboard/ai-knowledge/connectors",
} as const;

export const AI_KNOWLEDGE_NAV_ITEMS = [
  { label: "Overview", href: AI_KNOWLEDGE_ROUTES.overview },
  { label: "Collections", href: AI_KNOWLEDGE_ROUTES.collections },
  { label: "Documents", href: AI_KNOWLEDGE_ROUTES.documents },
  { label: "Search", href: AI_KNOWLEDGE_ROUTES.search },
  { label: "Audit", href: AI_KNOWLEDGE_ROUTES.audit },
  { label: "Connectors", href: AI_KNOWLEDGE_ROUTES.connectors },
] as const;

export const KNOWLEDGE_SOURCE_TYPE_LABELS = {
  BUSINESS_DOCUMENT: "Business Document",
  SOP: "SOP",
  TRAINING_MANUAL: "Training Manual",
  POLICY: "Policy",
  CONTRACT: "Contract",
  PRODUCT_DOCUMENTATION: "Product Documentation",
  FAQ: "FAQ",
  HELP_ARTICLE: "Help Article",
  INTERNAL_NOTE: "Internal Note",
  UPLOADED_FILE: "Uploaded File",
} as const;

export const KNOWLEDGE_CHUNK_SIZE = 800;
export const KNOWLEDGE_CHUNK_OVERLAP = 120;
export const KNOWLEDGE_EMBEDDING_DIMENSION = 384;
