import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { isProductionDeployment } from "@/lib/production-mode";
import { loadPlatformConsumptionConfig } from "@/modules/platform/lib/platform-settings";

export interface EmbedTokenPayload {
  businessId: string;
  widgetType: string;
  origin: string;
  issuedAt: number;
  expiresAt: number;
}

function getEmbedSigningSecret(): string {
  const configured = process.env.PLATFORM_EMBED_SECRET?.trim();
  if (configured) {
    return configured;
  }

  if (isProductionDeployment()) {
    throw new Error("PLATFORM_EMBED_SECRET is required in production.");
  }

  return (
    process.env.DEVELOPER_API_SECRET_KEY ??
    "busal-dev-embed-secret-change-in-production"
  );
}

export function signEmbedToken(payload: EmbedTokenPayload): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHash("sha256")
    .update(`${encoded}.${getEmbedSigningSecret()}`)
    .digest("base64url");

  return `${encoded}.${signature}`;
}

export function verifyEmbedToken(token: string): EmbedTokenPayload | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) {
    return null;
  }

  const expected = createHash("sha256")
    .update(`${encoded}.${getEmbedSigningSecret()}`)
    .digest("base64url");

  if (expected !== signature) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as EmbedTokenPayload;

    if (payload.expiresAt < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function issueEmbedToken(input: {
  businessId: string;
  widgetType: string;
  origin: string;
  ttlSeconds?: number;
}): Promise<string | null> {
  const config = await loadPlatformConsumptionConfig(input.businessId);

  if (!config.embed.enabled) {
    return null;
  }

  const allowedOrigins = config.embed.allowedOrigins;
  if (allowedOrigins.length > 0 && !allowedOrigins.includes(input.origin)) {
    return null;
  }

  if (!config.embed.widgetTypes.includes(input.widgetType)) {
    return null;
  }

  const now = Date.now();
  const payload: EmbedTokenPayload = {
    businessId: input.businessId,
    widgetType: input.widgetType,
    origin: input.origin,
    issuedAt: now,
    expiresAt: now + (input.ttlSeconds ?? 3600) * 1000,
  };

  return signEmbedToken(payload);
}

export function generateEmbedOriginToken(): string {
  return `emb_${randomBytes(16).toString("hex")}`;
}
