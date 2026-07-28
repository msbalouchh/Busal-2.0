export const BUSINESS_GOAL_OPTIONS = [
  { value: "Increase Sales", label: "Increase Sales" },
  { value: "Save Time", label: "Save Time" },
  { value: "More Bookings", label: "More Bookings" },
  { value: "Better Customer Service", label: "Better Customer Service" },
  { value: "Reduce Staff Workload", label: "Reduce Staff Workload" },
  { value: "Better Reporting", label: "Better Reporting" },
  { value: "Grow to Another Branch", label: "Grow to Another Branch" },
] as const;

export type BusinessGoalValue = (typeof BUSINESS_GOAL_OPTIONS)[number]["value"];

export const BUSINESS_GOAL_VALUES = BUSINESS_GOAL_OPTIONS.map(
  (option) => option.value,
) as BusinessGoalValue[];

export function isBusinessGoalValue(value: string): value is BusinessGoalValue {
  return BUSINESS_GOAL_VALUES.includes(value as BusinessGoalValue);
}
