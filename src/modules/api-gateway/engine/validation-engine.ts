import type { ApiAuthMethod } from "@prisma/client";

import type {
  GatewayRequestInput,
  GatewayValidationResult,
  RegisteredApiRouteDefinition,
} from "@/modules/api-gateway/types/api-gateway-types";
import { detectAuthMethod, validateAuthMethod } from "@/modules/api-gateway/engine/auth-engine";

export function validateGatewayRequest(
  request: GatewayRequestInput,
  route: RegisteredApiRouteDefinition,
): GatewayValidationResult {
  const errors: string[] = [];

  const detectedAuth = detectAuthMethod(request);
  const allowedMethods = (route.authMethods ?? ["JWT", "API_KEY"]) as ApiAuthMethod[];

  if (!validateAuthMethod(detectedAuth, allowedMethods)) {
    errors.push("Authentication method not allowed or missing");
  }

  const payloadSize = request.payloadSizeBytes ?? 0;
  const maxPayload = route.maxPayloadBytes ?? 1048576;

  if (payloadSize > maxPayload) {
    errors.push(`Payload exceeds maximum size of ${maxPayload} bytes`);
  }

  const allowedTypes = route.allowedContentTypes ?? ["application/json"];

  if (
    request.contentType &&
    request.method !== "GET" &&
    !allowedTypes.some((type) => request.contentType?.includes(type))
  ) {
    errors.push(`Content type ${request.contentType} not allowed`);
  }

  if (route.requestSchema && request.body !== undefined) {
    const schema = route.requestSchema as { required?: string[] };
    if (schema.required && typeof request.body === "object" && request.body !== null) {
      for (const field of schema.required) {
        if (!(field in (request.body as Record<string, unknown>))) {
          errors.push(`Missing required field: ${field}`);
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
