import { NextResponse } from "next/server";

import { authError, authSuccess } from "@/modules/auth/lib/api-response";
import { signupSchema } from "@/schemas/auth.schema";
import { AuthServiceError, signUpWithEmail } from "@/services/auth.service";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.errors[0]?.message ?? "Invalid request body";
      return authError(message, 422);
    }

    const { fullName, email, password } = parsed.data;
    const result = await signUpWithEmail(fullName, email, password);

    return authSuccess(
      {
        user: result.session?.user ?? null,
        requiresEmailConfirmation: result.requiresEmailConfirmation,
      },
      result.session ? 201 : 202,
    );
  } catch (error) {
    if (error instanceof AuthServiceError) {
      if (error.code === "UNAUTHORIZED") {
        return authError(error.message, 401);
      }

      console.error("[signup] returning 400 — AuthServiceError:", {
        message: error.message,
        code: error.code,
        error,
      });
      return authError(error.message, 400);
    }

    console.error("[signup] returning 500 — unexpected error:", error);
    return authError("An unexpected error occurred.", 500);
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
