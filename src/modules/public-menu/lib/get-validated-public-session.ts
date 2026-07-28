import { cookies } from "next/headers";

import { PUBLIC_MENU_SESSION_COOKIE } from "@/modules/public-menu/constants/session";
import { getPublicMenuSessionByToken, resolvePublicQRMenu } from "@/services/qr-menu.service";

export async function getValidatedPublicSession(slug: string) {
  const resolved = await resolvePublicQRMenu(slug);

  if (!resolved.ok) {
    throw new Error("Invalid menu session");
  }

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(PUBLIC_MENU_SESSION_COOKIE)?.value;

  if (!sessionToken) {
    throw new Error("Session not found");
  }

  const session = await getPublicMenuSessionByToken(sessionToken, resolved.data.qrCode.id);

  if (!session) {
    throw new Error("Session not found");
  }

  return {
    businessId: resolved.data.business.id,
    qrMenuSessionId: session.id,
    tableId: session.tableId,
  };
}
