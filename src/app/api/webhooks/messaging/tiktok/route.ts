import "server-only";

import { NextResponse } from "next/server";

import { handleTikTokWebhook } from "@/modules/customer-ai/omnichannel/services/webhook-handler.service";
import { aiRateLimiter } from "@/modules/ai-engine/performance/rate-limiter";

export async function POST(request: Request) {
  try {
    aiRateLimiter.assertAllowed("webhook:messaging:tiktok");
    const rawBody = await request.text();
    const payload = rawBody ? (JSON.parse(rawBody) as Record<string, unknown>) : {};

    const result = await handleTikTokWebhook({
      rawBody,
      payload,
      signatureHeader: request.headers.get("x-tiktok-signature"),
    });

    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook processing failed" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", channel: "tiktok" });
}
