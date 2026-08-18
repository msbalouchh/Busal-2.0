import "server-only";

import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { jsonSuccess, withPlatformApiAuth } from "@/modules/platform/api/v1/platform-api-handler";
import { PLATFORM_API_SCOPES } from "@/modules/platform/constants/api-scopes";
import { getPlatformConsumptionConfig } from "@/modules/platform/services/platform-config.service";

export async function handleV1GetBusiness(request: Request) {
  return withPlatformApiAuth(request, [PLATFORM_API_SCOPES.BUSINESS_READ], async (auth) => {
    const [business, platformConfig, tenant] = await Promise.all([
      prisma.business.findUnique({
        where: { id: auth.businessId },
        select: {
          id: true,
          businessName: true,
          businessType: true,
          country: true,
          timezone: true,
          currency: true,
          createdAt: true,
        },
      }),
      getPlatformConsumptionConfig(auth.businessId),
      prisma.tenantRecord.findUnique({
        where: { businessId: auth.businessId },
        select: {
          subscriptionPlan: true,
          subscriptionStatus: true,
          lifecycleStatus: true,
        },
      }),
    ]);

    if (!business) {
      return NextResponse.json({ success: false, error: "Business not found" }, { status: 404 });
    }

    return jsonSuccess({
      business,
      platform: {
        deploymentMode: platformConfig.deploymentMode,
        whiteLabelEnabled: platformConfig.whiteLabelEnabled,
        apiEnabled: platformConfig.api.enabled,
      },
      subscription: tenant,
    });
  });
}
