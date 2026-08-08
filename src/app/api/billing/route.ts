import { NextResponse } from "next/server";

import { billingService } from "@/modules/billing/services/billing.service";
import { PLATFORM_MODULE_KEYS } from "@/modules/feature-access";
import { assertPlatformModuleFromContext } from "@/modules/feature-access/guards/platform-feature.guard";
import { stripeBillingService } from "@/modules/commercial-foundation/services/stripe-billing.service";
import { usageTrackingService } from "@/modules/commercial-foundation/services/usage-tracking.service";
import {
  handlePlatformRouteError,
  protectedRoute,
} from "@/modules/platform-guards/guards/route.guards";

export async function GET() {
  try {
    const platform = await protectedRoute();
    await assertPlatformModuleFromContext(platform, PLATFORM_MODULE_KEYS.BILLING);

    const [record, usage] = await Promise.all([
      billingService.loadRecord(platform.business.id),
      usageTrackingService.getUsageSummary(platform.business.id),
    ]);

    return NextResponse.json({ success: true, data: { record, usage } });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const platform = await protectedRoute();
    await assertPlatformModuleFromContext(platform, PLATFORM_MODULE_KEYS.BILLING);

    const body = (await request.json()) as {
      action?: string;
      targetPlanId?: string;
      subscriptionId?: string;
      couponCode?: string;
      atPeriodEnd?: boolean;
      successUrl?: string;
      cancelUrl?: string;
      planId?: string;
      billingCycle?: "monthly" | "annual";
    };

    const businessId = platform.business.id;

    switch (body.action) {
      case "upgrade":
        return NextResponse.json({
          success: true,
          data: await billingService.upgradeSubscriptionForBusiness(businessId, {
            subscriptionId: body.subscriptionId ?? "",
            targetPlanId: body.targetPlanId ?? "",
          }),
        });
      case "downgrade":
        return NextResponse.json({
          success: true,
          data: await billingService.downgradeSubscriptionForBusiness(businessId, {
            subscriptionId: body.subscriptionId ?? "",
            targetPlanId: body.targetPlanId ?? "",
          }),
        });
      case "pause":
        return NextResponse.json({
          success: true,
          data: await billingService.pauseSubscriptionForBusiness(businessId),
        });
      case "resume":
        return NextResponse.json({
          success: true,
          data: await billingService.resumeSubscriptionForBusiness(businessId),
        });
      case "cancel":
        return NextResponse.json({
          success: true,
          data: await billingService.cancelSubscriptionForBusiness(businessId, body.atPeriodEnd ?? true),
        });
      case "apply_coupon":
        return NextResponse.json({
          success: true,
          data: await billingService.applyCouponForBusiness(businessId, {
            subscriptionId: body.subscriptionId ?? "",
            couponCode: body.couponCode ?? "",
          }),
        });
      case "checkout":
        return NextResponse.json({
          success: true,
          data: await stripeBillingService.createCheckoutSession({
            businessId,
            planId: body.planId ?? "",
            billingCycle: body.billingCycle ?? "monthly",
            successUrl: body.successUrl ?? `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/dashboard/billing`,
            cancelUrl: body.cancelUrl ?? `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/dashboard/billing`,
            customerEmail: platform.user.email,
          }),
        });
      case "portal":
        return NextResponse.json({
          success: true,
          data: await stripeBillingService.createPortalSession({
            businessId,
            returnUrl: body.successUrl ?? `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/dashboard/billing`,
          }),
        });
      default:
        return NextResponse.json({ success: false, error: "Unsupported billing action" }, { status: 400 });
    }
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}
