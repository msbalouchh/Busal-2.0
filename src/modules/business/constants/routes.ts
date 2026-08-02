export const BUSINESS_ROUTES = {
  overview: "/dashboard/business",
  profile: "/dashboard/business/profile",
  general: "/dashboard/business/general",
  branches: "/dashboard/business/branches",
  hours: "/dashboard/business/hours",
  contact: "/dashboard/business/contact",
  address: "/dashboard/business/address",
  branding: "/dashboard/business/branding",
  settings: "/dashboard/business/settings",
} as const;

export const BUSINESS_NAV_ITEMS = [
  { label: "Overview", href: BUSINESS_ROUTES.overview },
  { label: "Profile", href: BUSINESS_ROUTES.profile },
  { label: "Contact", href: BUSINESS_ROUTES.contact },
  { label: "Address", href: BUSINESS_ROUTES.address },
  { label: "Branches", href: BUSINESS_ROUTES.branches },
  { label: "Branding", href: BUSINESS_ROUTES.branding },
  { label: "Settings", href: BUSINESS_ROUTES.settings },
  { label: "Hours", href: BUSINESS_ROUTES.hours },
] as const;

export const WEEKDAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
] as const;

export const CONTACT_TYPE_OPTIONS = [
  { value: "PHONE", label: "Phone" },
  { value: "EMAIL", label: "Email" },
  { value: "WEBSITE", label: "Website" },
  { value: "SOCIAL", label: "Social" },
  { value: "OTHER", label: "Other" },
] as const;

export type ContactTypeValue = (typeof CONTACT_TYPE_OPTIONS)[number]["value"];
