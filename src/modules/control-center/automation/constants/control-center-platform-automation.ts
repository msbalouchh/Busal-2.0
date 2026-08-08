export const CONTROL_CENTER_PLATFORM_AUTOMATION_ROUTES = {
  hub: "/control-center/automation",
} as const;

export const PLATFORM_AUTOMATION_PAGE_SIZE = 20;
export const PLATFORM_AUTOMATION_EXECUTION_PAGE_SIZE = 20;
export const PLATFORM_AUTOMATION_AUDIT_PAGE_SIZE = 50;
export const PLATFORM_AUTOMATION_MAX_EXECUTIONS = 5000;
export const PLATFORM_AUTOMATION_MAX_AUDIT_ENTRIES = 10000;

export const PLATFORM_AUTOMATION_WORKFLOWS_KEY = "platform.automation.workflows";
export const PLATFORM_AUTOMATION_EXECUTIONS_KEY = "platform.automation.executions";
export const PLATFORM_AUTOMATION_AUDIT_KEY = "platform.automation.audit";

export const PLATFORM_AUTOMATION_CATEGORIES = [
  "platform",
  "business",
  "workspace",
  "subscription",
  "payment",
  "invoice",
  "revenue",
  "security",
  "monitoring",
  "ai",
  "feature_flag",
  "crm",
  "orders",
  "inventory",
  "reservations",
  "notifications",
  "support",
  "integrations",
  "webhooks",
] as const;

export const PLATFORM_AUTOMATION_STATUSES = [
  "draft",
  "active",
  "paused",
  "archived",
] as const;

export const PLATFORM_AUTOMATION_PRIORITIES = ["low", "medium", "high", "critical"] as const;

export const PLATFORM_AUTOMATION_TRIGGERS = [
  "platform",
  "business",
  "workspace",
  "subscription",
  "payment",
  "invoice",
  "revenue",
  "security",
  "monitoring",
  "ai",
  "feature_flag",
  "crm",
  "orders",
  "inventory",
  "reservations",
  "notifications",
  "support",
  "integrations",
  "webhooks",
  "cron",
  "manual",
] as const;

export const PLATFORM_AUTOMATION_CONDITION_OPERATORS = [
  "equals",
  "greater_than",
  "less_than",
  "contains",
  "changed",
  "date",
  "time",
  "schedule",
] as const;

export const PLATFORM_AUTOMATION_CONDITION_FIELDS = [
  "business_plan",
  "usage",
  "ai_usage",
  "storage",
  "mrr",
  "health_score",
  "risk_score",
  "status",
  "days_inactive",
  "payment_failures",
  "platform_health",
  "provider_status",
] as const;

export const PLATFORM_AUTOMATION_ACTION_TYPES = [
  "send_notification",
  "send_email",
  "create_support_ticket",
  "generate_ai_report",
  "run_ai_analysis",
  "create_task",
  "publish_orchestration_event",
  "pause_feature",
  "enable_feature",
  "suspend_business",
  "activate_business",
  "assign_operator",
  "create_incident",
  "webhook",
  "platform_announcement",
] as const;

export const PLATFORM_AUTOMATION_EXECUTION_STATUSES = [
  "pending",
  "running",
  "completed",
  "failed",
  "cancelled",
] as const;

export const PLATFORM_AUTOMATION_AUDIT_EVENTS = [
  "automation.created",
  "automation.updated",
  "automation.cloned",
  "automation.paused",
  "automation.resumed",
  "automation.deleted",
  "automation.executed",
  "execution.started",
  "execution.completed",
  "execution.failed",
  "execution.retried",
  "emergency_stop",
] as const;
