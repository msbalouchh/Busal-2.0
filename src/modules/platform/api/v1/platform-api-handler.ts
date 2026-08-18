import "server-only";

import { NextResponse } from "next/server";

import {
  authenticateApiRequest,
  handlePlatformApiAuthError,
  logPlatformApiRequest,
  requireApiScopes,
} from "@/modules/platform/services/platform-api-auth.service";
import {
  buildRateLimitHeaders,
  enforcePlatformApiRateLimit,
  PlatformApiRateLimitError,
} from "@/modules/platform/services/platform-api-rate-limit.service";
import type { ApiPlatformAuthContext } from "@/modules/platform/types/platform-config.types";

function jsonSuccess<T>(data: T, status = 200, headers?: Record<string, string>) {
  return NextResponse.json({ success: true, data }, { status, headers });
}

export { jsonSuccess };

export async function withPlatformApiAuth(
  request: Request,
  requiredScopes: string[],
  handler: (auth: ApiPlatformAuthContext) => Promise<NextResponse>,
): Promise<NextResponse> {
  const start = Date.now();
  const path = new URL(request.url).pathname;

  try {
    const auth = await authenticateApiRequest(request);
    requireApiScopes(auth, requiredScopes);

    const rateLimit = await enforcePlatformApiRateLimit(auth);
    const rateLimitHeaders = buildRateLimitHeaders(rateLimit);

    const response = await handler(auth);
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value);
    }

    await logPlatformApiRequest({
      businessId: auth.businessId,
      applicationId: auth.applicationId,
      keyId: auth.keyId,
      method: request.method,
      path,
      statusCode: response.status,
      responseTimeMs: Date.now() - start,
    });

    return response;
  } catch (error) {
    if (error instanceof PlatformApiRateLimitError) {
      const auth = await authenticateApiRequest(request).catch(() => null);
      if (auth) {
        await logPlatformApiRequest({
          businessId: auth.businessId,
          applicationId: auth.applicationId,
          keyId: auth.keyId,
          method: request.method,
          path,
          statusCode: 429,
          responseTimeMs: Date.now() - start,
          errorMessage: error.message,
        }).catch(() => undefined);
      }
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: "RATE_LIMIT_EXCEEDED",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(error.retryAfterMs / 1000)),
            "X-RateLimit-Limit": String(error.limit),
            "X-RateLimit-Remaining": "0",
          },
        },
      );
    }

    return handlePlatformApiAuthError(error);
  }
}
