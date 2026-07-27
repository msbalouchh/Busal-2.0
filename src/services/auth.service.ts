import "server-only";

import { USER_ROLES, type UserRole } from "@/constants/roles";
import { createClient } from "@/lib/supabase/server";
import type { AuthUser, Session } from "@/types/auth";

function mapUserMetadata(
  userId: string,
  email: string,
  metadata: Record<string, unknown>,
): AuthUser {
  const role = (metadata.role as UserRole | undefined) ?? USER_ROLES.STAFF;
  const tenantId = (metadata.tenant_id as string | undefined) ?? null;

  return {
    id: userId,
    email,
    role,
    tenantId,
  };
}

export async function getSession(): Promise<Session | null> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user.email) {
    return null;
  }

  return {
    user: mapUserMetadata(session.user.id, session.user.email, session.user.user_metadata),
    accessToken: session.access_token,
  };
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await getSession();
  return session?.user ?? null;
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  return session;
}
