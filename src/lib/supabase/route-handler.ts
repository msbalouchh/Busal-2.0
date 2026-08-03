import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

import { getServerEnv } from "@/config/env.server";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

/** Supabase client for Route Handlers — mirrors auth cookies onto JSON responses. */
export async function createRouteHandlerClient() {
  const cookieStore = await cookies();
  const serverEnv = getServerEnv();
  const pendingCookies: CookieToSet[] = [];

  const supabase = createServerClient(
    serverEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          pendingCookies.push(...cookiesToSet);

          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Route handlers normally allow cookie writes; pendingCookies still apply.
          }
        },
      },
    },
  );

  function applyCookiesToResponse<T extends NextResponse>(response: T): T {
    for (const { name, value, options } of pendingCookies) {
      response.cookies.set(name, value, options);
    }

    return response;
  }

  return { supabase, applyCookiesToResponse };
}
