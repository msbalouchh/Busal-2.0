import type {
  FeatureConditionRule,
  FeatureEvaluationContext,
} from "@/modules/feature-flags/types/feature-flags-types";

function compareValues(actual: unknown, operator: string, expected: unknown): boolean {
  switch (operator) {
    case "eq":
      return actual === expected;
    case "neq":
      return actual !== expected;
    case "gt":
      return Number(actual) > Number(expected);
    case "gte":
      return Number(actual) >= Number(expected);
    case "lt":
      return Number(actual) < Number(expected);
    case "lte":
      return Number(actual) <= Number(expected);
    case "contains":
      return String(actual).includes(String(expected));
    case "in":
      return Array.isArray(expected) && expected.includes(actual);
    default:
      return false;
  }
}

function resolveConditionValue(
  rule: FeatureConditionRule,
  context: FeatureEvaluationContext,
): unknown {
  switch (rule.type) {
    case "USER_ATTRIBUTE":
      return context.userAttributes?.[rule.field];
    case "BUSINESS_ATTRIBUTE":
      return context.businessAttributes?.[rule.field];
    case "CUSTOM_METADATA":
      return context.customMetadata?.[rule.field];
    case "MODULE":
      return context.module;
    case "VERSION":
      return context.version;
    case "DATE":
      return new Date().toISOString().slice(0, 10);
    case "TIME":
      return new Date().toISOString().slice(11, 16);
    default:
      return context.customMetadata?.[rule.field];
  }
}

export function evaluateConditions(
  conditions: FeatureConditionRule[],
  context: FeatureEvaluationContext,
): boolean {
  if (conditions.length === 0) {
    return true;
  }

  return conditions.every((rule) => {
    const actual = resolveConditionValue(rule, context);
    return compareValues(actual, rule.operator, rule.value);
  });
}
