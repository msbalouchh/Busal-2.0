import "server-only";

import { prisma } from "@/lib/prisma";
import { getDashboardPlatformBrandingSnapshot } from "@/modules/platform/services/platform-branding.service";
import type { CustomerAiIdentity } from "@/modules/customer-ai/types/customer-ai.types";

const DEFAULT_AI_NAME = "Assistant";
const DEFAULT_PERSONALITY = "Friendly";
const DEFAULT_TONE = "Friendly";

export async function getCustomerAiIdentity(businessId: string): Promise<CustomerAiIdentity> {
  const [business, branding] = await Promise.all([
    prisma.business.findUniqueOrThrow({
      where: { id: businessId },
      select: {
        businessName: true,
        aiName: true,
        aiPersonality: true,
        aiAvatarUrl: true,
        aiGreeting: true,
        aiTone: true,
      },
    }),
    getDashboardPlatformBrandingSnapshot(businessId).catch(() => null),
  ]);

  return {
    aiName: business.aiName?.trim() || DEFAULT_AI_NAME,
    aiPersonality: business.aiPersonality?.trim() || DEFAULT_PERSONALITY,
    aiAvatarUrl: business.aiAvatarUrl ?? null,
    aiGreeting: business.aiGreeting ?? null,
    aiTone: (business.aiTone?.trim() || DEFAULT_TONE) as CustomerAiIdentity["aiTone"],
    businessName: business.businessName?.trim() || "Business",
    whiteLabelName: branding?.customerFacingBrandName ?? null,
  };
}

export async function updateCustomerAiIdentity(
  businessId: string,
  input: {
    aiName?: string;
    aiPersonality?: string;
    aiAvatarUrl?: string | null;
    aiGreeting?: string | null;
    aiTone?: string;
  },
): Promise<CustomerAiIdentity> {
  const data: Record<string, string | null> = {};

  if (input.aiName !== undefined) {
    data.aiName = input.aiName.trim() || DEFAULT_AI_NAME;
  }
  if (input.aiPersonality !== undefined) {
    data.aiPersonality = input.aiPersonality.trim() || DEFAULT_PERSONALITY;
  }
  if (input.aiAvatarUrl !== undefined) {
    data.aiAvatarUrl = input.aiAvatarUrl;
  }
  if (input.aiGreeting !== undefined) {
    data.aiGreeting = input.aiGreeting;
  }
  if (input.aiTone !== undefined) {
    data.aiTone = input.aiTone.trim() || DEFAULT_TONE;
  }

  if (Object.keys(data).length > 0) {
    await prisma.business.update({
      where: { id: businessId },
      data,
    });
  }

  return getCustomerAiIdentity(businessId);
}

export async function uploadCustomerAiAvatar(
  platform: import("@/modules/business-context/types/business-context").BusinessContext,
  input: {
    originalName: string;
    mimeType: string;
    contentBase64: string;
  },
): Promise<CustomerAiIdentity> {
  const { ensureFilePlatformDefaults, uploadPlatformFile } =
    await import("@/services/file-platform.service");
  const { buildAssetUrl } = await import("@/modules/business/utils/business-dna");
  const {
    ALLOWED_IMAGE_MIME_TYPES,
    MAX_BUSINESS_ASSET_SIZE_BYTES,
  } = await import("@/modules/business/constants/business-profile");

  if (!ALLOWED_IMAGE_MIME_TYPES.includes(input.mimeType)) {
    throw new Error("Unsupported image type. Use PNG, JPEG, WebP, or SVG.");
  }

  const content = Buffer.from(input.contentBase64, "base64");
  if (content.length > MAX_BUSINESS_ASSET_SIZE_BYTES) {
    throw new Error("File exceeds the 5 MB limit.");
  }

  await ensureFilePlatformDefaults(platform.business.id);
  const upload = await uploadPlatformFile(platform, {
    module: "customer-ai",
    entityType: "ai-avatar",
    entityId: platform.business.id,
    originalName: input.originalName,
    mimeType: input.mimeType,
    content,
    tags: ["customer-ai", "avatar"],
    metadata: { purpose: "ai-avatar" },
    changeNotes: "Customer AI avatar upload",
  });

  const avatarUrl = buildAssetUrl(upload.id);
  return updateCustomerAiIdentity(platform.business.id, { aiAvatarUrl: avatarUrl });
}
