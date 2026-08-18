import "server-only";

import { NextResponse } from "next/server";
import { z } from "zod";
import type { CustomerAiChatInput } from "@/modules/customer-ai/types/customer-ai.types";

import {
  getCustomerAiPublicConfig,
  runCustomerAiChat,
} from "@/modules/customer-ai/services/customer-ai-chat.service";
import { verifyEmbedToken } from "@/modules/platform/services/platform-embed.service";
import { loadPlatformConsumptionConfig } from "@/modules/platform/lib/platform-settings";
import { resolvePlatformEntitlements } from "@/modules/platform/services/platform-entitlements.service";
import { prisma } from "@/lib/prisma";
import { aiRateLimiter } from "@/modules/ai-engine/performance/rate-limiter";

const chatSchema = z.object({
  businessId: z.string().uuid(),
  message: z.string().min(1).max(4000),
  conversationId: z.string().uuid().optional(),
  sessionToken: z.string().optional(),
  channel: z.string().optional(),
  confirmedActions: z.array(z.string()).optional(),
  token: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = chatSchema.parse(await request.json());

    const token = body.token?.trim();
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Embed token is required" },
        { status: 401 },
      );
    }

    const payload = verifyEmbedToken(token);
    if (!payload || payload.widgetType !== "ai") {
      return NextResponse.json({ success: false, error: "Invalid embed token" }, { status: 401 });
    }

    if (body.businessId && body.businessId !== payload.businessId) {
      return NextResponse.json(
        { success: false, error: "Business ID does not match embed token" },
        { status: 403 },
      );
    }

    aiRateLimiter.assertAllowed(`customer-ai-public:${payload.businessId}`);

    const result = await runCustomerAiChat({
      businessId: payload.businessId,
      message: body.message,
      conversationId: body.conversationId,
      sessionToken: body.sessionToken,
      channel: (body.channel ?? "website") as CustomerAiChatInput["channel"],
      confirmedActions: body.confirmedActions,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Customer AI chat failed",
      },
      { status: error instanceof Error && error.message.includes("not enabled") ? 403 : 500 },
    );
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const businessId = url.searchParams.get("businessId") ?? "";
    const token = url.searchParams.get("token") ?? "";

    if (!token) {
      return NextResponse.json({ success: false, error: "Embed token is required" }, { status: 401 });
    }

    const payload = verifyEmbedToken(token);
    if (!payload || payload.widgetType !== "ai") {
      return NextResponse.json({ success: false, error: "Invalid embed token" }, { status: 401 });
    }

    if (businessId && businessId !== payload.businessId) {
      return NextResponse.json(
        { success: false, error: "Business ID does not match embed token" },
        { status: 403 },
      );
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

    const publicConfig = await getCustomerAiPublicConfig(payload.businessId);
    return NextResponse.json({ success: true, data: publicConfig });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to load config" },
      { status: 500 },
    );
  }
}
