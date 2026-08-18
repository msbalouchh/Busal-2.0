import { NextResponse } from "next/server";

import { isCronAuthorizedWithoutSecret } from "@/lib/production-mode";
import { processWebhookRetries } from "@/modules/platform/services/platform-webhook-delivery.service";

function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return isCronAuthorizedWithoutSecret();
  }

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? 50);
  const result = await processWebhookRetries(limit);
  return NextResponse.json({ success: true, data: result });
}

export async function POST(request: Request) {
  return GET(request);
}
