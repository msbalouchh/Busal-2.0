import "server-only";

import { NextResponse } from "next/server";

import { buildCrmScopeFromInput, toCrmPlatformContext } from "@/modules/crm/lib/crm-scope";
import { customerService } from "@/modules/crm/services/customer.service";
import {
  createCustomerSchema,
  customerSearchSchema,
} from "@/modules/crm/validation/customer-schemas";
import { jsonSuccess, withPlatformApiAuth } from "@/modules/platform/api/v1/platform-api-handler";
import { PLATFORM_API_SCOPES } from "@/modules/platform/constants/api-scopes";

export async function handleV1ListCustomers(request: Request) {
  return withPlatformApiAuth(request, [PLATFORM_API_SCOPES.CUSTOMERS_READ], async (auth) => {
    const scope = buildCrmScopeFromInput({ businessId: auth.businessId });
    const context = toCrmPlatformContext(scope);
    const url = new URL(request.url);
    const parsed = customerSearchSchema.parse(Object.fromEntries(url.searchParams.entries()));
    const result = await customerService.search(parsed, context);
    return jsonSuccess(result);
  });
}

export async function handleV1CreateCustomer(request: Request) {
  return withPlatformApiAuth(request, [PLATFORM_API_SCOPES.CUSTOMERS_WRITE], async (auth) => {
    const scope = buildCrmScopeFromInput({ businessId: auth.businessId });
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
      null,
    );
    return jsonSuccess(record, 201);
  });
}

export async function handleV1GetCustomer(request: Request, customerId: string) {
  return withPlatformApiAuth(request, [PLATFORM_API_SCOPES.CUSTOMERS_READ], async (auth) => {
    const scope = buildCrmScopeFromInput({ businessId: auth.businessId });
    const context = toCrmPlatformContext(scope);
    const record = await customerService.getById(customerId, context);

    if (!record) {
      return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });
    }

    return jsonSuccess(record);
  });
}
