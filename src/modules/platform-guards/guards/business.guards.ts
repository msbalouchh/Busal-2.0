import "server-only";

import {
  requireBusinessContext as resolveBusinessContext,
  requireBusinessContextForApi as resolveBusinessContextForApi,
} from "@/modules/business-context/services/business-context.service";
import type { BusinessContext } from "@/modules/business-context/types/business-context";
import { requireBusiness as requireAuthorizationBusiness } from "@/modules/authorization/guards/permission-guards";
import { mapToPlatformGuardError } from "@/modules/platform-guards/utils/error-mapper";
import {
  businessNotActive,
  businessRequired,
} from "@/modules/platform-guards/utils/platform-guard-errors";

export async function requireBusinessContext(): Promise<BusinessContext> {
  return resolveBusinessContext();
}

export async function requireBusinessContextForPlatformApi(): Promise<BusinessContext> {
  try {
    return await resolveBusinessContextForApi();
  } catch (error) {
    throw mapToPlatformGuardError(error);
  }
}

export async function requireBusiness(): Promise<BusinessContext> {
  try {
    await requireAuthorizationBusiness();
    return resolveBusinessContext();
  } catch (error) {
    throw mapToPlatformGuardError(error);
  }
}

export function assertBusinessActive(context: BusinessContext): void {
  if (!context.business.onboardingCompleted) {
    throw businessNotActive();
  }
}

export function assertBusinessSelected(context: BusinessContext): void {
  if (!context.business.id) {
    throw businessRequired();
  }
}
