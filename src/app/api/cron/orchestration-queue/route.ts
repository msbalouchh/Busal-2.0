import { NextResponse } from "next/server";

import { isCronAuthorizedWithoutSecret } from "@/lib/production-mode";
import { runOrchestrationWorker } from "@/modules/platform-orchestration/workers/orchestration-worker";

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
  const limit = Number(url.searchParams.get("limit") ?? 25);

  const result = await runOrchestrationWorker(limit);
  return NextResponse.json({ success: true, data: result });
}

export async function POST(request: Request) {
  return GET(request);
}
