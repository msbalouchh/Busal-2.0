import { NextResponse } from "next/server";
import { z } from "zod";

import { verifyCustomerIdentity } from "@/modules/customer-ai/services/customer-identity.service";
import { aiRateLimiter } from "@/modules/ai-engine/performance/rate-limiter";
import { verifyEmbedToken } from "@/modules/platform/services/platform-embed.service";

const verifySchema = z.object({
  token: z.string().min(1),
  sessionToken: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().min(3).optional(),
  orderReference: z.string().min(1).optional(),
});

export async function POST(request: Request) {
  try {
    const body = verifySchema.parse(await request.json());
    const payload = verifyEmbedToken(body.token);

    if (!payload || payload.widgetType !== "ai") {
      return NextResponse.json({ success: false, error: "Invalid embed token" }, { status: 401 });
    }

    aiRateLimiter.assertAllowed(`customer-ai-verify:${payload.businessId}`);

    if (!body.email && !body.phone && !body.orderReference) {
      return NextResponse.json(
        { success: false, error: "Email, phone, or order reference required" },
        { status: 400 },
      );
    }

    const result = await verifyCustomerIdentity({
      businessId: payload.businessId,
      sessionToken: body.sessionToken,
      email: body.email,
      phone: body.phone,
      orderReference: body.orderReference,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Verification failed",
      },
      { status: error instanceof z.ZodError ? 400 : 500 },
    );
  }
}
