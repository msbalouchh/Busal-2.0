import { NextResponse } from "next/server";

import { authError, authSuccess, handleAuthRouteError } from "@/modules/auth/lib/api-response";
import { resetPasswordSchema } from "@/schemas/auth.schema";
import { requireSession, updatePassword } from "@/services/auth.service";

export async function POST(request: Request) {
  try {
    await requireSession();

    const body: unknown = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.errors[0]?.message ?? "Invalid request body";
      return authError(message, 422);
    }

    const session = await updatePassword(parsed.data.password);

    return authSuccess({ user: session.user });
  } catch (error) {
    return handleAuthRouteError(error);
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
