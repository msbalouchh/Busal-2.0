import "server-only";

import { BusinessType, type Business, type User } from "@prisma/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

import { USER_ROLES, type UserRole } from "@/constants/roles";
import { prisma } from "@/lib/prisma";

export const DEFAULT_BUSINESS_VALUES = {
  businessName: "",
  businessType: BusinessType.OTHER,
  country: "",
  timezone: "",
  aiName: "Busal AI",
  aiPersonality: "Professional",
  businessGoal: "",
  businessDna: {},
  onboardingCompleted: false,
  onboardingStep: 1,
} as const;

interface ProvisionedUserAndBusiness {
  user: User;
  business: Business;
  created: {
    user: boolean;
    business: boolean;
  };
}

function resolveFullName(user: SupabaseUser, fallbackFullName?: string): string {
  const metadataName = user.user_metadata?.full_name;

  if (typeof metadataName === "string" && metadataName.trim().length > 0) {
    return metadataName.trim();
  }

  if (fallbackFullName && fallbackFullName.trim().length > 0) {
    return fallbackFullName.trim();
  }

  if (user.email) {
    return user.email.split("@")[0] ?? "User";
  }

  return "User";
}

function resolveRole(user: SupabaseUser, fallbackRole?: UserRole): UserRole {
  const metadataRole = user.user_metadata?.role;

  if (typeof metadataRole === "string" && metadataRole in USER_ROLES) {
    return metadataRole as UserRole;
  }

  return fallbackRole ?? USER_ROLES.OWNER;
}

export async function ensureUserAndBusiness(
  supabaseUser: SupabaseUser,
  fallbackFullName?: string,
): Promise<ProvisionedUserAndBusiness> {
  const fullName = resolveFullName(supabaseUser, fallbackFullName);
  const role = resolveRole(supabaseUser);
  const email = supabaseUser.email ?? "";

  return prisma
    .$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { id: supabaseUser.id },
      });

      if (!existingUser) {
        const user = await tx.user.create({
          data: {
            id: supabaseUser.id,
            email,
            fullName,
            role,
          },
        });

        const business = await tx.business.create({
          data: {
            ownerId: user.id,
            ...DEFAULT_BUSINESS_VALUES,
          },
        });

        await tx.businessMember.create({
          data: {
            businessId: business.id,
            userId: user.id,
            role: "OWNER",
            status: "ACTIVE",
          },
        });

        return {
          user,
          business,
          created: { user: true, business: true },
        };
      }

      const user = await tx.user.update({
        where: { id: supabaseUser.id },
        data: {
          email,
          fullName,
        },
      });

      const existingBusiness = await tx.business.findFirst({
        where: { ownerId: supabaseUser.id },
        orderBy: { createdAt: "asc" },
      });

      if (existingBusiness) {
        return {
          user,
          business: existingBusiness,
          created: { user: false, business: false },
        };
      }

      const business = await tx.business.create({
        data: {
          ownerId: user.id,
          ...DEFAULT_BUSINESS_VALUES,
        },
      });

      await tx.businessMember.create({
        data: {
          businessId: business.id,
          userId: user.id,
          role: "OWNER",
          status: "ACTIVE",
        },
      });

      return {
        user,
        business,
        created: { user: false, business: true },
      };
    })
    .then(async (result) => {
      if (result.created.business) {
        const { tenantFoundationService } = await import(
          "@/modules/tenant/services/tenant-foundation.service"
        );
        const { prisma: db } = await import("@/lib/prisma");

        const branchCount = await db.branch.count({ where: { businessId: result.business.id } });
        if (branchCount === 0) {
          await tenantFoundationService.createBusinessBranch({
            businessId: result.business.id,
            name: "Main Branch",
            isMain: true,
          });
        }

        await tenantFoundationService.provisionCommercialStack(result.business.id, "starter");
      }

      return result;
    });
}
