import "server-only";

import type { User } from "@supabase/supabase-js";

import { USER_ROLES, type UserRole } from "@/constants/roles";
import { prisma } from "@/lib/prisma";
import {
  ensureStaffUserProfile,
  findActiveStaffByEmail,
} from "@/modules/staff-auth/services/staff-auth.service";
import { ensureUserAndBusiness } from "@/services/business-provisioning.service";
import type { AuthUser } from "@/types/auth";

interface CreateUserProfileInput {
  id: string;
  email: string;
  fullName: string;
  role?: UserRole;
}

export async function createUserProfile(input: CreateUserProfileInput) {
  return prisma.user.create({
    data: {
      id: input.id,
      email: input.email,
      fullName: input.fullName,
      role: input.role ?? USER_ROLES.OWNER,
    },
  });
}

export async function syncUserProfile(user: User, fallbackFullName?: string) {
  try {
    const metadataRole = user.user_metadata?.role;
    if (metadataRole === USER_ROLES.CUSTOMER) {
      const email = user.email ?? "";
      const existing = await getUserProfile(user.id);
      if (existing) {
        return existing;
      }

      const fullName =
        fallbackFullName ??
        (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "") ??
        email;

      return createUserProfile({
        id: user.id,
        email,
        fullName,
        role: USER_ROLES.CUSTOMER,
      });
    }

    const email = user.email ?? "";
    const staff = email ? await findActiveStaffByEmail(email) : null;

    if (staff && staff.business.ownerId !== user.id) {
      const profile = await ensureStaffUserProfile(user, staff.id, fallbackFullName);
      return profile;
    }

    const { user: profile } = await ensureUserAndBusiness(user, fallbackFullName);
    return profile;
  } catch (error) {
    console.error("[syncUserProfile] Failed to provision user and business:", error);
    throw new Error("Unable to set up your account. Please try again.");
  }
}

export async function getUserProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
  });
}

export function mapProfileToAuthUser(
  userId: string,
  email: string,
  profile: { fullName: string; role: string } | null,
  metadata: Record<string, unknown>,
): AuthUser {
  const role =
    (profile?.role as UserRole | undefined) ??
    (metadata.role as UserRole | undefined) ??
    USER_ROLES.OWNER;

  const fullName =
    profile?.fullName ?? (typeof metadata.full_name === "string" ? metadata.full_name : "") ?? "";

  const tenantId = (metadata.tenant_id as string | undefined) ?? null;

  return {
    id: userId,
    email,
    fullName,
    role,
    tenantId,
  };
}
