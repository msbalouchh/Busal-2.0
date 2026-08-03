import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { resolvePostAuthRedirect } from "@/modules/auth/lib/post-auth-redirect";
import { getCurrentUser } from "@/services/auth.service";

/** Resolves /app to the correct workspace destination — never a dead landing page. */
export default async function ApplicationRootPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`${ROUTES.login}?redirectTo=${ROUTES.application}`);
  }

  redirect(await resolvePostAuthRedirect(user, null));
}
