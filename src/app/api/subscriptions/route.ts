import { NextResponse } from "next/server";

import { billingService } from "@/modules/billing/services/billing.service";
import { subscriptionLifecycleService } from "@/modules/commercial-foundation/services/subscription-lifecycle.service";
import { PLATFORM_MODULE_KEYS } from "@/modules/feature-access";
import { assertPlatformModuleFromContext } from "@/modules/feature-access/guards/platform-feature.guard";
import {
  handlePlatformRouteError,
  protectedRoute,
} from "@/modules/platform-guards/guards/route.guards";

export async function GET() {
  try {
    const platform = await protectedRoute();
    await assertPlatformModuleFromContext(platform, PLATFORM_MODULE_KEYS.BILLING);

    const record = await billingService.loadRecord(platform.business.id);
    return NextResponse.json({ success: true, data: record.subscription });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const platform = await protectedRoute();
    await assertPlatformModuleFromContext(platform, PLATFORM_MODULE_KEYS.BILLING);

    const body = (await request.json()) as { planSlug?: string; trialDays?: number };
    const businessId = platform.business.id;

    if (body.planSlug) {
      const record = await subscriptionLifecycleService.assignPlan(businessId, body.planSlug);
      return NextResponse.json({ success: true, data: record.subscription });
    }

    const record = await subscriptionLifecycleService.startTrial(
      businessId,
      "plan-starter",
      body.trialDays ?? 14,
    );

    return NextResponse.json({ success: true, data: record.subscription });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const platform = await protectedRoute();
    await assertPlatformModuleFromContext(platform, PLATFORM_MODULE_KEYS.BILLING);

    const body = (await request.json()) as { action?: "renew" | "pause" | "resume" | "cancel" };
    const businessId = platform.business.id;

    switch (body.action) {
      case "renew":
        return NextResponse.json({
          success: true,
          data: await subscriptionLifecycleService.renewSubscription(businessId),
        });
      case "pause":
        return NextResponse.json({
          success: true,
          data: await subscriptionLifecycleService.pauseSubscription(businessId),
        });
      case "resume":
        return NextResponse.json({
          success: true,
          data: await subscriptionLifecycleService.resumeSubscription(businessId),
        });
      case "cancel":
        return NextResponse.json({
          success: true,
          data: await subscriptionLifecycleService.cancelSubscription(businessId, true),
        });
      default:
        return NextResponse.json({ success: false, error: "Unsupported action" }, { status: 400 });
    }
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}
