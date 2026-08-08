export const CONTROL_CENTER_PLATFORM_SETTINGS_ROUTES = {
  hub: "/control-center/settings",
} as const;

export const PLATFORM_SETTINGS_SCOPE_IDENTIFIER = "platform";

export const PLATFORM_SETTINGS_GROUPS = [
  {
    id: "general",
    title: "General",
    description: "Core platform identity and contact defaults.",
    keys: ["general.platform_name", "general.business_name", "general.support_email"],
  },
  {
    id: "authentication",
    title: "Authentication",
    description: "Login, session, and credential policies.",
    keys: [
      "auth.session_timeout_minutes",
      "auth.password_min_length",
      "auth.allow_sso",
      "security.mfa_required",
    ],
  },
  {
    id: "commercial",
    title: "Commercial",
    description: "Plans, trials, and commercial defaults.",
    keys: ["commercial.default_plan", "commercial.trial_days"],
  },
  {
    id: "billing",
    title: "Billing",
    description: "Invoice and payment configuration.",
    keys: ["billing.invoice_prefix", "billing.payment_terms_days", "billing.auto_charge"],
  },
  {
    id: "stripe",
    title: "Stripe",
    description: "Stripe integration settings.",
    keys: ["stripe.enabled", "stripe.webhook_tolerance_seconds"],
  },
  {
    id: "ai",
    title: "AI",
    description: "Platform-wide AI defaults.",
    keys: ["ai.default_model", "ai.platform_token_limit"],
  },
  {
    id: "notifications",
    title: "Notifications",
    description: "Platform notification channels.",
    keys: ["notifications.email_enabled", "notifications.platform_alerts"],
  },
  {
    id: "security",
    title: "Security",
    description: "Security and audit defaults.",
    keys: ["security.audit_retention_days", "security.ip_allowlist_enabled"],
  },
  {
    id: "storage",
    title: "Storage",
    description: "Upload limits and storage quotas.",
    keys: ["storage.max_upload_mb", "storage.default_quota_gb"],
  },
  {
    id: "platform",
    title: "Platform",
    description: "Platform runtime configuration.",
    keys: ["platform.current_version"],
  },
  {
    id: "backups",
    title: "Backups",
    description: "Backup retention and automation.",
    keys: ["backups.retention_days", "backups.auto_backup_enabled"],
  },
  {
    id: "feature-defaults",
    title: "Feature Defaults",
    description: "Default feature flags for new tenants.",
    keys: ["general.feature_flags"],
  },
  {
    id: "branding",
    title: "Branding",
    description: "Platform branding defaults.",
    keys: ["branding.primary_color", "branding.platform_logo_url"],
  },
  {
    id: "localization",
    title: "Localization",
    description: "Locale, timezone, and currency defaults.",
    keys: ["localization.locale", "localization.timezone", "currency.default"],
  },
  {
    id: "maintenance",
    title: "Maintenance",
    description: "Maintenance windows and messaging.",
    keys: [
      "platform.maintenance_mode",
      "platform.maintenance_message",
      "platform.maintenance_scheduled_at",
    ],
  },
] as const;

export type PlatformSettingsGroupId = (typeof PLATFORM_SETTINGS_GROUPS)[number]["id"];
