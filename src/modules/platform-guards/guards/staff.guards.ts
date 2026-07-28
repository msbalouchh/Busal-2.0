import "server-only";

import type { BusinessContext } from "@/modules/business-context/types/business-context";
import { requireBusinessContext } from "@/modules/business-context/services/business-context.service";
import { mapToPlatformGuardError } from "@/modules/platform-guards/utils/error-mapper";
import { staffInactive } from "@/modules/platform-guards/utils/platform-guard-errors";
import type { StaffSessionData } from "@/modules/staff-auth/types/staff-session";

export async function requireStaff(): Promise<{
  context: BusinessContext;
  staffSession: StaffSessionData;
}> {
  try {
    const context = await requireBusinessContext();

    if (!context.staffSession) {
      throw staffInactive();
    }

    return {
      context,
      staffSession: context.staffSession,
    };
  } catch (error) {
    throw mapToPlatformGuardError(error);
  }
}

export function assertStaffActive(context: BusinessContext): void {
  if (!context.isOwner && !context.staffSession) {
    throw staffInactive();
  }
}
