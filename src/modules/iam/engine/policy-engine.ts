import type { AccessPolicyRules } from "@/modules/iam/types/iam-types";

export function evaluateAccessPolicy(
  rules: AccessPolicyRules,
  context: {
    ipAddress?: string | null;
    country?: string | null;
    hasMfa?: boolean;
    loginHour?: number;
  },
): { allowed: boolean; violations: string[] } {
  const violations: string[] = [];

  if (rules.requireMfa && !context.hasMfa) {
    violations.push("MFA required");
  }

  if (
    rules.allowedCountries &&
    rules.allowedCountries.length > 0 &&
    context.country &&
    !rules.allowedCountries.includes(context.country)
  ) {
    violations.push(`Country not allowed: ${context.country}`);
  }

  if (rules.deniedIpAddresses?.includes(context.ipAddress ?? "")) {
    violations.push("IP address denied");
  }

  if (
    rules.allowedIpAddresses &&
    rules.allowedIpAddresses.length > 0 &&
    context.ipAddress &&
    !rules.allowedIpAddresses.includes(context.ipAddress)
  ) {
    violations.push("IP address not in allow list");
  }

  if (typeof context.loginHour === "number" && rules.loginHoursStart && rules.loginHoursEnd) {
    const start = Number.parseInt(rules.loginHoursStart.split(":")[0] ?? "0", 10);
    const end = Number.parseInt(rules.loginHoursEnd.split(":")[0] ?? "23", 10);

    if (context.loginHour < start || context.loginHour > end) {
      violations.push("Login outside allowed hours");
    }
  }

  return {
    allowed: violations.length === 0,
    violations,
  };
}

export function mergePolicyRules(policies: AccessPolicyRules[]): AccessPolicyRules {
  return policies.reduce<AccessPolicyRules>((merged, policy) => {
    return {
      passwordMinLength: Math.max(merged.passwordMinLength ?? 8, policy.passwordMinLength ?? 8),
      requireMfa: merged.requireMfa === true || policy.requireMfa === true,
      sessionTimeoutMinutes: Math.min(
        merged.sessionTimeoutMinutes ?? 480,
        policy.sessionTimeoutMinutes ?? 480,
      ),
      allowedCountries:
        policy.allowedCountries && policy.allowedCountries.length > 0
          ? policy.allowedCountries
          : merged.allowedCountries,
      deniedIpAddresses: [...(merged.deniedIpAddresses ?? []), ...(policy.deniedIpAddresses ?? [])],
      allowedIpAddresses:
        policy.allowedIpAddresses && policy.allowedIpAddresses.length > 0
          ? policy.allowedIpAddresses
          : merged.allowedIpAddresses,
      loginHoursStart: policy.loginHoursStart ?? merged.loginHoursStart,
      loginHoursEnd: policy.loginHoursEnd ?? merged.loginHoursEnd,
      requireDeviceTrust: merged.requireDeviceTrust === true || policy.requireDeviceTrust === true,
    };
  }, {});
}
