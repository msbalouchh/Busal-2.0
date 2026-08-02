import type { StaffManagementInput } from "@/modules/staff-management/types/staff-management-types";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+]?[\d\s().-]{7,20}$/;
const EMPLOYEE_CODE_PATTERN = /^[A-Z0-9][A-Z0-9-_]{1,31}$/;

export function normalizeEmployeeCode(code: string): string {
  return code.trim().toUpperCase();
}

export function buildStaffFullName(firstName: string, lastName: string): string {
  return `${firstName.trim()} ${lastName.trim()}`.trim();
}

export function validateStaffInput(
  input: StaffManagementInput,
  options: { requireEmail?: boolean } = {},
): void {
  if (!input.firstName.trim()) {
    throw new Error("First name is required");
  }

  if (!input.lastName.trim()) {
    throw new Error("Last name is required");
  }

  if (options.requireEmail && !input.email?.trim()) {
    throw new Error("Email is required");
  }

  if (input.email?.trim() && !EMAIL_PATTERN.test(input.email.trim())) {
    throw new Error("Enter a valid email address");
  }

  if (input.phone?.trim() && !PHONE_PATTERN.test(input.phone.trim())) {
    throw new Error("Enter a valid phone number");
  }

  if (
    input.employeeCode?.trim() &&
    !EMPLOYEE_CODE_PATTERN.test(normalizeEmployeeCode(input.employeeCode))
  ) {
    throw new Error(
      "Employee code must be 2-32 characters using letters, numbers, hyphens, or underscores",
    );
  }

  if (input.hourlyRate != null && input.hourlyRate < 0) {
    throw new Error("Hourly rate cannot be negative");
  }

  if (input.monthlySalary != null && input.monthlySalary < 0) {
    throw new Error("Monthly salary cannot be negative");
  }

  if (
    input.emergencyContact?.phone?.trim() &&
    !PHONE_PATTERN.test(input.emergencyContact.phone.trim())
  ) {
    throw new Error("Enter a valid emergency contact phone number");
  }
}
