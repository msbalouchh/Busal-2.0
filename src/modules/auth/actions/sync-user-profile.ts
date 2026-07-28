"use server";

import { createClient } from "@/lib/supabase/server";
import { syncUserProfile } from "@/services/user.service";

export async function syncUserProfileAction(fallbackFullName?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false as const, error: "Not authenticated" };
  }

  try {
    const profile = await syncUserProfile(user, fallbackFullName);
    return { success: true as const, profile };
  } catch {
    return { success: false as const, error: "Failed to sync user profile" };
  }
}
