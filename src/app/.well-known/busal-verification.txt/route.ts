import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { serveDomainVerificationFile } from "@/modules/platform/services/platform-domain-verification.service";

export async function GET() {
  const headerStore = await headers();
  const host =
    headerStore.get("x-busal-host") ??
    headerStore.get("x-forwarded-host") ??
    headerStore.get("host") ??
    "";

  if (!host) {
    return new NextResponse("Not found", { status: 404 });
  }

  const token = await serveDomainVerificationFile(host);

  if (!token) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(token, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
