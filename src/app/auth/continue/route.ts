import "server-only";

import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { resolvePostAuthRedirect } from "@/modules/auth/lib/post-auth-redirect";
import { getCurrentUser } from "@/services/auth.service";

/** Resolves workspace-aware destination for authenticated sessions. */
export async function GET(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(ROUTES.login);
  }

  const { searchParams } = new URL(request.url);
  const redirectTo = searchParams.get("redirectTo");
  const destination = await resolvePostAuthRedirect(user, redirectTo);

  redirect(destination);
}
