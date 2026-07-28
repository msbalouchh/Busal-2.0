import { NextResponse } from "next/server";

import { authError, authSuccess, handleAuthRouteError } from "@/modules/auth/lib/api-response";
import { forgotPasswordSchema } from "@/schemas/auth.schema";
import { requestPasswordReset } from "@/services/auth.service";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.errors[0]?.message ?? "Invalid request body";
      return authError(message, 422);
    }

    await requestPasswordReset(parsed.data.email);

    return authSuccess({
      message: "If an account exists for this email, a password reset link has been sent.",
    });
  } catch (error) {
    return handleAuthRouteError(error);
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
