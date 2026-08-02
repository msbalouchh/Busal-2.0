import { cookies } from "next/headers";

import { QR_SESSION_COOKIE } from "@/modules/qr-ordering-management/constants/routes";

const SESSION_MAX_AGE_SECONDS = 4 * 60 * 60;

export async function readQrSessionCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(QR_SESSION_COOKIE)?.value ?? null;
}

export async function writeQrSessionCookie(sessionToken: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(QR_SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearQrSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(QR_SESSION_COOKIE);
}
