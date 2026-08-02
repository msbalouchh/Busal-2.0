export const BUSINESS_PROFILE_ROUTES = {
  overview: "/dashboard/business",
  profile: "/dashboard/business/profile",
  contact: "/dashboard/business/contact",
  address: "/dashboard/business/address",
  branches: "/dashboard/business/branches",
  branding: "/dashboard/business/branding",
  settings: "/dashboard/business/settings",
  hours: "/dashboard/business/hours",
  general: "/dashboard/business/general",
} as const;

export const BUSINESS_PROFILE_NAV_ITEMS = [
  { label: "Overview", href: BUSINESS_PROFILE_ROUTES.overview },
  { label: "Profile", href: BUSINESS_PROFILE_ROUTES.profile },
  { label: "Contact", href: BUSINESS_PROFILE_ROUTES.contact },
  { label: "Address", href: BUSINESS_PROFILE_ROUTES.address },
  { label: "Branches", href: BUSINESS_PROFILE_ROUTES.branches },
  { label: "Branding", href: BUSINESS_PROFILE_ROUTES.branding },
  { label: "Settings", href: BUSINESS_PROFILE_ROUTES.settings },
  { label: "Hours", href: BUSINESS_PROFILE_ROUTES.hours },
] as const;

export const INDUSTRY_OPTIONS = [
  { value: "HOSPITALITY", label: "Hospitality" },
  { value: "FOOD_BEVERAGE", label: "Food & Beverage" },
  { value: "RETAIL", label: "Retail" },
  { value: "HEALTHCARE", label: "Healthcare" },
  { value: "BEAUTY_WELLNESS", label: "Beauty & Wellness" },
  { value: "PROFESSIONAL_SERVICES", label: "Professional Services" },
  { value: "TECHNOLOGY", label: "Technology" },
  { value: "EDUCATION", label: "Education" },
  { value: "MANUFACTURING", label: "Manufacturing" },
  { value: "OTHER", label: "Other" },
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

export const CURRENCY_OPTIONS = [
  { value: "GBP", label: "GBP (£)" },
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
] as const;

export const LANGUAGE_OPTIONS = [
  { value: "en-GB", label: "English (UK)" },
  { value: "en-US", label: "English (US)" },
  { value: "fr-FR", label: "French" },
] as const;

export const TIMEZONE_OPTIONS = [
  { value: "UTC", label: "UTC" },
  { value: "Europe/London", label: "Europe/London" },
  { value: "America/New_York", label: "America/New_York" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles" },
  { value: "Asia/Dubai", label: "Asia/Dubai" },
] as const;

export const WEEK_START_OPTIONS = [
  { value: "monday", label: "Monday" },
  { value: "sunday", label: "Sunday" },
] as const;

export const BUSINESS_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "maintenance", label: "Maintenance" },
] as const;

export const ALLOWED_IMAGE_MIME_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
export const MAX_BUSINESS_ASSET_SIZE_BYTES = 5 * 1024 * 1024;

export const BUSINESS_SETTING_KEYS = {
  primaryColor: "branding.primary_color",
  secondaryColor: "branding.secondary_color",
  timezone: "localization.timezone",
  locale: "localization.locale",
  currency: "currency.default",
  dateFormat: "localization.date_format",
  timeFormat: "localization.time_format",
  weekStart: "business.week_start",
  businessStatus: "business.status",
  autoConfirmOrders: "business.auto_confirm_orders",
  allowOnlineOrdering: "business.allow_online_ordering",
  requireStaffPin: "business.require_staff_pin",
} as const;
