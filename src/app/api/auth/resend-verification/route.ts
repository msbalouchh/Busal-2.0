import { NextResponse } from "next/server";
import { z } from "zod";

import { authError, authSuccess, handleAuthRouteError } from "@/modules/auth/lib/api-response";
import { resendVerificationEmail } from "@/services/auth.service";

const resendSchema = z.object({
  email: z.string().email("A valid email address is required."),
});

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = resendSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.errors[0]?.message ?? "Invalid request body";
      return authError(message, 422);
    }

    const result = await resendVerificationEmail(parsed.data.email);
    return authSuccess(result);
  } catch (error) {
    return handleAuthRouteError(error);
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
