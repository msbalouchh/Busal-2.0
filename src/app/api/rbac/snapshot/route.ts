import "server-only";

import { NextResponse } from "next/server";

import { getCurrentUser } from "@/services/auth.service";
import { resolveActiveBusinessForUser } from "@/modules/business-context/services/business-resolver.service";
import { buildRbacFoundationSnapshot } from "@/modules/rbac/services/rbac-foundation.service";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const business = await resolveActiveBusinessForUser(user);
  const snapshot = await buildRbacFoundationSnapshot({
    userId: user.id,
    businessId: business.id,
  });

  return NextResponse.json(snapshot);
}
