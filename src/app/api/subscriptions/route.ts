import { NextResponse } from "next/server";

import { isProductionDeployment } from "@/lib/production-mode";
import { isStripeConfigured } from "@/lib/stripe";
import { billingService } from "@/modules/billing/services/billing.service";
import { canUseDevelopmentBillingFallback } from "@/modules/commercial-foundation/services/stripe-billing-config.service";
import { subscriptionLifecycleService } from "@/modules/commercial-foundation/services/subscription-lifecycle.service";
import {
  BUSAL_COMMERCIAL_PLAN_SLUGS,
  getSubscriptionPlanBySlug,
} from "@/modules/control-center/billing/registry/subscription-plan-registry";
import { PLATFORM_MODULE_KEYS } from "@/modules/feature-access";
import { assertPlatformModuleFromContext } from "@/modules/feature-access/guards/platform-feature.guard";
import {
  handlePlatformRouteError,
  protectedRoute,
} from "@/modules/platform-guards/guards/route.guards";

function directSubscriptionMutationBlocked(): boolean {
  return isProductionDeployment() || isStripeConfigured() || !canUseDevelopmentBillingFallback();
}

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

    if (directSubscriptionMutationBlocked()) {
      return NextResponse.json(
        {
          success: false,
          error: "Subscription changes must be completed through Stripe checkout or billing portal.",
          code: "BILLING_CHECKOUT_REQUIRED",
        },
        { status: 403 },
      );
    }

    const body = (await request.json()) as { planSlug?: string };
    const businessId = platform.business.id;

    if (body.planSlug) {
      const record = await subscriptionLifecycleService.assignPlan(businessId, body.planSlug);
      return NextResponse.json({ success: true, data: record.subscription });
    }

    const corePlan = getSubscriptionPlanBySlug(BUSAL_COMMERCIAL_PLAN_SLUGS.CORE);
    if (!corePlan) {
      return NextResponse.json({ success: false, error: "Core plan not configured" }, { status: 500 });
    }

    const record = await subscriptionLifecycleService.startTrial(businessId, corePlan.id);

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
