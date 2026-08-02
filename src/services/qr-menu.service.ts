import "server-only";

import { randomBytes } from "crypto";

import { prisma } from "@/lib/prisma";
import { branchFilter } from "@/modules/business-context/utils/branch-scope";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";
import type { BusinessProfileData } from "@/types/business-profile";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export interface QRCodeData {
  id: string;
  businessId: string;
  tableId: string | null;
  code: string;
  slug: string;
  isActive: boolean;
  scanCount: number;
  lastScannedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface QRMenuSessionData {
  id: string;
  qrCodeId: string;
  tableId: string | null;
  businessId: string;
  sessionToken: string;
  startedAt: Date;
  endedAt: Date | null;
  deviceInfo: string | null;
  ipAddress: string | null;
}

export interface CreateQRCodeInput {
  slug: string;
  code?: string;
  tableId?: string | null;
  isActive?: boolean;
  branchId?: string | null;
}

export interface UpdateQRCodeInput {
  slug?: string;
  code?: string;
  tableId?: string | null;
  isActive?: boolean;
}

export interface ListQRCodesFilters {
  isActive?: boolean;
  tableId?: string;
  branchId?: string | null;
}

export interface CreateQRMenuSessionInput {
  qrCodeId: string;
  sessionToken: string;
  tableId?: string | null;
  deviceInfo?: string;
  ipAddress?: string;
  branchId?: string | null;
}

async function getOwnedBusiness(ownerId: string): Promise<BusinessProfileData & { id: string }> {
  return getOrCreateBusinessForOwner(ownerId);
}

function mapQRCode(qrCode: {
  id: string;
  businessId: string;
  tableId: string | null;
  code: string;
  slug: string;
  isActive: boolean;
  scanCount: number;
  lastScannedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): QRCodeData {
  return {
    id: qrCode.id,
    businessId: qrCode.businessId,
    tableId: qrCode.tableId,
    code: qrCode.code,
    slug: qrCode.slug,
    isActive: qrCode.isActive,
    scanCount: qrCode.scanCount,
    lastScannedAt: qrCode.lastScannedAt,
    createdAt: qrCode.createdAt,
    updatedAt: qrCode.updatedAt,
  };
}

function mapQRMenuSession(session: {
  id: string;
  qrCodeId: string;
  tableId: string | null;
  businessId: string;
  sessionToken: string;
  startedAt: Date;
  endedAt: Date | null;
  deviceInfo: string | null;
  ipAddress: string | null;
}): QRMenuSessionData {
  return {
    id: session.id,
    qrCodeId: session.qrCodeId,
    tableId: session.tableId,
    businessId: session.businessId,
    sessionToken: session.sessionToken,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    deviceInfo: session.deviceInfo,
    ipAddress: session.ipAddress,
  };
}

function normalizeSlug(value: string): string {
  return value.trim().toLowerCase();
}

function validateSlug(slug: string): void {
  const normalized = normalizeSlug(slug);

  if (!normalized) {
    throw new Error("Slug is required");
  }

  if (!SLUG_PATTERN.test(normalized)) {
    throw new Error("Slug must contain only lowercase letters, numbers, and hyphens");
  }
}

async function generateUniqueCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = `QR-${randomBytes(6).toString("hex").toUpperCase()}`;
    const existing = await prisma.qRCode.findUnique({
      where: { code },
      select: { id: true },
    });

    if (!existing) {
      return code;
    }
  }

  throw new Error("Unable to generate QR code");
}

