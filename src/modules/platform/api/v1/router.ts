import "server-only";

import { NextResponse } from "next/server";

import { PLATFORM_API_SCOPES } from "@/modules/platform/constants/api-scopes";
import { handleV1GetAnalytics } from "@/modules/platform/api/v1/handlers/analytics.handler";
import { handleV1GetBusiness } from "@/modules/platform/api/v1/handlers/business.handler";
import {
  handleV1CreateCustomer,
  handleV1GetCustomer,
  handleV1ListCustomers,
} from "@/modules/platform/api/v1/handlers/customers.handler";
import { handleV1ListInventory } from "@/modules/platform/api/v1/handlers/inventory.handler";
import {
  handleV1GetMenuItem,
  handleV1ListMenuItems,
} from "@/modules/platform/api/v1/handlers/menu.handler";
import { handleV1ListPayments } from "@/modules/platform/api/v1/handlers/payments.handler";
import {
  handleV1CreateOrder,
  handleV1GetOrder,
  handleV1ListOrders,
} from "@/modules/platform/api/v1/handlers/orders.handler";
import {
  handleV1GetReservation,
  handleV1ListReservations,
} from "@/modules/platform/api/v1/handlers/reservations.handler";
import { handleV1ListStaff } from "@/modules/platform/api/v1/handlers/staff.handler";

type RouteHandler = (request: Request, ...args: string[]) => Promise<Response>;

interface V1RouteDefinition {
  method: string;
  pattern: RegExp;
  handler: RouteHandler;
  scopes: string[];
  summary: string;
}

const V1_ROUTES: V1RouteDefinition[] = [
  {
    method: "GET",
    pattern: /^\/businesses$/,
    handler: handleV1GetBusiness,
    scopes: [PLATFORM_API_SCOPES.BUSINESS_READ],
    summary: "Get business profile",
  },
  {
    method: "GET",
    pattern: /^\/customers$/,
    handler: handleV1ListCustomers,
    scopes: [PLATFORM_API_SCOPES.CUSTOMERS_READ],
    summary: "List customers",
  },
  {
    method: "POST",
    pattern: /^\/customers$/,
    handler: handleV1CreateCustomer,
    scopes: [PLATFORM_API_SCOPES.CUSTOMERS_WRITE],
    summary: "Create customer",
  },
  {
    method: "GET",
    pattern: /^\/customers\/([^/]+)$/,
    handler: (request, customerId) => handleV1GetCustomer(request, customerId),
    scopes: [PLATFORM_API_SCOPES.CUSTOMERS_READ],
    summary: "Get customer",
  },
  {
    method: "GET",
    pattern: /^\/orders$/,
    handler: handleV1ListOrders,
    scopes: [PLATFORM_API_SCOPES.ORDERS_READ],
    summary: "List orders",
  },
  {
    method: "POST",
    pattern: /^\/orders$/,
    handler: handleV1CreateOrder,
    scopes: [PLATFORM_API_SCOPES.ORDERS_WRITE],
    summary: "Create order",
  },
  {
    method: "GET",
    pattern: /^\/orders\/([^/]+)$/,
    handler: (request, orderId) => handleV1GetOrder(request, orderId),
    scopes: [PLATFORM_API_SCOPES.ORDERS_READ],
    summary: "Get order",
  },
  {
    method: "GET",
    pattern: /^\/menu$/,
    handler: handleV1ListMenuItems,
    scopes: [PLATFORM_API_SCOPES.MENU_READ],
    summary: "List menu items",
  },
  {
    method: "GET",
    pattern: /^\/menu\/([^/]+)$/,
    handler: (request, itemId) => handleV1GetMenuItem(request, itemId),
    scopes: [PLATFORM_API_SCOPES.MENU_READ],
    summary: "Get menu item",
  },
  {
    method: "GET",
    pattern: /^\/reservations$/,
    handler: handleV1ListReservations,
    scopes: [PLATFORM_API_SCOPES.RESERVATIONS_READ],
    summary: "List reservations",
  },
  {
    method: "GET",
    pattern: /^\/reservations\/([^/]+)$/,
    handler: (request, reservationId) => handleV1GetReservation(request, reservationId),
    scopes: [PLATFORM_API_SCOPES.RESERVATIONS_READ],
    summary: "Get reservation",
  },
  {
    method: "GET",
    pattern: /^\/staff$/,
    handler: handleV1ListStaff,
    scopes: [PLATFORM_API_SCOPES.STAFF_READ],
    summary: "List staff",
  },
  {
    method: "GET",
    pattern: /^\/inventory$/,
    handler: handleV1ListInventory,
    scopes: [PLATFORM_API_SCOPES.INVENTORY_READ],
    summary: "List inventory",
  },
  {
    method: "GET",
    pattern: /^\/payments$/,
    handler: handleV1ListPayments,
    scopes: [PLATFORM_API_SCOPES.ORDERS_READ],
    summary: "List payments",
  },
  {
    method: "GET",
    pattern: /^\/analytics$/,
    handler: handleV1GetAnalytics,
    scopes: [PLATFORM_API_SCOPES.ANALYTICS_READ],
    summary: "Get analytics summary",
  },
];

export async function dispatchV1ApiRequest(
  request: Request,
  pathSegments: string[],
): Promise<NextResponse> {
  const normalizedPath = `/${pathSegments.join("/")}`.replace(/\/+$/, "") || "/";
  const method = request.method.toUpperCase();

  for (const route of V1_ROUTES) {
    if (route.method !== method) {
      continue;
    }

    const match = normalizedPath.match(route.pattern);
    if (!match) {
      continue;
    }

    const params = match.slice(1);
    return (await route.handler(request, ...params)) as NextResponse;
  }

  return NextResponse.json(
    {
      success: false,
      error: "Route not found",
      code: "NOT_FOUND",
      path: `/api/v1${normalizedPath}`,
    },
    { status: 404 },
  );
}

export function listV1ApiRoutes(): Array<{ method: string; path: string }> {
  return listV1ApiRoutesWithScopes().map(({ method, path }) => ({ method, path }));
}

export function listV1ApiRoutesWithScopes(): Array<{
  method: string;
  path: string;
  scopes: string[];
  summary: string;
}> {
  return V1_ROUTES.map((route) => ({
    method: route.method,
    path: `/api/v1${route.pattern.source.replace(/^\^/, "").replace(/\$$/, "").replace("\\/", "/")}`,
    scopes: route.scopes,
    summary: route.summary,
  }));
}
