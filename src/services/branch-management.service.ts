import "server-only";

import type { BranchStatus, BranchType, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { BRANCH_LIST_PAGE_SIZE } from "@/modules/branch-management/constants/routes";
import {
  normalizeBranchCode,
  slugifyBranchCode,
  validateBranchInput,
  validateBranchSettings,
} from "@/modules/branch-management/lib/branch-validation";
import type {
  BranchListQuery,
  BranchListResult,
  BranchManagementInput,
  BranchManagementRecord,
  BranchOpeningHoursDay,
  BranchSettingsInput,
} from "@/modules/branch-management/types/branch-management-types";
import { DEFAULT_BRANCH_OPENING_HOURS } from "@/modules/branch-management/types/branch-management-types";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

function parseOpeningHours(value: Prisma.JsonValue | null | undefined): BranchOpeningHoursDay[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return DEFAULT_BRANCH_OPENING_HOURS;
  }

  const days = (value as { days?: BranchOpeningHoursDay[] }).days;
  return Array.isArray(days) && days.length > 0 ? days : DEFAULT_BRANCH_OPENING_HOURS;
}

function serializeOpeningHours(days: BranchOpeningHoursDay[] | undefined): Prisma.InputJsonValue {
  return { days: days ?? DEFAULT_BRANCH_OPENING_HOURS } as unknown as Prisma.InputJsonValue;
}

function mapSettings(value: Prisma.JsonValue | null | undefined): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function decimalToNumber(value: Prisma.Decimal | null | undefined): number | null {
  if (value == null) {
    return null;
  }

  return Number(value);
}

function serializeBranch(
  branch: Prisma.BranchGetPayload<{ include: { settings: true } }>,
): BranchManagementRecord {
  return {
    id: branch.id,
    businessId: branch.businessId,
    name: branch.name,
    code: branch.code ?? slugifyBranchCode(branch.name),
    type: branch.type,
    status: branch.status,
    phone: branch.phone,
    email: branch.email,
    website: branch.website,
    addressLine1: branch.addressLine1 ?? branch.address,
    addressLine2: branch.addressLine2,
    city: branch.city,
    county: branch.county,
    postcode: branch.postcode,
    country: branch.country,
    latitude: decimalToNumber(branch.latitude),
    longitude: decimalToNumber(branch.longitude),
    timezone: branch.timezone,
    currency: branch.currency,
    taxNumber: branch.taxNumber,
    openingHours: parseOpeningHours(branch.openingHours),
    isPrimary: branch.isMain,
    isActive: branch.isActive,
    logo: branch.logo,
    coverImage: branch.coverImage,
    settings: mapSettings(branch.settings?.settings),
    createdAt: branch.createdAt.toISOString(),
    updatedAt: branch.updatedAt.toISOString(),
  };
}

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

