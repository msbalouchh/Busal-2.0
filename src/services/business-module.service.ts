import "server-only";

import type { BusinessModuleStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  getIndustryModule,
  isRegisteredIndustryModule,
  listIndustryModules,
} from "@/modules/business-modules/registry/module-registry";
import {
  serializeIndustryModuleDefinition,
  type SerializedIndustryModuleDefinition,
} from "@/modules/business-modules/types/business-module-types";

export interface BusinessModuleRecord {
  id: string;
  businessId: string;
  moduleKey: string;
  moduleName: string;
  status: BusinessModuleStatus;
  isEnabled: boolean;
  installedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  config: Record<string, unknown>;
  definition: SerializedIndustryModuleDefinition;
}

export interface BusinessModuleBundle {
  installed: BusinessModuleRecord[];
  available: SerializedIndustryModuleDefinition[];
  enabledCount: number;
  installedCount: number;
  totalModules: number;
}

function mapConfigValue(config: Prisma.JsonValue | null | undefined): Record<string, unknown> {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return {};
  }

  return config as Record<string, unknown>;
}

function serializeBusinessModule(
  record: Prisma.BusinessModuleGetPayload<{ include: { configuration: true } }>,
): BusinessModuleRecord {
  const definition = getIndustryModule(record.moduleKey);

  if (!definition) {
    throw new Error(`Unknown module key: ${record.moduleKey}`);
  }

  return {
    id: record.id,
    businessId: record.businessId,
    moduleKey: record.moduleKey,
    moduleName: record.moduleName,
    status: record.status,
    isEnabled: record.isEnabled,
    installedAt: record.installedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    config: mapConfigValue(record.configuration?.config),
    definition: serializeIndustryModuleDefinition(definition),
  };
}

export async function listInstalledBusinessModules(
  businessId: string,
): Promise<BusinessModuleRecord[]> {
  const records = await prisma.businessModule.findMany({
    where: { businessId },
    include: { configuration: true },
    orderBy: [{ isEnabled: "desc" }, { moduleName: "asc" }],
  });

  return records.map(serializeBusinessModule);
}

export async function getBusinessModuleRecord(
  businessId: string,
  moduleKey: string,
): Promise<BusinessModuleRecord | null> {
  const record = await prisma.businessModule.findUnique({
    where: {
      businessId_moduleKey: {
        businessId,
        moduleKey,
      },
    },
    include: { configuration: true },
  });

  return record ? serializeBusinessModule(record) : null;
}

export async function getBusinessModuleBundle(businessId: string): Promise<BusinessModuleBundle> {
  const installed = await listInstalledBusinessModules(businessId);
  const installedKeys = new Set(installed.map((module) => module.moduleKey));
  const available = listIndustryModules()
    .filter((definition) => !installedKeys.has(definition.moduleKey))
    .map(serializeIndustryModuleDefinition);

  return {
    installed,
    available,
    enabledCount: installed.filter((module) => module.isEnabled).length,
    installedCount: installed.length,
    totalModules: listIndustryModules().length,
  };
}

export async function installBusinessModule(
  businessId: string,
  moduleKey: string,
): Promise<BusinessModuleRecord> {
  if (!isRegisteredIndustryModule(moduleKey)) {
    throw new Error("Module not found in registry");
  }

  const definition = getIndustryModule(moduleKey);

  if (!definition) {
    throw new Error("Module not found in registry");
  }

  const existing = await prisma.businessModule.findUnique({
    where: {
      businessId_moduleKey: {
        businessId,
        moduleKey,
      },
    },
    include: { configuration: true },
  });

  if (existing) {
    return serializeBusinessModule(existing);
  }

  const created = await prisma.businessModule.create({
    data: {
      businessId,
      moduleKey,
      moduleName: definition.displayName,
      status: "INSTALLED",
      isEnabled: false,
      installedAt: new Date(),
      configuration: {
        create: {
          config: {},
        },
      },
    },
    include: { configuration: true },
  });

  return serializeBusinessModule(created);
}

export async function enableBusinessModule(
  businessId: string,
  moduleKey: string,
): Promise<BusinessModuleRecord> {
  const installed = await installBusinessModule(businessId, moduleKey);

  const updated = await prisma.businessModule.update({
    where: { id: installed.id },
    data: {
      isEnabled: true,
      status: "ENABLED",
      installedAt: installed.installedAt ?? new Date(),
    },
    include: { configuration: true },
  });

  return serializeBusinessModule(updated);
}

export async function disableBusinessModule(
  businessId: string,
  moduleKey: string,
): Promise<BusinessModuleRecord> {
  const record = await prisma.businessModule.findUnique({
    where: {
      businessId_moduleKey: {
        businessId,
        moduleKey,
      },
    },
    include: { configuration: true },
  });

  if (!record) {
    throw new Error("Module is not installed");
  }

  const updated = await prisma.businessModule.update({
    where: { id: record.id },
    data: {
      isEnabled: false,
      status: "DISABLED",
    },
    include: { configuration: true },
  });

  return serializeBusinessModule(updated);
}

export async function listEnabledModuleKeys(businessId: string): Promise<string[]> {
  const modules = await prisma.businessModule.findMany({
    where: {
      businessId,
      isEnabled: true,
    },
    select: { moduleKey: true },
    orderBy: { moduleName: "asc" },
  });

  return modules.map((module) => module.moduleKey);
}

export async function updateBusinessModuleConfiguration(
  businessId: string,
  moduleKey: string,
  config: Record<string, unknown>,
): Promise<BusinessModuleRecord> {
  const record = await prisma.businessModule.findUnique({
    where: {
      businessId_moduleKey: {
        businessId,
        moduleKey,
      },
    },
    include: { configuration: true },
  });

  if (!record) {
    throw new Error("Module is not installed");
  }

  if (!record.configuration) {
    await prisma.moduleConfiguration.create({
      data: {
        businessModuleId: record.id,
        config: config as Prisma.InputJsonValue,
      },
    });
  } else {
    await prisma.moduleConfiguration.update({
      where: { businessModuleId: record.id },
      data: { config: config as Prisma.InputJsonValue },
    });
  }

  const refreshed = await prisma.businessModule.findUniqueOrThrow({
    where: { id: record.id },
    include: { configuration: true },
  });

  return serializeBusinessModule(refreshed);
}
