export const CONTROL_CENTER_SECURITY_ROUTES = {
  hub: "/control-center/security",
} as const;

export const CONTROL_CENTER_SECURITY_PAGE_SIZE = 20;

export const SECURITY_EVENT_FILTER_OPTIONS = [
  "LOGIN",
  "LOGIN_FAILED",
  "LOGOUT",
  "MFA_ENABLED",
  "MFA_DISABLED",
  "PASSWORD_CHANGED",
  "PASSWORD_RESET",
  "SESSION_REVOKED",
  "ACCOUNT_LOCKED",
  "ACCOUNT_UNLOCKED",
  "SUSPICIOUS_ACTIVITY",
  "POLICY_VIOLATION",
  "API_KEY_CREATED",
  "API_KEY_REVOKED",
] as const;

export const SECURITY_ACCOUNT_STATUS_OPTIONS = [
  "ACTIVE",
  "LOCKED",
  "SUSPENDED",
  "PENDING_RESET",
] as const;

export const SECURITY_SORT_OPTIONS = ["createdAt", "lastActivity", "eventType", "status"] as const;

export const SECURITY_REPORT_HEADERS = [
  "Health Score",
  "Active Sessions",
  "Failed Logins (24h)",
  "MFA Enrolled",
  "Locked Accounts",
  "Open Alerts",
  "Suspicious Events (24h)",
] as const;