async function assertUniqueBranchCode(
  businessId: string,
  code: string,
  excludeBranchId?: string,
): Promise<void> {
  const existing = await prisma.branch.findFirst({
    where: {
      businessId,
      code,
      ...(excludeBranchId ? { NOT: { id: excludeBranchId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw new Error("Branch code must be unique within this business");
  }
}

async function resolveUniqueCode(
  businessId: string,
  name: string,
  preferredCode?: string,
): Promise<string> {
  const base = normalizeBranchCode(preferredCode?.trim() || slugifyBranchCode(name));
  let code = base;
  let attempt = 1;

  while (
    await prisma.branch.findFirst({
      where: { businessId, code },
      select: { id: true },
    })
  ) {
    code = `${base}-${attempt}`;
    attempt += 1;
  }

  return code;
}

function buildBranchData(
  input: BranchManagementInput,
  code: string,
): Omit<Prisma.BranchCreateInput, "business" | "settings"> {
  return {
    name: input.name.trim(),
    code,
    type: input.type,
    status: "ACTIVE",
    phone: input.phone?.trim() || null,
    email: input.email?.trim() || null,
    website: input.website?.trim() || null,
    address: input.addressLine1.trim(),
    addressLine1: input.addressLine1.trim(),
    addressLine2: input.addressLine2?.trim() || null,
    city: input.city.trim(),
    county: input.county?.trim() || null,
    postcode: input.postcode?.trim() || null,
    country: input.country.trim(),
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    timezone: input.timezone.trim(),
    currency: input.currency?.trim() || null,
    taxNumber: input.taxNumber?.trim() || null,
    openingHours: serializeOpeningHours(input.openingHours),
    isMain: input.isPrimary ?? false,
    isActive: true,
    logo: input.logo?.trim() || null,
    coverImage: input.coverImage?.trim() || null,
  };
}

export async function listManagedBranches(
  businessId: string,
  query: BranchListQuery = {},
): Promise<BranchListResult> {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, query.pageSize ?? BRANCH_LIST_PAGE_SIZE));
  const search = query.search?.trim();

  const where: Prisma.BranchWhereInput = {
    businessId,
    ...(query.status && query.status !== "ALL" ? { status: query.status } : {}),
    ...(query.type && query.type !== "ALL" ? { type: query.type } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { code: { contains: search, mode: "insensitive" } },
            { city: { contains: search, mode: "insensitive" } },
            { country: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, branches] = await Promise.all([
    prisma.branch.count({ where }),
    prisma.branch.findMany({
      where,
      include: { settings: true },
      orderBy: [{ isMain: "desc" }, { status: "asc" }, { name: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    items: branches.map(serializeBranch),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getManagedBranch(
  businessId: string,
  branchId: string,
): Promise<BranchManagementRecord | null> {
  const branch = await prisma.branch.findFirst({
    where: { id: branchId, businessId },
    include: { settings: true },
  });

  return branch ? serializeBranch(branch) : null;
}

export async function listActiveManagedBranches(
  businessId: string,
): Promise<BranchManagementRecord[]> {
  const branches = await prisma.branch.findMany({
    where: { businessId, status: "ACTIVE", isActive: true },
    include: { settings: true },
    orderBy: [{ isMain: "desc" }, { name: "asc" }],
  });

  return branches.map(serializeBranch);
}

export async function createManagedBranch(
  ownerId: string,
  input: BranchManagementInput,
): Promise<BranchManagementRecord> {
  validateBranchInput(input);
  const businessId = await getOwnedBusinessId(ownerId);
  const code = await resolveUniqueCode(businessId, input.name, input.code);
  await assertUniqueBranchCode(businessId, code);

  if (input.isPrimary) {
    await prisma.branch.updateMany({
      where: { businessId },
      data: { isMain: false },
    });
  }

  const branch = await prisma.branch.create({
    data: {
      business: { connect: { id: businessId } },
      ...buildBranchData(input, code),
      settings: {
        create: {
          settings: {},
        },
      },
    },
    include: { settings: true },
  });

  return serializeBranch(branch);
}

export async function updateManagedBranch(
  ownerId: string,
  branchId: string,
  input: BranchManagementInput,
): Promise<BranchManagementRecord> {
  validateBranchInput(input);
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await prisma.branch.findFirst({
    where: { id: branchId, businessId },
    include: { settings: true },
  });

  if (!existing) {
    throw new Error("Branch not found");
  }

  const code = normalizeBranchCode(input.code);
  await assertUniqueBranchCode(businessId, code, branchId);

  if (input.isPrimary) {
    await prisma.branch.updateMany({
      where: { businessId, NOT: { id: branchId } },
      data: { isMain: false },
    });
  }

  const branch = await prisma.branch.update({
    where: { id: branchId },
    data: {
      ...buildBranchData(input, code),
      status: existing.status,
      isActive: existing.isActive,
    },
    include: { settings: true },
  });

  return serializeBranch(branch);
}

export async function archiveManagedBranch(ownerId: string, branchId: string): Promise<void> {
  const businessId = await getOwnedBusinessId(ownerId);
  const branch = await prisma.branch.findFirst({
    where: { id: branchId, businessId },
  });

  if (!branch) {
    throw new Error("Branch not found");
  }

  if (branch.isMain) {
    throw new Error("Cannot archive the primary branch");
  }

  await prisma.branch.update({
    where: { id: branchId },
    data: {
      status: "ARCHIVED",
      isActive: false,
    },
  });
}

export async function restoreManagedBranch(ownerId: string, branchId: string): Promise<void> {
  const businessId = await getOwnedBusinessId(ownerId);
  const branch = await prisma.branch.findFirst({
    where: { id: branchId, businessId },
  });

  if (!branch) {
    throw new Error("Branch not found");
  }

  await prisma.branch.update({
    where: { id: branchId },
    data: {
      status: "ACTIVE",
      isActive: true,
    },
  });
}

export async function setPrimaryManagedBranch(ownerId: string, branchId: string): Promise<void> {
  const businessId = await getOwnedBusinessId(ownerId);
  const branch = await prisma.branch.findFirst({
    where: { id: branchId, businessId },
  });

  if (!branch) {
    throw new Error("Branch not found");
  }

  if (branch.status === "ARCHIVED" || !branch.isActive) {
    throw new Error("Archived branches cannot be set as primary");
  }

  await prisma.$transaction([
    prisma.branch.updateMany({
      where: { businessId },
      data: { isMain: false },
    }),
    prisma.branch.update({
      where: { id: branchId },
      data: { isMain: true },
    }),
  ]);
}

export async function saveManagedBranchSettings(
  ownerId: string,
  branchId: string,
  input: BranchSettingsInput,
): Promise<BranchManagementRecord> {
  validateBranchSettings(input.settings);
  const businessId = await getOwnedBusinessId(ownerId);

  const branch = await prisma.branch.findFirst({
    where: { id: branchId, businessId },
    include: { settings: true },
  });

  if (!branch) {
    throw new Error("Branch not found");
  }

  if (!branch.settings) {
    await prisma.branchSettings.create({
      data: {
        branchId,
        settings: input.settings as Prisma.InputJsonValue,
      },
    });
  } else {
    await prisma.branchSettings.update({
      where: { branchId },
      data: { settings: input.settings as Prisma.InputJsonValue },
    });
  }

  const refreshed = await prisma.branch.findUniqueOrThrow({
    where: { id: branchId },
    include: { settings: true },
  });

  return serializeBranch(refreshed);
}

export type { BranchStatus, BranchType };
