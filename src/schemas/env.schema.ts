import { z } from "zod";

import { normalizeEnvUrl, resolvePublicAppUrl } from "@/config/app-url";

function emptyToUndefined(value: unknown): unknown {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  return value;
}

const requiredUrl = z.preprocess(emptyToUndefined, z.string().url());

export const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.preprocess(
    (value) =>
      normalizeEnvUrl(typeof value === "string" ? value : undefined) ?? resolvePublicAppUrl(),
    z.string().url(),
  ),
  NEXT_PUBLIC_SUPABASE_URL: requiredUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.preprocess(emptyToUndefined, z.string().min(1)),
});

export type ClientEnvSchema = z.infer<typeof clientEnvSchema>;
