import { createBrowserClient } from "@supabase/ssr";

import { getClientEnv } from "@/config/env.client";

export function createClient() {
  const clientEnv = getClientEnv();

  return createBrowserClient(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
