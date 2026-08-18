import "server-only";

import { NextResponse } from "next/server";

import {
  getCustomerAiPublicConfig,
  runCustomerAiChat,
} from "@/modules/customer-ai/services/customer-ai-chat.service";
import { verifyEmbedToken } from "@/modules/platform/services/platform-embed.service";
import { loadPlatformConsumptionConfig } from "@/modules/platform/lib/platform-settings";
import { resolvePlatformEntitlements } from "@/modules/platform/services/platform-entitlements.service";
import { prisma } from "@/lib/prisma";
import { aiRateLimiter } from "@/modules/ai-engine/performance/rate-limiter";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = typeof body.token === "string" ? body.token : "";
    const payload = verifyEmbedToken(token);

    if (!payload || payload.widgetType !== "ai") {
      return NextResponse.json({ success: false, error: "Invalid embed token" }, { status: 401 });
    }

    const tenant = await prisma.tenantRecord.findUnique({
      where: { businessId: payload.businessId },
      select: { subscriptionPlan: true },
    });

    if (!resolvePlatformEntitlements(tenant?.subscriptionPlan).embed) {
      return NextResponse.json({ success: false, error: "Embed not enabled for plan" }, { status: 403 });
    }

    const config = await loadPlatformConsumptionConfig(payload.businessId);
    if (!config.embed.enabled) {
      return NextResponse.json({ success: false, error: "Embeds disabled" }, { status: 403 });
    }

    aiRateLimiter.assertAllowed(`customer-ai-embed:${payload.businessId}`);

    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!message) {
      return NextResponse.json({ success: false, error: "Message required" }, { status: 400 });
    }

    const result = await runCustomerAiChat({
      businessId: payload.businessId,
      message,
      conversationId: typeof body.conversationId === "string" ? body.conversationId : undefined,
      sessionToken: typeof body.sessionToken === "string" ? body.sessionToken : undefined,
      channel: "embed",
      confirmedActions: Array.isArray(body.confirmedActions) ? body.confirmedActions : undefined,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Embed chat failed" },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token") ?? "";
    const payload = verifyEmbedToken(token);

    if (!payload || payload.widgetType !== "ai") {
      return NextResponse.json({ success: false, error: "Invalid embed token" }, { status: 401 });
    }

    const publicConfig = await getCustomerAiPublicConfig(payload.businessId);
    return NextResponse.json({ success: true, data: publicConfig });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to load config" },
      { status: 500 },
    );
  }
}
