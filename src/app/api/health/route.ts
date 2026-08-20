import { NextResponse } from "next/server";

import { getDatabaseEnvStatus, isDatabaseConfigured } from "@/config/database-env";
import { resolvePublicAppUrl } from "@/config/app-url";
import { prisma } from "@/lib/prisma";
import { getSupabaseEnv } from "@/lib/supabase/env";

type CheckStatus = "ok" | "missing" | "error";

function getSupabaseConfigStatus(): CheckStatus {
  try {
    getSupabaseEnv();
    return "ok";
  } catch {
    return "missing";
  }
}

function sanitizeDatabaseError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Database connectivity check failed.";
  }

  const message = error.message;

  if (message.includes("DATABASE_URL") || message.includes("empty string")) {
    return "DATABASE_URL is not configured.";
  }

  if (message.includes("Can't reach database server") || message.includes("P1001")) {
    return "Database server is unreachable.";
  }

  if (message.includes("P1017")) {
    return "Database connection closed unexpectedly.";
  }

  return "Database connectivity check failed.";
}

export async function GET() {
  const startedAt = Date.now();
  const databaseEnv = getDatabaseEnvStatus();
  const supabase = getSupabaseConfigStatus();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() ? "configured" : "missing";

  let databaseConnectivity: CheckStatus = "missing";
  let databaseError: string | undefined;

  if (!isDatabaseConfigured()) {
    databaseConnectivity = "missing";
    databaseError = "DATABASE_URL is not configured.";
  } else {
    try {
      await prisma.$queryRaw`SELECT 1`;
      databaseConnectivity = "ok";
    } catch (error) {
      databaseConnectivity = "error";
      databaseError = sanitizeDatabaseError(error);
    }
  }

  const checks = {
    supabase,
    appUrl,
    databaseUrl: databaseEnv.databaseUrl,
    directUrl: databaseEnv.directUrl,
    database: databaseConnectivity,
    canonicalAppOrigin: resolvePublicAppUrl(),
    latencyMs: Date.now() - startedAt,
  };

  const isHealthy =
    checks.supabase === "ok" && checks.databaseUrl === "configured" && checks.database === "ok";

  if (isHealthy) {
    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "busal-os",
      checks,
    });
  }

  const degradedReason =
    checks.supabase === "missing"
      ? "Supabase environment variables are not configured."
      : checks.databaseUrl === "missing"
        ? "DATABASE_URL is not configured."
        : (databaseError ?? "One or more production dependencies are not ready.");

  return NextResponse.json(
    {
      status: "degraded",
      timestamp: new Date().toISOString(),
      service: "busal-os",
      checks,
      error: degradedReason,
    },
    { status: 503 },
  );
}