async function assertUniqueSlug(slug: string, excludeQRCodeId?: string): Promise<void> {
  const existing = await prisma.qRCode.findFirst({
    where: {
      slug: normalizeSlug(slug),
      ...(excludeQRCodeId ? { id: { not: excludeQRCodeId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw new Error("A QR code with this slug already exists");
  }
}

async function assertUniqueCode(code: string, excludeQRCodeId?: string): Promise<void> {
  const existing = await prisma.qRCode.findFirst({
    where: {
      code: code.trim(),
      ...(excludeQRCodeId ? { id: { not: excludeQRCodeId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw new Error("A QR code with this code already exists");
  }
}

async function assertTableBelongsToBusiness(
  businessId: string,
  tableId: string | null | undefined,
): Promise<void> {
  if (!tableId) {
    return;
  }

  const table = await prisma.legacyTable.findFirst({
    where: { id: tableId, businessId },
    select: { id: true },
  });

  if (!table) {
    throw new Error("Table not found");
  }
}

async function getQRCodeForBusiness(businessId: string, qrCodeId: string): Promise<QRCodeData> {
  const qrCode = await prisma.qRCode.findFirst({
    where: { id: qrCodeId, businessId },
  });

  if (!qrCode) {
    throw new Error("QR code not found");
  }

  return mapQRCode(qrCode);
}

async function assertNoActiveSessions(qrCodeId: string): Promise<void> {
  const activeSession = await prisma.qRMenuSession.findFirst({
    where: { qrCodeId, endedAt: null },
    select: { id: true },
  });

  if (activeSession) {
    throw new Error("Cannot delete QR code with active sessions");
  }
}

async function getSessionForBusiness(
  businessId: string,
  sessionId: string,
): Promise<QRMenuSessionData> {
  const session = await prisma.qRMenuSession.findFirst({
    where: { id: sessionId, businessId },
  });

  if (!session) {
    throw new Error("QR menu session not found");
  }

  return mapQRMenuSession(session);
}

export async function createQRCode(ownerId: string, input: CreateQRCodeInput): Promise<QRCodeData> {
  const business = await getOwnedBusiness(ownerId);

  validateSlug(input.slug);
  await assertUniqueSlug(input.slug);
  await assertTableBelongsToBusiness(business.id, input.tableId);

  const code = input.code?.trim() || (await generateUniqueCode());
  await assertUniqueCode(code);

  const qrCode = await prisma.qRCode.create({
    data: {
      businessId: business.id,
      branchId: input.branchId ?? null,
      tableId: input.tableId ?? null,
      code,
      slug: normalizeSlug(input.slug),
      isActive: input.isActive ?? true,
    },
  });

  return mapQRCode(qrCode);
}

export async function getQRCodeById(ownerId: string, qrCodeId: string): Promise<QRCodeData> {
  const business = await getOwnedBusiness(ownerId);
  return getQRCodeForBusiness(business.id, qrCodeId);
}

export async function getQRCodeBySlug(ownerId: string, slug: string): Promise<QRCodeData> {
  const business = await getOwnedBusiness(ownerId);

  const qrCode = await prisma.qRCode.findFirst({
    where: { businessId: business.id, slug: normalizeSlug(slug) },
  });

  if (!qrCode) {
    throw new Error("QR code not found");
  }

  return mapQRCode(qrCode);
}

export async function listQRCodes(
  ownerId: string,
  filters: ListQRCodesFilters = {},
): Promise<QRCodeData[]> {
  const business = await getOwnedBusiness(ownerId);

  const qrCodes = await prisma.qRCode.findMany({
    where: {
      businessId: business.id,
      ...branchFilter(filters.branchId ?? null),
      ...(filters.isActive !== undefined ? { isActive: filters.isActive } : {}),
      ...(filters.tableId ? { tableId: filters.tableId } : {}),
    },
    orderBy: [{ createdAt: "desc" }],
  });

  return qrCodes.map(mapQRCode);
}

export async function updateQRCode(
  ownerId: string,
  qrCodeId: string,
  input: UpdateQRCodeInput,
): Promise<QRCodeData> {
  const business = await getOwnedBusiness(ownerId);

  const existing = await prisma.qRCode.findFirst({
    where: { id: qrCodeId, businessId: business.id },
  });

  if (!existing) {
    throw new Error("QR code not found");
  }

  if (input.slug !== undefined) {
    validateSlug(input.slug);
    await assertUniqueSlug(input.slug, qrCodeId);
  }

  if (input.code !== undefined) {
    if (!input.code.trim()) {
      throw new Error("QR code value is required");
    }
    await assertUniqueCode(input.code, qrCodeId);
  }

  await assertTableBelongsToBusiness(business.id, input.tableId);

  const qrCode = await prisma.qRCode.update({
    where: { id: qrCodeId },
    data: {
      ...(input.slug !== undefined ? { slug: normalizeSlug(input.slug) } : {}),
      ...(input.code !== undefined ? { code: input.code.trim() } : {}),
      ...(input.tableId !== undefined ? { tableId: input.tableId } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
  });

  return mapQRCode(qrCode);
}

export async function deleteQRCode(ownerId: string, qrCodeId: string): Promise<void> {
  const business = await getOwnedBusiness(ownerId);

  const existing = await prisma.qRCode.findFirst({
    where: { id: qrCodeId, businessId: business.id },
  });

  if (!existing) {
    throw new Error("QR code not found");
  }

  await assertNoActiveSessions(qrCodeId);

  await prisma.qRCode.delete({ where: { id: qrCodeId } });
}

export async function activateQRCode(ownerId: string, qrCodeId: string): Promise<QRCodeData> {
  return updateQRCode(ownerId, qrCodeId, { isActive: true });
}

export async function deactivateQRCode(ownerId: string, qrCodeId: string): Promise<QRCodeData> {
  return updateQRCode(ownerId, qrCodeId, { isActive: false });
}

export async function recordScan(ownerId: string, qrCodeId: string): Promise<QRCodeData> {
  const business = await getOwnedBusiness(ownerId);

  const existing = await prisma.qRCode.findFirst({
    where: { id: qrCodeId, businessId: business.id },
  });

  if (!existing) {
    throw new Error("QR code not found");
  }

  const qrCode = await prisma.qRCode.update({
    where: { id: qrCodeId },
    data: {
      scanCount: { increment: 1 },
      lastScannedAt: new Date(),
    },
  });

  return mapQRCode(qrCode);
}

export async function createQRMenuSession(
  ownerId: string,
  input: CreateQRMenuSessionInput,
): Promise<QRMenuSessionData> {
  const business = await getOwnedBusiness(ownerId);

  if (!input.sessionToken.trim()) {
    throw new Error("Session token is required");
  }

  const qrCode = await prisma.qRCode.findFirst({
    where: { id: input.qrCodeId, businessId: business.id },
    select: { id: true },
  });

  if (!qrCode) {
    throw new Error("QR code not found");
  }

  await assertTableBelongsToBusiness(business.id, input.tableId);

  const sessionToken = input.sessionToken.trim();
  const existingSession = await prisma.qRMenuSession.findUnique({
    where: { sessionToken },
    select: { id: true, endedAt: true },
  });

  if (existingSession && existingSession.endedAt === null) {
    throw new Error("An active session already exists for this token");
  }

  if (existingSession) {
    throw new Error("Session token already exists");
  }

  const session = await prisma.qRMenuSession.create({
    data: {
      qrCodeId: input.qrCodeId,
      businessId: business.id,
      branchId: input.branchId ?? null,
      tableId: input.tableId ?? null,
      sessionToken,
      deviceInfo: input.deviceInfo?.trim() || null,
      ipAddress: input.ipAddress?.trim() || null,
    },
  });

  return mapQRMenuSession(session);
}

export async function endQRMenuSession(
  ownerId: string,
  sessionId: string,
): Promise<QRMenuSessionData> {
  const business = await getOwnedBusiness(ownerId);

  const existing = await getSessionForBusiness(business.id, sessionId);

  if (existing.endedAt) {
    throw new Error("QR menu session is already ended");
  }

  const session = await prisma.qRMenuSession.update({
    where: { id: sessionId },
    data: { endedAt: new Date() },
  });

  return mapQRMenuSession(session);
}

export interface PublicBusinessMenuInfo {
  id: string;
  businessName: string | null;
  logoUrl: string | null;
  welcomeMessage: string | null;
}

export interface PublicQRMenuContext {
  qrCode: QRCodeData;
  ownerId: string;
  business: PublicBusinessMenuInfo;
}

export type PublicQRMenuErrorReason = "not_found" | "inactive";

export type ResolvePublicQRMenuResult =
  { ok: true; data: PublicQRMenuContext } | { ok: false; reason: PublicQRMenuErrorReason };

function mapPublicBusinessMenuInfo(business: {
  id: string;
  businessName: string | null;
  businessDna: unknown;
}): PublicBusinessMenuInfo {
  const dna =
    business.businessDna && typeof business.businessDna === "object"
      ? (business.businessDna as Record<string, unknown>)
      : {};

  const logoUrl = typeof dna.logoUrl === "string" ? dna.logoUrl : null;
  const welcomeMessage =
    typeof dna.welcomeMessage === "string"
      ? dna.welcomeMessage
      : typeof dna.tagline === "string"
        ? dna.tagline
        : null;

  return {
    id: business.id,
    businessName: business.businessName,
    logoUrl,
    welcomeMessage,
  };
}

export async function resolvePublicQRMenu(slug: string): Promise<ResolvePublicQRMenuResult> {
  const normalized = normalizeSlug(slug);

  if (!normalized) {
    return { ok: false, reason: "not_found" };
  }

  const qrCode = await prisma.qRCode.findUnique({
    where: { slug: normalized },
  });

  if (!qrCode) {
    return { ok: false, reason: "not_found" };
  }

  if (!qrCode.isActive) {
    return { ok: false, reason: "inactive" };
  }

  const business = await prisma.business.findUnique({
    where: { id: qrCode.businessId },
    select: {
      id: true,
      ownerId: true,
      businessName: true,
      businessDna: true,
    },
  });

  if (!business) {
    return { ok: false, reason: "not_found" };
  }

  return {
    ok: true,
    data: {
      qrCode: mapQRCode(qrCode),
      ownerId: business.ownerId,
      business: mapPublicBusinessMenuInfo(business),
    },
  };
}

export interface RecordPublicMenuVisitInput {
  sessionToken: string;
  tableId?: string | null;
  deviceInfo?: string;
  ipAddress?: string;
}

export async function recordPublicMenuVisit(
  ownerId: string,
  qrCodeId: string,
  input: RecordPublicMenuVisitInput,
): Promise<{ qrCode: QRCodeData; session: QRMenuSessionData }> {
  const qrCode = await recordScan(ownerId, qrCodeId);
  const session = await createQRMenuSession(ownerId, {
    qrCodeId,
    sessionToken: input.sessionToken,
    tableId: input.tableId,
    deviceInfo: input.deviceInfo,
    ipAddress: input.ipAddress,
  });

  return { qrCode, session };
}

export async function getPublicMenuSessionByToken(
  sessionToken: string,
  qrCodeId: string,
): Promise<QRMenuSessionData | null> {
  const session = await prisma.qRMenuSession.findUnique({
    where: { sessionToken },
  });

  if (!session || session.endedAt !== null || session.qrCodeId !== qrCodeId) {
    return null;
  }

  return mapQRMenuSession(session);
}
