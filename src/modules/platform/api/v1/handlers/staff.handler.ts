import "server-only";

import { jsonSuccess, withPlatformApiAuth } from "@/modules/platform/api/v1/platform-api-handler";
import { PLATFORM_API_SCOPES } from "@/modules/platform/constants/api-scopes";
import { resolveStaffScopeFromBusiness, toStaffPlatformContext } from "@/modules/staff/lib/staff-scope";
import { staffService } from "@/modules/staff/services/staff.service";
import { staffSearchSchema } from "@/modules/staff/validation/staff-schemas";

export async function handleV1ListStaff(request: Request) {
  return withPlatformApiAuth(request, [PLATFORM_API_SCOPES.STAFF_READ], async (auth) => {
    const scope = await resolveStaffScopeFromBusiness(auth.businessId);
    const context = toStaffPlatformContext(scope);
    const url = new URL(request.url);
    const parsed = staffSearchSchema.parse(Object.fromEntries(url.searchParams.entries()));
    const result = await staffService.search(parsed, context);
    return jsonSuccess(result);
  });
}
