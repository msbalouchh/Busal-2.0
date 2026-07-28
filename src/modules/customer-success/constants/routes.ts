export const CUSTOMER_SUCCESS_ROUTES = {
  overview: "/dashboard/customer-success",
  profiles: "/dashboard/customer-success/profiles",
  health: "/dashboard/customer-success/health",
  tasks: "/dashboard/customer-success/tasks",
  playbooks: "/dashboard/customer-success/playbooks",
  feedback: "/dashboard/customer-success/feedback",
  renewals: "/dashboard/customer-success/renewals",
  expansion: "/dashboard/customer-success/expansion",
  reviews: "/dashboard/customer-success/reviews",
} as const;

export const CUSTOMER_SUCCESS_NAV_ITEMS = [
  { label: "Dashboard", href: CUSTOMER_SUCCESS_ROUTES.overview },
  { label: "Customer 360°", href: CUSTOMER_SUCCESS_ROUTES.profiles },
  { label: "Health Scores", href: CUSTOMER_SUCCESS_ROUTES.health },
  { label: "Tasks", href: CUSTOMER_SUCCESS_ROUTES.tasks },
  { label: "Playbooks", href: CUSTOMER_SUCCESS_ROUTES.playbooks },
  { label: "Feedback", href: CUSTOMER_SUCCESS_ROUTES.feedback },
  { label: "Renewals", href: CUSTOMER_SUCCESS_ROUTES.renewals },
  { label: "Expansion", href: CUSTOMER_SUCCESS_ROUTES.expansion },
  { label: "EBR Reviews", href: CUSTOMER_SUCCESS_ROUTES.reviews },
] as const;

export const CUSTOMER_HEALTH_STATUS_LABELS = {
  HEALTHY: "Healthy",
  STABLE: "Stable",
  AT_RISK: "At risk",
  CRITICAL: "Critical",
} as const;

export const CUSTOMER_FEEDBACK_TYPE_LABELS = {
  CSAT: "CSAT",
  NPS: "NPS",
  FEATURE_REQUEST: "Feature request",
  COMPLAINT: "Complaint",
} as const;
