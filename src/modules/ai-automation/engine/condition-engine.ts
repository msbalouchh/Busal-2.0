import type {
  ConditionExpression,
  WorkflowExecutionContext,
} from "@/modules/ai-automation/types/automation-types";

function getFieldValue(context: WorkflowExecutionContext, field?: string): unknown {
  if (!field) {
    return undefined;
  }

  if (field.startsWith("event.")) {
    return context.eventPayload[field.slice(6)];
  }

  if (field.startsWith("variables.")) {
    return context.variables[field.slice(10)];
  }

  if (field === "branchId") {
    return context.branchId;
  }

  if (field === "roleSlug") {
    return context.roleSlug;
  }

  return context.variables[field];
}

function compareValues(
  left: unknown,
  right: unknown,
  operator: ConditionExpression["operator"],
): boolean {
  switch (operator) {
    case "EQ":
      return left === right;
    case "NEQ":
      return left !== right;
    case "GT":
      return Number(left) > Number(right);
    case "GTE":
      return Number(left) >= Number(right);
    case "LT":
      return Number(left) < Number(right);
    case "LTE":
      return Number(left) <= Number(right);
    case "IN":
      return Array.isArray(right) ? right.includes(left) : false;
    case "CONTAINS":
      return typeof left === "string" && typeof right === "string"
        ? left.toLowerCase().includes(right.toLowerCase())
        : false;
    default:
      return false;
  }
}

export function evaluateConditionExpression(
  expression: ConditionExpression,
  context: WorkflowExecutionContext,
): boolean {
  if (expression.operator === "AND") {
    return (expression.children ?? []).every((child) =>
      evaluateConditionExpression(child, context),
    );
  }

  if (expression.operator === "OR") {
    return (expression.children ?? []).some((child) => evaluateConditionExpression(child, context));
  }

  if (expression.operator === "NOT") {
    const child = expression.children?.[0];
    return child ? !evaluateConditionExpression(child, context) : false;
  }

  if (expression.ruleType === "branch") {
    return context.branchId === expression.value;
  }

  if (expression.ruleType === "role") {
    return context.roleSlug === expression.value;
  }

  if (expression.ruleType === "date") {
    const now = Date.now();
    const target = new Date(String(expression.value ?? "")).getTime();
    return expression.operator === "LTE" ? now <= target : now >= target;
  }

  const left = getFieldValue(context, expression.field);
  return compareValues(left, expression.value, expression.operator);
}
