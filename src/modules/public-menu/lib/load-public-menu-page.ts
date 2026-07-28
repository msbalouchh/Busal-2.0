import { randomBytes } from "crypto";
import { cache } from "react";
import { cookies, headers } from "next/headers";

import { PUBLIC_MENU_SESSION_COOKIE } from "@/modules/public-menu/constants/session";
import { buildPublicMenuViewModel } from "@/modules/public-menu/lib/public-menu-utils";
import {
  createEmptyClientCart,
  serializeCart,
  type ClientCart,
} from "@/modules/public-menu/lib/cart-utils";
import { getActiveCart } from "@/services/cart.service";
import { listActiveCategories, listPublicMenuItems } from "@/services/menu-management.service";
import {
  getPublicMenuSessionByToken,
  recordPublicMenuVisit,
  resolvePublicQRMenu,
  type PublicQRMenuContext,
  type PublicQRMenuErrorReason,
  type ResolvePublicQRMenuResult,
} from "@/services/qr-menu.service";

export type PublicMenuPageResult =
  | {
      ok: true;
      context: PublicQRMenuContext;
      menu: ReturnType<typeof buildPublicMenuViewModel>;
      sessionId: string | null;
      initialCart: ClientCart;
    }
  | { ok: false; reason: PublicQRMenuErrorReason };

function createSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export const loadPublicMenuPage = cache(async (slug: string): Promise<PublicMenuPageResult> => {
  const resolved: ResolvePublicQRMenuResult = await resolvePublicQRMenu(slug);

  if (!resolved.ok) {
    return resolved;
  }

  const cookieStore = await cookies();
  const existingToken = cookieStore.get(PUBLIC_MENU_SESSION_COOKIE)?.value;
  let sessionId: string | null = null;

  if (existingToken) {
    const existingSession = await getPublicMenuSessionByToken(
      existingToken,
      resolved.data.qrCode.id,
    );
    sessionId = existingSession?.id ?? null;
  }

  if (!sessionId) {
    const requestHeaders = await headers();
    const sessionToken = createSessionToken();

    const visit = await recordPublicMenuVisit(resolved.data.ownerId, resolved.data.qrCode.id, {
      sessionToken,
      tableId: resolved.data.qrCode.tableId,
      deviceInfo: requestHeaders.get("user-agent") ?? undefined,
      ipAddress: requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined,
    });

    sessionId = visit.session.id;
    cookieStore.set(PUBLIC_MENU_SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });
  }

  const [categories, menuItems, activeCart] = await Promise.all([
    listActiveCategories(resolved.data.business.id),
    listPublicMenuItems(resolved.data.business.id),
    sessionId ? getActiveCart(sessionId) : Promise.resolve(null),
  ]);

  return {
    ok: true,
    context: resolved.data,
    menu: buildPublicMenuViewModel(resolved.data.business, categories, menuItems),
    sessionId,
    initialCart: activeCart ? serializeCart(activeCart) : createEmptyClientCart(),
  };
});
