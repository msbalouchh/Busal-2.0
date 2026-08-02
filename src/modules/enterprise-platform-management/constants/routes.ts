export const ENTERPRISE_PLATFORM_ROUTES = {
  dashboard: () => `/app/enterprise`,
  organizations: () => `/app/enterprise/organizations`,
  departments: () => `/app/enterprise/departments`,
  identityProviders: () => `/app/enterprise/identity-providers`,
  policies: () => `/app/enterprise/policies`,
  compliance: () => `/app/enterprise/compliance`,
  settings: (organizationId: string) => `/app/enterprise/settings/${organizationId}`,
  search: () => `/app/enterprise/search`,
} as const;

export const ENTERPRISE_PLATFORM_NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", href: ENTERPRISE_PLATFORM_ROUTES.dashboard() },
  { id: "organizations", label: "Organizations", href: ENTERPRISE_PLATFORM_ROUTES.organizations() },
  { id: "departments", label: "Departments", href: ENTERPRISE_PLATFORM_ROUTES.departments() },
  {
    id: "identity",
    label: "Identity Providers",
    href: ENTERPRISE_PLATFORM_ROUTES.identityProviders(),
  },
  { id: "policies", label: "Policies", href: ENTERPRISE_PLATFORM_ROUTES.policies() },
  { id: "compliance", label: "Compliance", href: ENTERPRISE_PLATFORM_ROUTES.compliance() },
  { id: "search", label: "Search", href: ENTERPRISE_PLATFORM_ROUTES.search() },
] as const;

export const PROVIDER_TYPE_OPTIONS = [
  { value: "SAML", label: "SAML" },
  { value: "OIDC", label: "OIDC" },
  { value: "LDAP", label: "LDAP" },
  { value: "AZURE_AD", label: "Azure AD" },
  { value: "GOOGLE", label: "Google" },
  { value: "OKTA", label: "Okta" },
  { value: "AUTH0", label: "Auth0" },
  { value: "CUSTOM", label: "Custom" },
] as const;

export const POLICY_CATEGORY_OPTIONS = [
  { value: "SECURITY", label: "Security" },
  { value: "ACCESS", label: "Access" },
  { value: "SESSION", label: "Session" },
  { value: "PASSWORD", label: "Password" },
  { value: "DEVICE", label: "Device" },
  { value: "COMPLIANCE", label: "Compliance" },
] as const;

export const ORGANIZATION_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "ARCHIVED", label: "Archived" },
] as const;

export const UNIT_TYPE_OPTIONS = [
  { value: "department", label: "Department" },
  { value: "business_unit", label: "Business Unit" },
  { value: "division", label: "Division" },
  { value: "team", label: "Team" },
  { value: "region", label: "Region" },
] as const;
