import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  const startedAt = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "busal-os",
      checks: {
        database: "ok",
        latencyMs: Date.now() - startedAt,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Database check failed";
    return NextResponse.json(
      {
        status: "degraded",
        timestamp: new Date().toISOString(),
        service: "busal-os",
        checks: {
          database: "error",
          error: message,
          latencyMs: Date.now() - startedAt,
        },
      },
      { status: 503 },
    );
  }
}
