import "server-only";

import { randomBytes } from "crypto";

import { prisma } from "@/lib/prisma";
import type { QRMenuSessionData } from "@/services/qr-menu.service";
import {
  POS_DEVICE_INFO,
  POS_HOLD_DEVICE_INFO,
  POS_HOLD_PARKING_QR_SLUG,
  POS_TERMINAL_QR_SLUG,
} from "@/modules/pos/constants/routes";

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

export async function getOrCreatePosQrCode(businessId: string): Promise<{ id: string }> {
  return getOrCreatePosQrCodeBySlug(businessId, POS_TERMINAL_QR_SLUG, "POS");
}

export async function getOrCreatePosSession(businessId: string): Promise<QRMenuSessionData> {
  return getOrCreatePosSessionBySlug(businessId, POS_TERMINAL_QR_SLUG, "POS", POS_DEVICE_INFO);
}

async function getOrCreatePosQrCodeBySlug(
  businessId: string,
  slug: string,
  codePrefix: string,
): Promise<{ id: string }> {
  const existing = await prisma.qRCode.findFirst({
    where: { businessId, slug },
    select: { id: true },
  });

  if (existing) {
    return existing;
  }

  return prisma.qRCode.create({
    data: {
      businessId,
      slug,
      code: `${codePrefix}-${businessId.slice(0, 8).toUpperCase()}`,
      isActive: true,
    },
    select: { id: true },
  });
}

async function getOrCreatePosSessionBySlug(
  businessId: string,
  slug: string,
  codePrefix: string,
  deviceInfo: string,
): Promise<QRMenuSessionData> {
  const qrCode = await getOrCreatePosQrCodeBySlug(businessId, slug, codePrefix);

  const activeSession = await prisma.qRMenuSession.findFirst({
    where: {
      businessId,
      qrCodeId: qrCode.id,
      endedAt: null,
      deviceInfo,
    },
    orderBy: { startedAt: "desc" },
  });

  if (activeSession) {
    return mapQRMenuSession(activeSession);
  }

  const session = await prisma.qRMenuSession.create({
    data: {
      businessId,
      qrCodeId: qrCode.id,
      sessionToken: `${slug}-${businessId}-${randomBytes(8).toString("hex")}`,
      deviceInfo,
    },
  });

  return mapQRMenuSession(session);
}

export async function createPosHoldParkingSession(businessId: string): Promise<QRMenuSessionData> {
  const qrCode = await getOrCreatePosQrCodeBySlug(businessId, POS_HOLD_PARKING_QR_SLUG, "POS-HOLD");

  const session = await prisma.qRMenuSession.create({
    data: {
      businessId,
      qrCodeId: qrCode.id,
      sessionToken: `pos-hold-${businessId}-${randomBytes(8).toString("hex")}`,
      deviceInfo: POS_HOLD_DEVICE_INFO,
    },
  });

  return mapQRMenuSession(session);
}
