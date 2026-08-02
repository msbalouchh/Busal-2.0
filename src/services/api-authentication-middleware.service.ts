import "server-only";

export {
  authenticateDeveloperApiRequest as authenticateApiRequest,
  authorizeDeveloperApiRequest as authorizeApiRequest,
} from "@/services/developer-api-gateway.service";

export async function validateApiAuthenticationHeader(
  authorizationHeader: string | null,
): Promise<string | null> {
  if (!authorizationHeader) return null;
  const [scheme, token] = authorizationHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}
