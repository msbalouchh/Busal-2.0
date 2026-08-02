import "server-only";

import type { AuthError, Session as SupabaseSession, User } from "@supabase/supabase-js";
import { cache } from "react";

import { USER_ROLES } from "@/constants/roles";
import { SUPABASE_AUTH_CONFIG } from "@/lib/supabase/auth-config";
import { createClient } from "@/lib/supabase/server";
import { getAuthErrorMessage } from "@/modules/auth/lib/auth-errors";
import { getAuthCallbackUrl, getPasswordResetRedirectUrl } from "@/modules/auth/lib/auth.utils";
import { getUserProfile, mapProfileToAuthUser, syncUserProfile } from "@/services/user.service";
import type { AuthUser, Session } from "@/types/auth";
import type { UserRole } from "@/constants/roles";

type AuthErrorCode = "UNAUTHORIZED" | "BAD_REQUEST";

export class AuthServiceError extends Error {
  readonly code: AuthErrorCode;

  constructor(message: string, code: AuthErrorCode = "BAD_REQUEST") {
    super(message);
    this.name = "AuthServiceError";
    this.code = code;
  }
}

function throwAuthError(error: AuthError): never {
  throw new AuthServiceError(getAuthErrorMessage(error));
}

async function getSupabaseClient() {
  return createClient();
}

async function mapSupabaseUserToSession(user: User, accessToken: string): Promise<Session> {
  const profile = await getUserProfile(user.id);

  return {
    user: mapProfileToAuthUser(user.id, user.email ?? "", profile, user.user_metadata),
    accessToken,
  };
}

export const getSession = cache(async (): Promise<Session | null> => {
  const supabase = await getSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email) {
    return null;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return null;
  }

  return mapSupabaseUserToSession(user, session.access_token);
});

export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  const session = await getSession();
  return session?.user ?? null;
});

export async function requireSession(): Promise<Session> {
  const session = await getSession();

  if (!session) {
    throw new AuthServiceError("Unauthorized", "UNAUTHORIZED");
  }

  return session;
}

export async function signInWithEmail(email: string, password: string): Promise<Session> {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    throwAuthError(error);
  }

  if (!data.user || !data.session) {
    throw new AuthServiceError("Unable to establish a session.");
  }

  await syncUserProfile(data.user);

  return mapSupabaseUserToSession(data.user, data.session.access_token);
}

export async function signUpWithEmail(
  fullName: string,
  email: string,
  password: string,
  options?: { role?: UserRole },
): Promise<{ session: Session | null; requiresEmailConfirmation: boolean }> {
  const role = options?.role ?? USER_ROLES.OWNER;
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role,
      },
      emailRedirectTo: getAuthCallbackUrl(),
    },
  });

  if (error) {
    throwAuthError(error);
  }

  if (!data.user) {
    throw new AuthServiceError("Unable to create account.");
  }

  if (data.session) {
    await syncUserProfile(data.user, fullName);

    return {
      session: await mapSupabaseUserToSession(data.user, data.session.access_token),
      requiresEmailConfirmation: false,
    };
  }

  return {
    session: null,
    requiresEmailConfirmation: true,
  };
}

export async function signOut(): Promise<void> {
  const supabase = await getSupabaseClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throwAuthError(error);
  }
}

export async function requestPasswordReset(email: string): Promise<void> {
  const supabase = await getSupabaseClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getPasswordResetRedirectUrl(),
  });

  if (error) {
    throwAuthError(error);
  }
}

export async function updatePassword(password: string): Promise<Session> {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase.auth.updateUser({ password });

  if (error) {
    throwAuthError(error);
  }

  if (!data.user) {
    throw new AuthServiceError("Unable to update password.");
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new AuthServiceError("Unable to establish a session after password update.");
  }

  return mapSupabaseUserToSession(data.user, session.access_token);
}

export async function getGoogleOAuthUrl(): Promise<string> {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: SUPABASE_AUTH_CONFIG.oauth.google.provider,
    options: {
      redirectTo: getAuthCallbackUrl(),
      queryParams: SUPABASE_AUTH_CONFIG.oauth.google.queryParams,
    },
  });

  if (error) {
    throwAuthError(error);
  }

  if (!data.url) {
    throw new AuthServiceError("Unable to start Google sign-in.");
  }

  return data.url;
}

export async function exchangeCodeForSession(code: string): Promise<SupabaseSession> {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    throwAuthError(error);
  }

  if (!data.session?.user) {
    throw new AuthServiceError("Unable to establish a session.");
  }

  await syncUserProfile(data.session.user);

  return data.session;
}

export async function refreshSession(): Promise<Session | null> {
  const supabase = await getSupabaseClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.refreshSession();

  if (error || !session?.user?.email) {
    return null;
  }

  return mapSupabaseUserToSession(session.user, session.access_token);
}
