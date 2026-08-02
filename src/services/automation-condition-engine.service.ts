import "server-only";

export type ConditionOperator = "equals" | "not_equals" | "contains" | "gt" | "lt" | "exists";

export function evaluateConditions(
  conditions: Array<{ operator: string; field: string; value: string }>,
  payload: Record<string, unknown>,
): { passed: boolean; results: Array<{ field: string; passed: boolean }> } {
  if (conditions.length === 0) {
    return { passed: true, results: [] };
  }

  const results = conditions.map((condition) => {
    const actual = getNestedValue(payload, condition.field);
    const passed = evaluateSingleCondition(condition.operator, actual, condition.value);
    return { field: condition.field, passed };
  });

  return {
    passed: results.every((result) => result.passed),
    results,
  };
}

function getNestedValue(payload: Record<string, unknown>, field: string): unknown {
  return field.split(".").reduce<unknown>((current, key) => {
    if (current && typeof current === "object" && key in (current as Record<string, unknown>)) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, payload);
}

function evaluateSingleCondition(operator: string, actual: unknown, expected: string): boolean {
  switch (operator as ConditionOperator) {
    case "equals":
      return String(actual ?? "") === expected;
    case "not_equals":
      return String(actual ?? "") !== expected;
    case "contains":
      return String(actual ?? "")
        .toLowerCase()
        .includes(expected.toLowerCase());
    case "gt":
      return Number(actual) > Number(expected);
    case "lt":
      return Number(actual) < Number(expected);
    case "exists":
      return actual !== undefined && actual !== null && String(actual) !== "";
    default:
      return true;
  }
}
