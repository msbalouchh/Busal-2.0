import type { StaffProfileDetails } from "@/modules/staff/types/staff-management-types";

export function parseStaffProfile(raw: unknown): StaffProfileDetails {
  const profile =
    raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const emergency =
    profile.emergencyContact &&
    typeof profile.emergencyContact === "object" &&
    !Array.isArray(profile.emergencyContact)
      ? (profile.emergencyContact as Record<string, unknown>)
      : {};

  return {
    notes: typeof profile.notes === "string" ? profile.notes : "",
    avatarUrl: typeof profile.avatarUrl === "string" ? profile.avatarUrl : null,
    emergencyContact: {
      name: typeof emergency.name === "string" ? emergency.name : "",
      phone: typeof emergency.phone === "string" ? emergency.phone : "",
      relationship: typeof emergency.relationship === "string" ? emergency.relationship : "",
    },
  };
}

export function mergeStaffProfile(
  existing: unknown,
  patch: Partial<StaffProfileDetails>,
): StaffProfileDetails {
  const current = parseStaffProfile(existing);

  return {
    notes: patch.notes ?? current.notes,
    avatarUrl: patch.avatarUrl ?? current.avatarUrl,
    emergencyContact: {
      ...current.emergencyContact,
      ...(patch.emergencyContact ?? {}),
    },
  };
}

export function getStaffInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}
