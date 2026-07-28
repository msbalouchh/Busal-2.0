export const CONTRACTS_ROUTES = {
  overview: "/dashboard/contracts",
  contracts: "/dashboard/contracts/list",
  types: "/dashboard/contracts/types",
  clauses: "/dashboard/contracts/clauses",
  documents: "/dashboard/contracts/documents",
  renewals: "/dashboard/contracts/renewals",
} as const;

export const CONTRACTS_NAV_ITEMS = [
  { label: "Dashboard", href: CONTRACTS_ROUTES.overview },
  { label: "Contracts", href: CONTRACTS_ROUTES.contracts },
  { label: "Types", href: CONTRACTS_ROUTES.types },
  { label: "Clauses", href: CONTRACTS_ROUTES.clauses },
  { label: "Documents", href: CONTRACTS_ROUTES.documents },
  { label: "Renewals", href: CONTRACTS_ROUTES.renewals },
] as const;

export const CONTRACT_STATUS_LABELS = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending approval",
  APPROVED: "Approved",
  PENDING_SIGNATURE: "Pending signature",
  ACTIVE: "Active",
  EXPIRED: "Expired",
  TERMINATED: "Terminated",
  ARCHIVED: "Archived",
} as const;

export const SIGNATURE_PROVIDER_LABELS = {
  MANUAL: "Manual",
  DOCUSIGN: "DocuSign",
  ADOBE_SIGN: "Adobe Sign",
  HELLOSIGN: "HelloSign",
} as const;

export const CONTRACTS_FUTURE_FEATURES = {
  digitalSignatures: "digitalSignatures",
  invoicing: "invoicing",
} as const;
