import "server-only";

import { NextResponse } from "next/server";

import {
  handlePlatformRouteError,
  protectedRoute,
} from "@/modules/platform-guards/guards/route.guards";
import { CRM_PERMISSIONS } from "@/modules/crm/constants/permissions";
import { resolveCrmScope, toCrmPlatformContext } from "@/modules/crm/lib/crm-scope";
import { customerService } from "@/modules/crm/services/customer.service";
import type { CustomerAiInsights } from "@/modules/crm/services/crm-ai.service";
import {
  createCustomerSchema,
  customerSearchSchema,
  mergeCustomersSchema,
  updateCustomerSchema,
} from "@/modules/crm/validation/customer-schemas";

function jsonSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export async function handleListCustomers(request: Request) {
  try {
    const platform = await protectedRoute({ permission: CRM_PERMISSIONS.CRM_READ });
    const scope = resolveCrmScope(platform);
    const context = toCrmPlatformContext(scope);
    const url = new URL(request.url);
    const parsed = customerSearchSchema.parse(Object.fromEntries(url.searchParams.entries()));
    const result = await customerService.search(parsed, context);

    return jsonSuccess(result);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleCreateCustomer(request: Request) {
  try {
    const platform = await protectedRoute({ permission: CRM_PERMISSIONS.CRM_CREATE });
    const scope = resolveCrmScope(platform);
    const body = createCustomerSchema.parse(await request.json());
    const record = await customerService.create(
      {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        businessId: scope.businessId,
        branchId: scope.branchId,
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email ?? null,
        phone: body.phone ?? null,
        status: body.status,
        tagIds: body.tagIds,
        segmentIds: body.segmentIds,
      },
      platform.staffSession?.staffId ?? null,
    );

    return jsonSuccess(record, 201);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleGetCustomer(_request: Request, customerId: string) {
  try {
    const platform = await protectedRoute({ permission: CRM_PERMISSIONS.CRM_READ });
    const context = toCrmPlatformContext(resolveCrmScope(platform));
    const record = await customerService.getById(customerId, context);

    if (!record) {
      return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });
    }

    return jsonSuccess(record);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleUpdateCustomer(request: Request, customerId: string) {
  try {
    const platform = await protectedRoute({ permission: CRM_PERMISSIONS.CRM_UPDATE });
    const context = toCrmPlatformContext(resolveCrmScope(platform));
    const body = updateCustomerSchema.parse({ ...(await request.json()), customerId });
    const record = await customerService.update(
      body,
      context,
      platform.staffSession?.staffId ?? null,
    );

    if (!record) {
      return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });
    }

    return jsonSuccess(record);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleDeleteCustomer(_request: Request, customerId: string) {
  try {
    const platform = await protectedRoute({ permission: CRM_PERMISSIONS.CRM_DELETE });
    const context = toCrmPlatformContext(resolveCrmScope(platform));
    const deleted = await customerService.softDelete(
      customerId,
      context,
      platform.staffSession?.staffId ?? null,
    );

    if (!deleted) {
      return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });
    }

    return jsonSuccess({ deleted: true });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleRestoreCustomer(_request: Request, customerId: string) {
  try {
    const platform = await protectedRoute({ permission: CRM_PERMISSIONS.CRM_MANAGE });
    const context = toCrmPlatformContext(resolveCrmScope(platform));
    const restored = await customerService.restore(
      customerId,
      context,
      platform.staffSession?.staffId ?? null,
    );

    if (!restored) {
      return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });
    }

    return jsonSuccess({ restored: true });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleMergeCustomers(request: Request) {
  try {
    const platform = await protectedRoute({ permission: CRM_PERMISSIONS.CRM_MANAGE });
    const context = toCrmPlatformContext(resolveCrmScope(platform));
    const body = mergeCustomersSchema.parse(await request.json());
    const record = await customerService.merge(
      body.primaryCustomerId,
      body.secondaryCustomerId,
      context,
      platform.staffSession?.staffId ?? null,
    );

    if (!record) {
      return NextResponse.json({ success: false, error: "Customers not found" }, { status: 404 });
    }

    return jsonSuccess(record);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleExportCustomers() {
  try {
    const platform = await protectedRoute({ permission: CRM_PERMISSIONS.CRM_EXPORT });
    const context = toCrmPlatformContext(resolveCrmScope(platform));
    const rows = await customerService.exportCustomers(context);
    const headers = [
      "id",
      "name",
      "email",
      "phone",
      "status",
      "tags",
      "group",
      "loyaltyPoints",
      "totalOrders",
      "totalSpend",
      "createdAt",
    ];
    const body = rows
      .map((row) =>
        headers
          .map((key) => {
            const value = row[key as keyof typeof row];
            return value == null ? "" : String(value).replace(/,/g, " ");
          })
          .join(","),
      )
      .join("\n");

    return new NextResponse(`${headers.join(",")}\n${body}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="crm-customers-export.csv"',
      },
    });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleImportCustomers(request: Request) {
  try {
    const platform = await protectedRoute({ permission: CRM_PERMISSIONS.CRM_IMPORT });
    const context = toCrmPlatformContext(resolveCrmScope(platform));
    const body = (await request.json()) as { rows?: Array<Record<string, string>> };
    const rows = (body.rows ?? []).map((row) => ({
      name: row.name ?? "",
      email: row.email ?? null,
      phone: row.phone ?? null,
      tags: row.tags,
      group: row.group,
    }));
    const result = await customerService.importCustomers(
      rows,
      context,
      platform.staffSession?.staffId ?? null,
    );

    return jsonSuccess(result);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleCustomerAiInsights(_request: Request, customerId: string) {
  try {
    const platform = await protectedRoute({ permission: CRM_PERMISSIONS.CRM_READ });
    const context = toCrmPlatformContext(resolveCrmScope(platform));
    const { generateCustomerAiInsights } = await import("@/modules/crm/services/crm-ai.service");
    const baseInsights = await generateCustomerAiInsights(customerId, context);

    if (!baseInsights) {
      return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });
    }

    const { aiEngine } = await import("@/modules/ai-engine/engine/ai-engine");
    const aiInsight = await aiEngine.generateInsight(platform, {
      currentModule: "crm",
      prompt: `Analyze this CRM customer and return JSON with keys: summary, insights (array), upsellSuggestions (array), recommendedActions (array), sentiment (positive|neutral|negative). Customer data: ${JSON.stringify(baseInsights)}`,
      contextData: { customerId, baseInsights },
      responseFormat: "json",
    }).catch(() => null);

    const insights = aiInsight?.parsed
      ? {
          ...baseInsights,
          summary: String(aiInsight.parsed.summary ?? baseInsights.summary),
          insights: Array.isArray(aiInsight.parsed.insights)
            ? (aiInsight.parsed.insights as string[])
            : baseInsights.insights,
          upsellSuggestions: Array.isArray(aiInsight.parsed.upsellSuggestions)
            ? (aiInsight.parsed.upsellSuggestions as string[])
            : baseInsights.upsellSuggestions,
          recommendedActions: Array.isArray(aiInsight.parsed.recommendedActions)
            ? (aiInsight.parsed.recommendedActions as string[])
            : baseInsights.recommendedActions,
          sentiment:
            (aiInsight.parsed.sentiment as CustomerAiInsights["sentiment"]) ?? baseInsights.sentiment,
        }
      : baseInsights;

    return jsonSuccess(insights);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}
