import { clientEnvSchema, type ClientEnvSchema } from "@/schemas/env.schema";

export type ClientEnv = ClientEnvSchema;

function validateClientEnv(): ClientEnv {
  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  if (!parsed.success) {
    const formatted = parsed.error.flatten().fieldErrors;
    const message = Object.entries(formatted)
      .map(([key, errors]) => `${key}: ${errors?.join(", ")}`)
      .join("\n");

    throw new Error(`Invalid client environment variables:\n${message}`);
  }

  return parsed.data;
}

export const clientEnv = validateClientEnv();
