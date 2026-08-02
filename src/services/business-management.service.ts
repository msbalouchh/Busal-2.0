import "server-only";

import type { BusinessContactType, BusinessType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";
import type { BusinessProfileData } from "@/types/business-profile";

export interface BranchData {
  id: string;
  businessId: string;
  name: string;
  address: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  isMain: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BusinessHoursData {
  id: string;
  businessId: string;
  branchId: string | null;
  dayOfWeek: number;
  openTime: string | null;
  closeTime: string | null;
  isClosed: boolean;
}

export interface BusinessContactData {
  id: string;
  businessId: string;
  type: BusinessContactType;
  label: string | null;
  value: string;
  isPrimary: boolean;
}

export interface GeneralBusinessInput {
  businessName: string;
  businessType: BusinessType;
  country: string;
  timezone: string;
  ownerName: string;
}

export interface BranchInput {
  name: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  isMain?: boolean;
}

export interface BusinessHoursInput {
  dayOfWeek: number;
  openTime?: string | null;
  closeTime?: string | null;
  isClosed: boolean;
}

export interface BusinessContactInput {
  type: BusinessContactType;
  label?: string;
  value: string;
  isPrimary?: boolean;
}

async function getOwnedBusiness(ownerId: string): Promise<BusinessProfileData & { id: string }> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business;
}

export async function getBusinessManagementContext(ownerId: string) {
  const business = await getOwnedBusiness(ownerId);
  await ensureMainBranch(business.id);
  await ensureDefaultBusinessHours(business.id);

  const [branches, hours, contacts] = await Promise.all([
    listBranches(business.id),
    listBusinessHours(business.id),
    listBusinessContacts(business.id),
  ]);

  return { business, branches, hours, contacts };
}

export async function ensureMainBranch(businessId: string): Promise<BranchData> {
  const existingMain = await prisma.branch.findFirst({
    where: { businessId, isMain: true },
  });

  if (existingMain) {
    return existingMain;
  }

  const branchCount = await prisma.branch.count({ where: { businessId } });

  if (branchCount > 0) {
    const first = await prisma.branch.findFirst({
      where: { businessId },
      orderBy: { createdAt: "asc" },
    });

    if (first) {
      return prisma.branch.update({
        where: { id: first.id },
        data: { isMain: true, name: first.name || "Main Branch" },
      });
    }
  }

  const business = await prisma.business.findUnique({ where: { id: businessId } });

  return prisma.branch.create({
    data: {
      businessId,
      name: "Main Branch",
      country: business?.country ?? null,
      isMain: true,
    },
  });
}

const DEFAULT_HOURS: Omit<BusinessHoursInput, "dayOfWeek">[] = [
  { isClosed: true, openTime: null, closeTime: null },
  { isClosed: false, openTime: "09:00", closeTime: "17:00" },
  { isClosed: false, openTime: "09:00", closeTime: "17:00" },
  { isClosed: false, openTime: "09:00", closeTime: "17:00" },
  { isClosed: false, openTime: "09:00", closeTime: "17:00" },
  { isClosed: false, openTime: "09:00", closeTime: "17:00" },
  { isClosed: true, openTime: null, closeTime: null },
];

export async function ensureDefaultBusinessHours(businessId: string): Promise<BusinessHoursData[]> {
  const existing = await prisma.businessHours.findMany({ where: { businessId } });

  if (existing.length >= 7) {
    return existing.sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  }

  await Promise.all(
    DEFAULT_HOURS.map((hours, dayOfWeek) =>
      prisma.businessHours.upsert({
        where: {
          businessId_dayOfWeek: { businessId, dayOfWeek },
        },
        create: {
          businessId,
          dayOfWeek,
          ...hours,
        },
        update: {},
      }),
    ),
  );

  return prisma.businessHours.findMany({
    where: { businessId },
    orderBy: { dayOfWeek: "asc" },
  });
}

export async function updateGeneralBusinessInfo(
  ownerId: string,
  input: GeneralBusinessInput,
): Promise<BusinessProfileData> {
  const business = await getOwnedBusiness(ownerId);

  await prisma.business.update({
    where: { id: business.id },
    data: {
      businessName: input.businessName.trim() || null,
      businessType: input.businessType,
      country: input.country.trim() || null,
      timezone: input.timezone.trim() || null,
      ownerName: input.ownerName.trim() || null,
    },
  });

  return getOrCreateBusinessForOwner(ownerId);
}

export async function listBranches(businessId: string): Promise<BranchData[]> {
  return prisma.branch.findMany({
    where: { businessId },
    orderBy: [{ isMain: "desc" }, { createdAt: "asc" }],
  });
}

export async function createBranch(ownerId: string, input: BranchInput): Promise<BranchData> {
  const business = await getOwnedBusiness(ownerId);

  if (input.isMain) {
    await prisma.branch.updateMany({
      where: { businessId: business.id },
      data: { isMain: false },
    });
  }

  return prisma.branch.create({
    data: {
      businessId: business.id,
      name: input.name.trim(),
      address: input.address?.trim() || null,
      city: input.city?.trim() || null,
      country: input.country?.trim() || null,
      phone: input.phone?.trim() || null,
      isMain: input.isMain ?? false,
    },
  });
}

export async function updateBranch(
  ownerId: string,
  branchId: string,
  input: BranchInput,
): Promise<BranchData> {
  const business = await getOwnedBusiness(ownerId);
  const branch = await prisma.branch.findFirst({
    where: { id: branchId, businessId: business.id },
  });

  if (!branch) {
    throw new Error("Branch not found");
  }

  if (input.isMain) {
    await prisma.branch.updateMany({
      where: { businessId: business.id },
      data: { isMain: false },
    });
  }

  return prisma.branch.update({
    where: { id: branchId },
    data: {
      name: input.name.trim(),
      address: input.address?.trim() || null,
      city: input.city?.trim() || null,
      country: input.country?.trim() || null,
      phone: input.phone?.trim() || null,
      isMain: input.isMain ?? branch.isMain,
    },
  });
}

export async function deleteBranch(ownerId: string, branchId: string): Promise<void> {
  const business = await getOwnedBusiness(ownerId);
  const branch = await prisma.branch.findFirst({
    where: { id: branchId, businessId: business.id },
  });

  if (!branch) {
    throw new Error("Branch not found");
  }

  if (branch.isMain) {
    throw new Error("Cannot delete the main branch");
  }

  await prisma.branch.delete({ where: { id: branchId } });
}

export async function listBusinessHours(businessId: string): Promise<BusinessHoursData[]> {
  return prisma.businessHours.findMany({
    where: { businessId },
    orderBy: { dayOfWeek: "asc" },
  });
}

export async function saveBusinessHours(
  ownerId: string,
  hours: BusinessHoursInput[],
): Promise<BusinessHoursData[]> {
  const business = await getOwnedBusiness(ownerId);
  return saveBusinessHoursForBusiness(business.id, hours);
}

export async function saveBusinessHoursForBusiness(
  businessId: string,
  hours: BusinessHoursInput[],
): Promise<BusinessHoursData[]> {
  await Promise.all(
    hours.map((entry) =>
      prisma.businessHours.upsert({
        where: {
          businessId_dayOfWeek: {
            businessId,
            dayOfWeek: entry.dayOfWeek,
          },
        },
        create: {
          businessId,
          dayOfWeek: entry.dayOfWeek,
          openTime: entry.isClosed ? null : entry.openTime,
          closeTime: entry.isClosed ? null : entry.closeTime,
          isClosed: entry.isClosed,
        },
        update: {
          openTime: entry.isClosed ? null : entry.openTime,
          closeTime: entry.isClosed ? null : entry.closeTime,
          isClosed: entry.isClosed,
        },
      }),
    ),
  );

  return listBusinessHours(businessId);
}

export async function listBusinessContacts(businessId: string): Promise<BusinessContactData[]> {
  return prisma.businessContact.findMany({
    where: { businessId },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
  });
}

export async function createBusinessContact(
  ownerId: string,
  input: BusinessContactInput,
): Promise<BusinessContactData> {
  const business = await getOwnedBusiness(ownerId);

  if (input.isPrimary) {
    await prisma.businessContact.updateMany({
      where: { businessId: business.id },
      data: { isPrimary: false },
    });
  }

  return prisma.businessContact.create({
    data: {
      businessId: business.id,
      type: input.type,
      label: input.label?.trim() || null,
      value: input.value.trim(),
      isPrimary: input.isPrimary ?? false,
    },
  });
}

export async function updateBusinessContact(
  ownerId: string,
  contactId: string,
  input: BusinessContactInput,
): Promise<BusinessContactData> {
  const business = await getOwnedBusiness(ownerId);
  const contact = await prisma.businessContact.findFirst({
    where: { id: contactId, businessId: business.id },
  });

  if (!contact) {
    throw new Error("Contact not found");
  }

  if (input.isPrimary) {
    await prisma.businessContact.updateMany({
      where: { businessId: business.id },
      data: { isPrimary: false },
    });
  }

  return prisma.businessContact.update({
    where: { id: contactId },
    data: {
      type: input.type,
      label: input.label?.trim() || null,
      value: input.value.trim(),
      isPrimary: input.isPrimary ?? contact.isPrimary,
    },
  });
}

export async function deleteBusinessContact(ownerId: string, contactId: string): Promise<void> {
  const business = await getOwnedBusiness(ownerId);
  const contact = await prisma.businessContact.findFirst({
    where: { id: contactId, businessId: business.id },
  });

  if (!contact) {
    throw new Error("Contact not found");
  }

  await prisma.businessContact.delete({ where: { id: contactId } });
}
