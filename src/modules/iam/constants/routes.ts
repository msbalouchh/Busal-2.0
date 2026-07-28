export const IAM_ROUTES = {
  overview: "/dashboard/iam",
  identities: "/dashboard/iam/identities",
  sessions: "/dashboard/iam/sessions",
  apiKeys: "/dashboard/iam/api-keys",
  serviceAccounts: "/dashboard/iam/service-accounts",
  policies: "/dashboard/iam/policies",
  providers: "/dashboard/iam/providers",
  security: "/dashboard/iam/security",
} as const;

export const IAM_NAV_ITEMS = [
  { label: "Overview", href: IAM_ROUTES.overview },
  { label: "Identities", href: IAM_ROUTES.identities },
  { label: "Sessions", href: IAM_ROUTES.sessions },
  { label: "API Keys", href: IAM_ROUTES.apiKeys },
  { label: "Service Accounts", href: IAM_ROUTES.serviceAccounts },
  { label: "Policies", href: IAM_ROUTES.policies },
  { label: "Providers", href: IAM_ROUTES.providers },
  { label: "Security", href: IAM_ROUTES.security },
] as const;

export const IAM_AUTH_METHODS = [
  "EMAIL_PASSWORD",
  "MAGIC_LINK",
  "PASSKEY",
  "OAUTH2",
  "OIDC",
  "SAML",
] as const;

export const IAM_OAUTH_PROVIDERS = ["google", "microsoft", "apple", "github", "linkedin"] as const;

export const DEFAULT_IAM_POLICY_RULES = {
  passwordMinLength: 12,
  requireMfa: false,
  sessionTimeoutMinutes: 480,
  allowedCountries: [] as string[],
  deniedIpAddresses: [] as string[],
  loginHoursStart: "00:00",
  loginHoursEnd: "23:59",
} as const;
