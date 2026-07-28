import "server-only";

import type {
  CommercialBillingCycle,
  CommercialPricingModel,
  CommercialProductStatus,
  PriceBookType,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { logCommercialAudit } from "@/modules/commercial/utils/commercial-audit";

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function assertIntegerPence(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer pence value`);
  }
}

export interface CommercialCategoryData {
  id: string;
  businessId: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface CommercialProductVersionData {
  id: string;
  productId: string;
  versionNumber: number;
  name: string;
  description: string | null;
  pricingModel: CommercialPricingModel;
  basePricePence: number;
  currency: string;
  taxClass: string | null;
  industry: string | null;
  setupRequired: boolean;
  requiresContract: boolean;
  renewable: boolean;
  defaultBillingCycle: CommercialBillingCycle | null;
  estimatedDeliveryTime: string | null;
  assignedDepartment: string | null;
  serviceChecklistTemplate: string | null;
  documentation: string | null;
  createdAt: Date;
}

export interface CommercialProductData {
  id: string;
  businessId: string;
  categoryId: string | null;
  categoryName: string | null;
  sku: string;
  status: CommercialProductStatus;
  currentVersion: CommercialProductVersionData | null;
  versionCount: number;
}

export interface CommercialProductInput {
  sku: string;
  categoryId?: string | null;
  status?: CommercialProductStatus;
  name: string;
  description?: string | null;
  pricingModel: CommercialPricingModel;
  basePricePence: number;
  currency?: string;
  taxClass?: string | null;
  industry?: string | null;
  setupRequired?: boolean;
  requiresContract?: boolean;
  renewable?: boolean;
  defaultBillingCycle?: CommercialBillingCycle | null;
  estimatedDeliveryTime?: string | null;
  assignedDepartment?: string | null;
  serviceChecklistTemplate?: string | null;
  documentation?: string | null;
}

export interface CommercialBundleItemInput {
  productVersionId: string;
  quantity?: number;
  individualPricePence: number;
  sortOrder?: number;
}

export interface CommercialBundleInput {
  sku: string;
  status?: CommercialProductStatus;
  name: string;
  description?: string | null;
  bundlePricePence: number;
  currency?: string;
  pricingModel?: CommercialPricingModel;
  items: CommercialBundleItemInput[];
}

export interface CommercialBundleData {
  id: string;
  businessId: string;
  sku: string;
  status: CommercialProductStatus;
  currentVersion: {
    id: string;
    versionNumber: number;
    name: string;
    description: string | null;
    bundlePricePence: number;
    currency: string;
    pricingModel: CommercialPricingModel;
    items: Array<{
      id: string;
      productVersionId: string;
      productName: string;
      quantity: number;
      individualPricePence: number;
    }>;
  } | null;
  versionCount: number;
}

export interface PriceBookInput {
  code: string;
  type: PriceBookType;
  status?: CommercialProductStatus;
  countryCode?: string | null;
  partnerId?: string | null;
  name: string;
  description?: string | null;
  effectiveFrom?: Date | null;
  effectiveTo?: Date | null;
  entries?: Array<{
    productVersionId?: string;
    bundleVersionId?: string;
    pricePence: number;
    currency?: string;
    pricingModel?: CommercialPricingModel;
  }>;
}

export interface PriceBookData {
  id: string;
  businessId: string;
  code: string;
  type: PriceBookType;
  status: CommercialProductStatus;
  countryCode: string | null;
  partnerId: string | null;
  currentVersion: {
    id: string;
    versionNumber: number;
    name: string;
    description: string | null;
    effectiveFrom: Date | null;
    effectiveTo: Date | null;
    entries: Array<{
      id: string;
      pricePence: number;
      currency: string;
      pricingModel: CommercialPricingModel | null;
      productVersionId: string | null;
      bundleVersionId: string | null;
    }>;
  } | null;
  versionCount: number;
}

export interface CommercialCatalogueDashboard {
  totalCategories: number;
  totalProducts: number;
  totalBundles: number;
  totalPriceBooks: number;
  activeProducts: number;
}

function mapProductVersion(
  version: Prisma.CommercialProductVersionGetPayload<object>,
): CommercialProductVersionData {
  return {
    id: version.id,
    productId: version.productId,
    versionNumber: version.versionNumber,
    name: version.name,
    description: version.description,
    pricingModel: version.pricingModel,
    basePricePence: version.basePricePence,
    currency: version.currency,
    taxClass: version.taxClass,
    industry: version.industry,
    setupRequired: version.setupRequired,
    requiresContract: version.requiresContract,
    renewable: version.renewable,
    defaultBillingCycle: version.defaultBillingCycle,
    estimatedDeliveryTime: version.estimatedDeliveryTime,
    assignedDepartment: version.assignedDepartment,
    serviceChecklistTemplate: version.serviceChecklistTemplate,
    documentation: version.documentation,
    createdAt: version.createdAt,
  };
}

export async function listCommercialCategories(
  businessId: string,
): Promise<CommercialCategoryData[]> {
  const categories = await prisma.commercialCategory.findMany({
    where: { businessId, deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return categories.map((category) => ({
    id: category.id,
    businessId: category.businessId,
    name: category.name,
    slug: category.slug,
    description: category.description,
    sortOrder: category.sortOrder,
    isActive: category.isActive,
  }));
}

export async function createCommercialCategory(
  businessId: string,
  staffId: string | null,
  input: { name: string; description?: string | null; sortOrder?: number },
): Promise<CommercialCategoryData> {
  const slug = slugify(input.name);

  const category = await prisma.commercialCategory.create({
    data: {
      businessId,
      name: input.name.trim(),
      slug,
      description: input.description?.trim() || null,
      sortOrder: input.sortOrder ?? 0,
    },
  });

  await logCommercialAudit(businessId, {
    staffId,
    entityType: "category",
    entityId: category.id,
    action: "CREATE",
  });

  return {
    id: category.id,
    businessId: category.businessId,
    name: category.name,
    slug: category.slug,
    description: category.description,
    sortOrder: category.sortOrder,
    isActive: category.isActive,
  };
}

async function createProductVersion(
  productId: string,
  versionNumber: number,
  staffId: string | null,
  input: Omit<CommercialProductInput, "sku" | "categoryId" | "status">,
): Promise<CommercialProductVersionData> {
  assertIntegerPence(input.basePricePence, "Base price");

  const version = await prisma.commercialProductVersion.create({
    data: {
      productId,
      versionNumber,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      pricingModel: input.pricingModel,
      basePricePence: input.basePricePence,
      currency: input.currency ?? "GBP",
      taxClass: input.taxClass?.trim() || null,
      industry: input.industry?.trim() || null,
      setupRequired: input.setupRequired ?? false,
      requiresContract: input.requiresContract ?? false,
      renewable: input.renewable ?? false,
      defaultBillingCycle: input.defaultBillingCycle ?? null,
      estimatedDeliveryTime: input.estimatedDeliveryTime?.trim() || null,
      assignedDepartment: input.assignedDepartment?.trim() || null,
      serviceChecklistTemplate: input.serviceChecklistTemplate?.trim() || null,
      documentation: input.documentation?.trim() || null,
      createdByStaffId: staffId,
    },
  });

  return mapProductVersion(version);
}

export async function createCommercialProduct(
  businessId: string,
  staffId: string | null,
  input: CommercialProductInput,
): Promise<CommercialProductData> {
  assertIntegerPence(input.basePricePence, "Base price");

  const product = await prisma.commercialProduct.create({
    data: {
      businessId,
      categoryId: input.categoryId ?? null,
      sku: input.sku.trim(),
      status: input.status ?? "DRAFT",
    },
  });

  const version = await createProductVersion(product.id, 1, staffId, input);

  await prisma.commercialProduct.update({
    where: { id: product.id },
    data: { currentVersionId: version.id },
  });

  await logCommercialAudit(businessId, {
    staffId,
    entityType: "product",
    entityId: product.id,
    action: "CREATE",
    metadata: { versionNumber: 1 },
  });

  return getCommercialProduct(product.id, businessId);
}

export async function updateCommercialProduct(
  productId: string,
  businessId: string,
  staffId: string | null,
  input: CommercialProductInput,
): Promise<CommercialProductData> {
  const existing = await prisma.commercialProduct.findFirst({
    where: { id: productId, businessId, deletedAt: null },
    include: { _count: { select: { versions: true } } },
  });

  if (!existing) {
    throw new Error("Commercial product not found");
  }

  const nextVersionNumber = existing._count.versions + 1;
  const version = await createProductVersion(existing.id, nextVersionNumber, staffId, input);

  await prisma.commercialProduct.update({
    where: { id: existing.id },
    data: {
      categoryId: input.categoryId ?? existing.categoryId,
      sku: input.sku.trim(),
      status: input.status ?? existing.status,
      currentVersionId: version.id,
    },
  });

  await logCommercialAudit(businessId, {
    staffId,
    entityType: "product",
    entityId: existing.id,
    action: "VERSION_CREATED",
    metadata: { versionNumber: nextVersionNumber },
  });

  return getCommercialProduct(existing.id, businessId);
}

export async function getCommercialProduct(
  productId: string,
  businessId: string,
): Promise<CommercialProductData> {
  const product = await prisma.commercialProduct.findFirst({
    where: { id: productId, businessId, deletedAt: null },
    include: {
      category: { select: { name: true } },
      currentVersion: true,
      _count: { select: { versions: true } },
    },
  });

  if (!product) {
    throw new Error("Commercial product not found");
  }

  return {
    id: product.id,
    businessId: product.businessId,
    categoryId: product.categoryId,
    categoryName: product.category?.name ?? null,
    sku: product.sku,
    status: product.status,
    currentVersion: product.currentVersion ? mapProductVersion(product.currentVersion) : null,
    versionCount: product._count.versions,
  };
}

export async function listCommercialProducts(businessId: string): Promise<CommercialProductData[]> {
  const products = await prisma.commercialProduct.findMany({
    where: { businessId, deletedAt: null },
    include: {
      category: { select: { name: true } },
      currentVersion: true,
      _count: { select: { versions: true } },
    },
    orderBy: [{ updatedAt: "desc" }],
  });

  return products.map((product) => ({
    id: product.id,
    businessId: product.businessId,
    categoryId: product.categoryId,
    categoryName: product.category?.name ?? null,
    sku: product.sku,
    status: product.status,
    currentVersion: product.currentVersion ? mapProductVersion(product.currentVersion) : null,
    versionCount: product._count.versions,
  }));
}

export async function archiveCommercialProduct(
  productId: string,
  businessId: string,
  staffId: string | null,
): Promise<void> {
  const product = await prisma.commercialProduct.findFirst({
    where: { id: productId, businessId, deletedAt: null },
  });

  if (!product) {
    throw new Error("Commercial product not found");
  }

  await prisma.commercialProduct.update({
    where: { id: product.id },
    data: { status: "ARCHIVED", deletedAt: new Date() },
  });

  await logCommercialAudit(businessId, {
    staffId,
    entityType: "product",
    entityId: product.id,
    action: "ARCHIVE",
  });
}

export async function createCommercialBundle(
  businessId: string,
  staffId: string | null,
  input: CommercialBundleInput,
): Promise<CommercialBundleData> {
  assertIntegerPence(input.bundlePricePence, "Bundle price");

  for (const item of input.items) {
    assertIntegerPence(item.individualPricePence, "Individual bundle item price");
  }

  const bundle = await prisma.commercialBundle.create({
    data: {
      businessId,
      sku: input.sku.trim(),
      status: input.status ?? "DRAFT",
    },
  });

  const version = await prisma.commercialBundleVersion.create({
    data: {
      bundleId: bundle.id,
      versionNumber: 1,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      bundlePricePence: input.bundlePricePence,
      currency: input.currency ?? "GBP",
      pricingModel: input.pricingModel ?? "ONE_TIME",
      createdByStaffId: staffId,
      items: {
        create: input.items.map((item, index) => ({
          productVersionId: item.productVersionId,
          quantity: item.quantity ?? 1,
          individualPricePence: item.individualPricePence,
          sortOrder: item.sortOrder ?? index,
        })),
      },
    },
  });

  await prisma.commercialBundle.update({
    where: { id: bundle.id },
    data: { currentVersionId: version.id },
  });

  await logCommercialAudit(businessId, {
    staffId,
    entityType: "bundle",
    entityId: bundle.id,
    action: "CREATE",
    metadata: { versionNumber: 1 },
  });

  return getCommercialBundle(bundle.id, businessId);
}

export async function getCommercialBundle(
  bundleId: string,
  businessId: string,
): Promise<CommercialBundleData> {
  const bundle = await prisma.commercialBundle.findFirst({
    where: { id: bundleId, businessId, deletedAt: null },
    include: {
      currentVersion: {
        include: {
          items: {
            include: { productVersion: { select: { name: true } } },
            orderBy: [{ sortOrder: "asc" }],
          },
        },
      },
      _count: { select: { versions: true } },
    },
  });

  if (!bundle) {
    throw new Error("Commercial bundle not found");
  }

  return {
    id: bundle.id,
    businessId: bundle.businessId,
    sku: bundle.sku,
    status: bundle.status,
    currentVersion: bundle.currentVersion
      ? {
          id: bundle.currentVersion.id,
          versionNumber: bundle.currentVersion.versionNumber,
          name: bundle.currentVersion.name,
          description: bundle.currentVersion.description,
          bundlePricePence: bundle.currentVersion.bundlePricePence,
          currency: bundle.currentVersion.currency,
          pricingModel: bundle.currentVersion.pricingModel,
          items: bundle.currentVersion.items.map((item) => ({
            id: item.id,
            productVersionId: item.productVersionId,
            productName: item.productVersion.name,
            quantity: item.quantity,
            individualPricePence: item.individualPricePence,
          })),
        }
      : null,
    versionCount: bundle._count.versions,
  };
}

export async function listCommercialBundles(businessId: string): Promise<CommercialBundleData[]> {
  const bundles = await prisma.commercialBundle.findMany({
    where: { businessId, deletedAt: null },
    include: {
      currentVersion: {
        include: {
          items: {
            include: { productVersion: { select: { name: true } } },
            orderBy: [{ sortOrder: "asc" }],
          },
        },
      },
      _count: { select: { versions: true } },
    },
    orderBy: [{ updatedAt: "desc" }],
  });

  return Promise.all(bundles.map((bundle) => getCommercialBundle(bundle.id, businessId)));
}

export async function createPriceBook(
  businessId: string,
  staffId: string | null,
  input: PriceBookInput,
): Promise<PriceBookData> {
  for (const entry of input.entries ?? []) {
    assertIntegerPence(entry.pricePence, "Price book entry price");
  }

  const priceBook = await prisma.priceBook.create({
    data: {
      businessId,
      code: input.code.trim(),
      type: input.type,
      status: input.status ?? "ACTIVE",
      countryCode: input.countryCode?.trim() || null,
      partnerId: input.partnerId?.trim() || null,
    },
  });

  const version = await prisma.priceBookVersion.create({
    data: {
      priceBookId: priceBook.id,
      versionNumber: 1,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      effectiveFrom: input.effectiveFrom ?? null,
      effectiveTo: input.effectiveTo ?? null,
      createdByStaffId: staffId,
      entries: {
        create: (input.entries ?? []).map((entry) => ({
          productVersionId: entry.productVersionId ?? null,
          bundleVersionId: entry.bundleVersionId ?? null,
          pricePence: entry.pricePence,
          currency: entry.currency ?? "GBP",
          pricingModel: entry.pricingModel ?? null,
        })),
      },
    },
  });

  await prisma.priceBook.update({
    where: { id: priceBook.id },
    data: { currentVersionId: version.id },
  });

  await logCommercialAudit(businessId, {
    staffId,
    entityType: "price_book",
    entityId: priceBook.id,
    action: "CREATE",
    metadata: { versionNumber: 1, type: input.type },
  });

  return getPriceBook(priceBook.id, businessId);
}

export async function getPriceBook(
  priceBookId: string,
  businessId: string,
): Promise<PriceBookData> {
  const priceBook = await prisma.priceBook.findFirst({
    where: { id: priceBookId, businessId, deletedAt: null },
    include: {
      currentVersion: { include: { entries: true } },
      _count: { select: { versions: true } },
    },
  });

  if (!priceBook) {
    throw new Error("Price book not found");
  }

  return {
    id: priceBook.id,
    businessId: priceBook.businessId,
    code: priceBook.code,
    type: priceBook.type,
    status: priceBook.status,
    countryCode: priceBook.countryCode,
    partnerId: priceBook.partnerId,
    currentVersion: priceBook.currentVersion
      ? {
          id: priceBook.currentVersion.id,
          versionNumber: priceBook.currentVersion.versionNumber,
          name: priceBook.currentVersion.name,
          description: priceBook.currentVersion.description,
          effectiveFrom: priceBook.currentVersion.effectiveFrom,
          effectiveTo: priceBook.currentVersion.effectiveTo,
          entries: priceBook.currentVersion.entries.map((entry) => ({
            id: entry.id,
            pricePence: entry.pricePence,
            currency: entry.currency,
            pricingModel: entry.pricingModel,
            productVersionId: entry.productVersionId,
            bundleVersionId: entry.bundleVersionId,
          })),
        }
      : null,
    versionCount: priceBook._count.versions,
  };
}

export async function listPriceBooks(businessId: string): Promise<PriceBookData[]> {
  const priceBooks = await prisma.priceBook.findMany({
    where: { businessId, deletedAt: null },
    orderBy: [{ updatedAt: "desc" }],
  });

  return Promise.all(priceBooks.map((priceBook) => getPriceBook(priceBook.id, businessId)));
}

export async function getProductVersionHistory(
  productId: string,
  businessId: string,
): Promise<CommercialProductVersionData[]> {
  const product = await prisma.commercialProduct.findFirst({
    where: { id: productId, businessId, deletedAt: null },
  });

  if (!product) {
    throw new Error("Commercial product not found");
  }

  const versions = await prisma.commercialProductVersion.findMany({
    where: { productId },
    orderBy: [{ versionNumber: "desc" }],
  });

  return versions.map(mapProductVersion);
}

export async function getCommercialCatalogueDashboard(
  businessId: string,
): Promise<CommercialCatalogueDashboard> {
  const [totalCategories, totalProducts, totalBundles, totalPriceBooks, activeProducts] =
    await Promise.all([
      prisma.commercialCategory.count({ where: { businessId, deletedAt: null } }),
      prisma.commercialProduct.count({ where: { businessId, deletedAt: null } }),
      prisma.commercialBundle.count({ where: { businessId, deletedAt: null } }),
      prisma.priceBook.count({ where: { businessId, deletedAt: null } }),
      prisma.commercialProduct.count({
        where: { businessId, deletedAt: null, status: "ACTIVE" },
      }),
    ]);

  return {
    totalCategories,
    totalProducts,
    totalBundles,
    totalPriceBooks,
    activeProducts,
  };
}

export { slugify };
