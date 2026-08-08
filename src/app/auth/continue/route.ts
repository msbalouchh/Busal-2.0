import "server-only";

import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { persistBusinessContextCookiesForLogin } from "@/modules/business-context/services/business-context-cookie-writer.service";
import { resolvePostAuthRedirect } from "@/modules/auth/lib/post-auth-redirect";
import { ACCOUNT_TYPES } from "@/modules/staff-auth/constants/session";
import { completeLoginSession } from "@/modules/staff-auth/services/staff-auth.service";
import { getCurrentUser } from "@/services/auth.service";

/** Resolves workspace-aware destination for authenticated sessions. */
export async function GET(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(ROUTES.login);
  }

  const { searchParams } = new URL(request.url);
  const redirectTo = searchParams.get("redirectTo");

  const loginResult = await completeLoginSession(user.id, user.email);
  if (loginResult.accountType === ACCOUNT_TYPES.OWNER || loginResult.staffSession) {
    await persistBusinessContextCookiesForLogin(user, loginResult);
  }

  const destination = await resolvePostAuthRedirect(user, redirectTo);

  redirect(destination);
}
