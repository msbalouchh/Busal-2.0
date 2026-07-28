"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedAction } from "@/modules/platform-guards/guards/action.guards";
import { API_GATEWAY_ROUTES } from "@/modules/api-gateway/constants/routes";
import type {
  DeliverWebhookInput,
  RegisterWebhookInput,
  RegisteredApiRouteDefinition,
} from "@/modules/api-gateway/types/api-gateway-types";
import {
  deliverWebhook,
  registerModuleApiRoute,
  registerWebhook,
  retryFailedWebhookDeliveries,
} from "@/services/api-gateway.service";

export async function registerModuleApiRouteAction(definition: RegisteredApiRouteDefinition) {
  return protectedAction(PERMISSION_CODES.API_GATEWAY_MANAGE, async ({ platform }) => {
    await registerModuleApiRoute(platform.business.id, definition);
    revalidatePath(API_GATEWAY_ROUTES.routes);
    revalidatePath(API_GATEWAY_ROUTES.registry);
    revalidatePath(API_GATEWAY_ROUTES.openapi);
  });
}

export async function registerWebhookAction(input: RegisterWebhookInput) {
  return protectedAction(PERMISSION_CODES.API_GATEWAY_MANAGE, async ({ platform }) => {
    const result = await registerWebhook(platform, input);
    revalidatePath(API_GATEWAY_ROUTES.webhooks);
    revalidatePath(API_GATEWAY_ROUTES.audit);
    return result;
  });
}

export async function deliverWebhookAction(input: DeliverWebhookInput) {
  return protectedAction(PERMISSION_CODES.API_GATEWAY_MANAGE, async ({ platform }) => {
    const result = await deliverWebhook(platform, input);
    revalidatePath(API_GATEWAY_ROUTES.webhooks);
    revalidatePath(API_GATEWAY_ROUTES.monitoring);
    revalidatePath(API_GATEWAY_ROUTES.audit);
    return result;
  });
}

export async function retryFailedWebhookDeliveriesAction() {
  return protectedAction(PERMISSION_CODES.API_GATEWAY_MANAGE, async ({ platform }) => {
    const result = await retryFailedWebhookDeliveries(platform);
    revalidatePath(API_GATEWAY_ROUTES.webhooks);
    return result;
  });
}
