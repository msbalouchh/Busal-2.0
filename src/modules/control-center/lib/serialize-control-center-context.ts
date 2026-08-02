import "server-only";

import type {
  ClientControlCenterContext,
  ControlCenterOperatorContext,
} from "@/modules/control-center/types/control-center-types";

export function serializeClientControlCenterContext(
  operator: ControlCenterOperatorContext,
  featureFlags: Record<string, boolean>,
  openAlerts = 0,
): ClientControlCenterContext {
  return {
    permissions: operator.permissions,
    featureFlags,
    environment: operator.environment,
    operatorEmail: operator.email,
    openAlerts,
  };
}
