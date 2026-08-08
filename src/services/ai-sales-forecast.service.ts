import "server-only";

import type { BusinessContext } from "@/modules/business-context/types/business-context";
import type {
  SalesForecastHorizon,
  SalesForecastRequest,
  SalesForecastResult,
} from "@/modules/ai-sales-agent-management/types/ai-sales-agent-types";
import { prisma } from "@/lib/prisma";
import { generateDomainAiInsight } from "@/services/ai-domain-engine.service";
import { getRevenueTrendPoints } from "@/services/ai-sales-revenue-insight.service";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

async function buildPlatformContextForOwner(ownerId: string): Promise<BusinessContext> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: ownerId } });

  const { resolveAuthorizationContext } =
    await import("@/modules/authorization/services/authorization.service");
  const { mapProfileToAuthUser } = await import("@/services/user.service");

  const authUser = mapProfileToAuthUser(user.id, user.email, user, {});
  const authorization = await resolveAuthorizationContext(authUser, business);

  return {
    user: authUser,
    business,
    branch: null,
    branchId: null,
    roleSlug: authorization.roleSlug,
    permissions: Array.from(authorization.permissions),
    authorization,
    staffSession: null,
    isOwner: authorization.isOwner,
    accessibleBusinesses: [],
    accessibleBranches: [],
  };
}

function extractJsonBlock(content: string): unknown {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced?.[1]) {
    try {
      return JSON.parse(fenced[1].trim());
    } catch {
      // fall through
    }
  }

  const objectMatch = content.match(/\{[\s\S]*\}/);
  if (objectMatch?.[0]) {
    try {
      return JSON.parse(objectMatch[0]);
    } catch {
      // fall through
    }
  }

  return null;
}

function parseSalesForecastPayload(
  content: string,
  horizon: SalesForecastHorizon,
  trendPoints: Awaited<ReturnType<typeof getRevenueTrendPoints>>,
): Pick<SalesForecastResult, "projectedRevenuePence" | "confidence" | "methodology" | "assumptions"> {
  const parsed = extractJsonBlock(content);
  const record =
    parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;

  const weekPoint = trendPoints.find((p) => p.label === "This week");
  const monthPoint = trendPoints.find((p) => p.label === "This month");
  const baseRevenue =
    horizon === "week" ? (weekPoint?.revenuePence ?? 0) : (monthPoint?.revenuePence ?? 0);

  const projectedRevenuePence =
    typeof record?.projectedRevenuePence === "number"
      ? Math.round(record.projectedRevenuePence)
      : Math.round(baseRevenue * (horizon === "week" ? 1.05 : 1.08));

  const confidence =
    typeof record?.confidence === "number"
      ? Math.max(0, Math.min(1, record.confidence))
      : trendPoints.length >= 3
        ? 0.65
        : 0.45;

  const methodology =
    typeof record?.methodology === "string" && record.methodology.trim()
      ? record.methodology
      : "ai_engine_forecast";

  const assumptions = Array.isArray(record?.assumptions)
    ? record.assumptions.filter((entry): entry is string => typeof entry === "string")
    : [
        "Based on AI analysis of current revenue trend data",
        "Does not account for seasonality or pipeline conversion unless noted by the model",
      ];

  return { projectedRevenuePence, confidence, methodology, assumptions };
}

/**
 * Provider-agnostic forecast framework routed through the centralized AI engine.
 */
export async function generateSalesForecast(
  ownerId: string,
  request: SalesForecastRequest = {},
): Promise<SalesForecastResult> {
  const horizon: SalesForecastHorizon = request.horizon ?? "month";
  const business = await getOrCreateBusinessForOwner(ownerId);
  const platform = await buildPlatformContextForOwner(ownerId);
  const trendPoints = await getRevenueTrendPoints(ownerId);

  const result = await generateDomainAiInsight(platform, {
    module: "sales",
    task: "sales-forecast",
    context: { horizon, trendPoints },
    instructions: [
      "Analyze the revenue trend data and return JSON only.",
      'Shape: { "projectedRevenuePence": number, "confidence": number, "methodology": string, "assumptions": string[] }',
      "projectedRevenuePence must be in pence for the requested horizon.",
      "confidence must be between 0 and 1.",
    ].join("\n"),
  });

  const forecast = parseSalesForecastPayload(result.content, horizon, trendPoints);

  return {
    businessId: business.id,
    horizon,
    projectedRevenuePence: forecast.projectedRevenuePence,
    confidence: forecast.confidence,
    methodology: forecast.methodology,
    assumptions: forecast.assumptions,
    dataPoints: trendPoints,
    generatedAt: new Date().toISOString(),
  };
}

export function getForecastHorizons(): SalesForecastHorizon[] {
  return ["week", "month", "quarter"];
}
