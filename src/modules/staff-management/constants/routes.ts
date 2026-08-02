export const STAFF_MANAGEMENT_ROUTES = {
  list: "/app/staff",
  create: "/app/staff/new",
  details: (staffId: string) => `/app/staff/${staffId}`,
  edit: (staffId: string) => `/app/staff/${staffId}/edit`,
} as const;

export const STAFF_LIST_PAGE_SIZE = 12;

export const STAFF_STATUS_FILTER_OPTIONS = [
  { value: "ALL", label: "All statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "ARCHIVED", label: "Archived" },
  { value: "ON_LEAVE", label: "On leave" },
  { value: "PROBATION", label: "Probation" },
  { value: "TERMINATED", label: "Terminated" },
] as const;

export const STAFF_SALARY_TYPE_OPTIONS = [
  { value: "HOURLY", label: "Hourly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "SALARIED", label: "Salaried" },
] as const;

export const STAFF_GENDER_OPTIONS = [
  { value: "", label: "Prefer not to say" },
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "NON_BINARY", label: "Non-binary" },
  { value: "OTHER", label: "Other" },
] as const;

export const STAFF_DEPARTMENT_OPTIONS = [
  "Operations",
  "Front of House",
  "Kitchen",
  "Management",
  "Sales",
  "Marketing",
  "Finance",
  "HR",
  "IT",
  "Customer Success",
] as const;
