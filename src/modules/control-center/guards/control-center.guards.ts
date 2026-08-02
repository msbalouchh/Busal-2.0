import "server-only";

import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";

import { ROUTES } from "@/constants/routes";
import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { CONTROL_CENTER_ROUTES } from "@/modules/control-center/constants/routes";
import {
  buildControlCenterOperatorContext,
  controlCenterOperatorHasPermission,
} from "@/modules/control-center/lib/resolve-control-center-authorization";
import type { ControlCenterOperatorContext } from "@/modules/control-center/types/control-center-types";
import { getCurrentUser } from "@/services/auth.service";

export class ControlCenterGuardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ControlCenterGuardError";
  }
}

export interface ControlCenterPageGuardOptions {
  permission?: string;
}

export async function requireControlCenterSession(): Promise<ControlCenterOperatorContext> {
  const user = await getCurrentUser();

  if (!user?.email) {
    redirect(`${ROUTES.login}?redirectTo=${encodeURIComponent(CONTROL_CENTER_ROUTES.overview)}`);
  }

  const context = buildControlCenterOperatorContext(user);

  if (!context.isOperator) {
    redirect(CONTROL_CENTER_ROUTES.unauthorized);
  }

  return context;
}

export async function protectedControlCenterPage(
  options: ControlCenterPageGuardOptions = {},
): Promise<ControlCenterOperatorContext> {
  try {
    const context = await requireControlCenterSession();

    if (
      options.permission &&
      !controlCenterOperatorHasPermission(context, options.permission) &&
      !controlCenterOperatorHasPermission(context, PERMISSION_CODES.CONTROL_CENTER_ADMIN)
    ) {
      redirect(CONTROL_CENTER_ROUTES.unauthorized);
    }

    return context;
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    throw error;
  }
}

export interface ControlCenterActionContext {
  operator: ControlCenterOperatorContext;
}

export async function protectedControlCenterAction<T>(
  permission: string,
  handler: (context: ControlCenterActionContext) => Promise<T>,
): Promise<T> {
  const operator = await requireControlCenterSession();

  if (
    !controlCenterOperatorHasPermission(operator, permission) &&
    !controlCenterOperatorHasPermission(operator, PERMISSION_CODES.CONTROL_CENTER_ADMIN)
  ) {
    throw new ControlCenterGuardError("Permission denied");
  }

  return handler({ operator });
}
