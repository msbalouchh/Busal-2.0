import "server-only";

import { ACCOUNT_TYPES } from "@/modules/staff-auth/constants/session";
import type { LoginSessionResult } from "@/modules/staff-auth/types/staff-session";
import { listBranches } from "@/services/business-management.service";
import { listBusinessesForOwner } from "@/services/business-profile.service";
import type { AuthUser } from "@/types/auth";

import {
  setActiveBranchCookie,
  setActiveBusinessCookie,
} from "@/modules/business-context/services/business-context-session.service";

export async function persistBusinessContextCookiesForLogin(
  user: AuthUser,
  loginResult: LoginSessionResult,
): Promise<void> {
  if (loginResult.accountType === ACCOUNT_TYPES.OWNER) {
    const businesses = await listBusinessesForOwner(user.id);
    const business =
      businesses.find((entry) => entry.onboardingCompleted && entry.id) ?? businesses[0];

    if (!business?.onboardingCompleted) {
      return;
    }

    await setActiveBusinessCookie({ userId: user.id, businessId: business.id });

    const branches = await listBranches(business.id);
    const branch = branches.find((entry) => entry.isMain) ?? branches[0];

    if (branch) {
      await setActiveBranchCookie({
        userId: user.id,
        businessId: business.id,
        branchId: branch.id,
      });
    }

    return;
  }

  if (!loginResult.staffSession) {
    return;
  }

  await setActiveBusinessCookie({
    userId: user.id,
    businessId: loginResult.staffSession.businessId,
  });

  const branches = await listBranches(loginResult.staffSession.businessId);
  const branch =
    (loginResult.staffSession.branchId
      ? branches.find((entry) => entry.id === loginResult.staffSession?.branchId)
      : null) ??
    branches.find((entry) => entry.isMain) ??
    branches[0];

  if (branch) {
    await setActiveBranchCookie({
      userId: user.id,
      businessId: loginResult.staffSession.businessId,
      branchId: branch.id,
    });
  }
}
