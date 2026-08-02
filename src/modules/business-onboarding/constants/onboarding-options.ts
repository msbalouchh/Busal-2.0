export const INDUSTRY_OPTIONS = [
  { value: "Restaurant", label: "Restaurant" },
  { value: "Retail", label: "Retail" },
  { value: "Clinic", label: "Clinic" },
  { value: "Salon", label: "Salon" },
  { value: "Gym", label: "Gym" },
  { value: "Hotel", label: "Hotel" },
  { value: "Professional Services", label: "Professional Services" },
  { value: "Hospitality", label: "Hospitality & Food Service" },
  { value: "Health & Wellness", label: "Health & Wellness" },
  { value: "Technology", label: "Technology" },
  { value: "Other", label: "Other" },
] as const;

export const BUSINESS_TYPE_OPTIONS = [
  { value: "RESTAURANT", label: "Restaurant" },
  { value: "CAFE", label: "Cafe" },
  { value: "RETAIL", label: "Retail store" },
  { value: "SALON", label: "Salon & spa" },
  { value: "CLINIC", label: "Clinic" },
  { value: "HOTEL", label: "Hotel" },
  { value: "GYM", label: "Gym & fitness" },
  { value: "SERVICES", label: "Professional services" },
  { value: "OTHER", label: "Other" },
] as const;

export const COUNTRY_OPTIONS = [
  { value: "GB", label: "United Kingdom" },
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "AU", label: "Australia" },
  { value: "IE", label: "Ireland" },
  { value: "AE", label: "United Arab Emirates" },
  { value: "SG", label: "Singapore" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
] as const;

export const TIMEZONE_OPTIONS = [
  { value: "Europe/London", label: "Europe/London (GMT/BST)" },
  { value: "Europe/Dublin", label: "Europe/Dublin" },
  { value: "Europe/Paris", label: "Europe/Paris" },
  { value: "America/New_York", label: "America/New_York" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles" },
  { value: "America/Toronto", label: "America/Toronto" },
  { value: "Asia/Dubai", label: "Asia/Dubai" },
  { value: "Asia/Singapore", label: "Asia/Singapore" },
  { value: "Australia/Sydney", label: "Australia/Sydney" },
] as const;

export const CURRENCY_OPTIONS = [
  { value: "GBP", label: "GBP — British Pound" },
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "CAD", label: "CAD — Canadian Dollar" },
  { value: "AUD", label: "AUD — Australian Dollar" },
  { value: "AED", label: "AED — UAE Dirham" },
  { value: "SGD", label: "SGD — Singapore Dollar" },
] as const;

export const LANGUAGE_OPTIONS = [
  { value: "en-GB", label: "English (UK)" },
  { value: "en-US", label: "English (US)" },
  { value: "fr-FR", label: "French" },
  { value: "de-DE", label: "German" },
  { value: "es-ES", label: "Spanish" },
  { value: "ar-AE", label: "Arabic" },
] as const;

export const DATE_FORMAT_OPTIONS = [
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
] as const;

export const TIME_FORMAT_OPTIONS = [
  { value: "12h", label: "12-hour" },
  { value: "24h", label: "24-hour" },
] as const;

export const MODULE_OPTIONS = [
  { id: "pos", label: "POS", description: "Point of sale & checkout" },
  { id: "crm", label: "CRM", description: "Customer relationships" },
  { id: "reservations", label: "Reservations", description: "Bookings & tables" },
  { id: "inventory", label: "Inventory", description: "Stock & suppliers" },
  { id: "kitchen", label: "Kitchen Display", description: "Kitchen tickets & display" },
  { id: "qr-ordering", label: "QR Ordering", description: "Contactless menu ordering" },
  { id: "staff", label: "Staff", description: "Scheduling & roles" },
  { id: "payroll", label: "Payroll", description: "Pay runs & compliance" },
  { id: "analytics", label: "Analytics", description: "Reports & insights" },
  { id: "marketing", label: "Marketing", description: "Campaigns & outreach" },
  { id: "loyalty", label: "Loyalty", description: "Rewards & retention" },
  { id: "finance", label: "Finance", description: "Accounting & reconciliation" },
  { id: "ai", label: "AI", description: "Intelligent agents & automation" },
] as const;

export const AI_AGENT_OPTIONS = [
  { id: "operations", label: "Operations", description: "Day-to-day ops orchestration" },
  { id: "sales", label: "Sales", description: "Pipeline & revenue intelligence" },
  { id: "marketing", label: "Marketing", description: "Campaigns & audience insights" },
  { id: "support", label: "Support", description: "Customer service automation" },
  { id: "finance", label: "Finance", description: "Cashflow & forecasting" },
  { id: "hr", label: "HR", description: "People & scheduling" },
  { id: "inventory", label: "Inventory", description: "Stock optimization" },
  { id: "restaurant", label: "Restaurant", description: "Covers, kitchen & service" },
  { id: "voice", label: "Voice", description: "Voice AI interfaces" },
  { id: "knowledge", label: "Knowledge", description: "Business knowledge base" },
  { id: "memory", label: "Memory", description: "Contextual business memory" },
  { id: "workflow", label: "Workflow Automation", description: "Cross-module automations" },
] as const;

export const TEAM_ROLE_OPTIONS = [
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "cashier", label: "Cashier" },
  { value: "chef", label: "Chef" },
  { value: "waiter", label: "Waiter" },
  { value: "accountant", label: "Accountant" },
  { value: "support", label: "Support" },
] as const;

export const SUBSCRIPTION_PLANS = [
  {
    id: "trial" as const,
    label: "Trial",
    description: "14-day full access — no card required",
    price: "Free",
  },
  {
    id: "starter" as const,
    label: "Starter",
    description: "Single location, core modules",
    price: "£49/mo",
  },
  {
    id: "growth" as const,
    label: "Growth",
    description: "Multi-location, AI agents included",
    price: "£149/mo",
  },
  {
    id: "professional" as const,
    label: "Professional",
    description: "Advanced analytics & automation",
    price: "£349/mo",
  },
  {
    id: "enterprise" as const,
    label: "Enterprise",
    description: "Custom SLA, dedicated success",
    price: "Custom",
  },
] as const;

export const INDUSTRY_MODULE_RECOMMENDATIONS: Record<string, string[]> = {
  Restaurant: [
    "pos",
    "reservations",
    "kitchen",
    "inventory",
    "qr-ordering",
    "staff",
    "analytics",
    "ai",
  ],
  Retail: ["pos", "inventory", "crm", "loyalty", "analytics", "finance", "ai"],
  Clinic: ["crm", "reservations", "staff", "finance", "analytics", "ai"],
  Salon: ["crm", "reservations", "staff", "marketing", "loyalty", "ai"],
  Gym: ["crm", "staff", "payroll", "marketing", "analytics", "ai"],
  Hotel: ["pos", "reservations", "crm", "staff", "finance", "analytics", "ai"],
  "Professional Services": ["crm", "finance", "marketing", "analytics", "ai"],
  Hospitality: ["pos", "reservations", "kitchen", "inventory", "staff", "analytics", "ai"],
  "Health & Wellness": ["crm", "reservations", "staff", "finance", "ai"],
  Technology: ["crm", "analytics", "marketing", "finance", "ai"],
  Other: ["pos", "crm", "analytics", "ai"],
};

export const DEFAULT_PRIMARY_COLOR = "#3B82F6";
export const DEFAULT_SECONDARY_COLOR = "#8B5CF6";
export const DEFAULT_ACCENT_COLOR = "#06B6D4";
