import "server-only";

import { NextResponse } from "next/server";

import { CUSTOMER_AI_CHANNELS } from "@/modules/customer-ai/constants/customer-ai.constants";
import {
  handleMetaChannelWebhook,
  handleMetaWebhookVerification,
  metaWebhookGetResponse,
} from "@/modules/customer-ai/omnichannel/services/webhook-handler.service";
import { aiRateLimiter } from "@/modules/ai-engine/performance/rate-limiter";

async function readJsonBody(request: Request): Promise<{ rawBody: string; payload: Record<string, unknown> }> {
  const rawBody = await request.text();
  const payload = rawBody ? (JSON.parse(rawBody) as Record<string, unknown>) : {};
  return { rawBody, payload };
}

function webhookVerificationError(
  result: { type: "challenge"; response: string } | { type: "accepted"; connectionId: string } | { type: "rejected"; reason: string },
): string {
  return result.type === "rejected" ? result.reason : "Invalid verification request";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = metaWebhookGetResponse(url.searchParams);
  if (parsed.type !== "challenge") {
    return NextResponse.json({ error: webhookVerificationError(parsed) }, { status: 403 });
  }

  const verified = await handleMetaWebhookVerification(
    url.searchParams.get("hub.verify_token"),
    parsed.response,
  );

  if (verified.type === "challenge") {
    return new NextResponse(parsed.response, { status: 200 });
  }

  return NextResponse.json({ error: webhookVerificationError(verified) }, { status: 403 });
}

export async function POST(request: Request) {
  try {
    aiRateLimiter.assertAllowed("webhook:messaging:whatsapp");
    const { rawBody, payload } = await readJsonBody(request);
    const signatureHeader = request.headers.get("x-hub-signature-256");

    const result = await handleMetaChannelWebhook({
      channel: CUSTOMER_AI_CHANNELS.WHATSAPP,
      rawBody,
      payload,
      signatureHeader,
    });

    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook processing failed" },
      { status: 500 },
    );
  }
}
