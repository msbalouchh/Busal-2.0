import "server-only";

import type { Prisma, ReportType, WidgetType } from "@prisma/client";

import {
  validateAnalyticsFilters,
  validateSavedReportInput,
} from "@/modules/restaurant-analytics-management/lib/restaurant-analytics-validation";
import type {
  AnalyticsFilters,
  DashboardWidgetInput,
  DashboardWidgetRecord,
  SavedReportInput,
  SavedReportRecord,
} from "@/modules/restaurant-analytics-management/types/restaurant-analytics-types";
import { prisma } from "@/lib/prisma";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

function serializeFilters(filters: Prisma.JsonValue): AnalyticsFilters {
  const parsed = filters as unknown as AnalyticsFilters;
  return {
    branchId: parsed.branchId ?? null,
    dateRange: parsed.dateRange ?? { from: "", to: "" },
  };
}

function toSavedReportRecord(report: {
  id: string;
  businessId: string;
  name: string;
  description: string | null;
  reportType: ReportType;
  filters: Prisma.JsonValue;
  isPublic: boolean;
  createdByStaffId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): SavedReportRecord {
  return {
    id: report.id,
    businessId: report.businessId,
    name: report.name,
    description: report.description,
    reportType: report.reportType,
    filters: serializeFilters(report.filters),
    isPublic: report.isPublic,
    createdByStaffId: report.createdByStaffId,
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
  };
}

function toWidgetRecord(widget: {
  id: string;
  businessId: string;
  title: string;
  widgetType: WidgetType;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  configuration: Prisma.JsonValue;
  displayOrder: number;
}): DashboardWidgetRecord {
  return {
    id: widget.id,
    businessId: widget.businessId,
    title: widget.title,
    widgetType: widget.widgetType,
    positionX: widget.positionX,
    positionY: widget.positionY,
    width: widget.width,
    height: widget.height,
    configuration: (widget.configuration as Record<string, unknown>) ?? {},
    displayOrder: widget.displayOrder,
  };
}

async function resolveStaffIdForUser(userId: string, businessId: string): Promise<string | null> {
  const staff = await prisma.staff.findFirst({
    where: { userId, businessId, isActive: true },
    select: { id: true },
  });
  return staff?.id ?? null;
}

export async function listSavedReports(
  ownerId: string,
  staffId?: string | null,
): Promise<SavedReportRecord[]> {
  const businessId = await getOwnedBusinessId(ownerId);
  const resolvedStaffId = staffId ?? (await resolveStaffIdForUser(ownerId, businessId));

  const reports = await prisma.savedReport.findMany({
    where: resolvedStaffId
      ? {
          businessId,
          OR: [{ isPublic: true }, { createdByStaffId: resolvedStaffId }],
        }
      : { businessId },
    orderBy: { updatedAt: "desc" },
  });

  return reports.map(toSavedReportRecord);
}

export async function getSavedReport(
  ownerId: string,
  reportId: string,
  staffId?: string | null,
): Promise<SavedReportRecord> {
  const businessId = await getOwnedBusinessId(ownerId);
  const resolvedStaffId = staffId ?? (await resolveStaffIdForUser(ownerId, businessId));

  const report = await prisma.savedReport.findFirst({
    where: resolvedStaffId
      ? {
          id: reportId,
          businessId,
          OR: [{ isPublic: true }, { createdByStaffId: resolvedStaffId }],
        }
      : { id: reportId, businessId },
  });

  if (!report) throw new Error("Report not found");
  return toSavedReportRecord(report);
}

export async function createSavedReport(
  ownerId: string,
  input: SavedReportInput,
  staffId?: string | null,
): Promise<SavedReportRecord> {
  validateSavedReportInput(input);
  const businessId = await getOwnedBusinessId(ownerId);
  const resolvedStaffId = staffId ?? (await resolveStaffIdForUser(ownerId, businessId));

  const report = await prisma.savedReport.create({
    data: {
      businessId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      reportType: input.reportType,
      filters: input.filters as unknown as Prisma.InputJsonValue,
      isPublic: input.isPublic ?? false,
      createdByStaffId: resolvedStaffId ?? null,
    },
  });

  return toSavedReportRecord(report);
}

export async function updateSavedReport(
  ownerId: string,
  reportId: string,
  input: Partial<SavedReportInput>,
  staffId?: string | null,
): Promise<SavedReportRecord> {
  const businessId = await getOwnedBusinessId(ownerId);
  const resolvedStaffId = staffId ?? (await resolveStaffIdForUser(ownerId, businessId));

  const existing = await prisma.savedReport.findFirst({
    where: { id: reportId, businessId },
  });
  if (!existing) throw new Error("Report not found");
  if (
    resolvedStaffId &&
    existing.createdByStaffId &&
    existing.createdByStaffId !== resolvedStaffId
  ) {
    throw new Error("You can only edit your own reports");
  }

  if (input.filters) validateAnalyticsFilters(input.filters);
  if (input.name !== undefined && !input.name.trim()) throw new Error("Report name is required");

  const report = await prisma.savedReport.update({
    where: { id: reportId },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.description !== undefined
        ? { description: input.description?.trim() || null }
        : {}),
      ...(input.reportType !== undefined ? { reportType: input.reportType } : {}),
      ...(input.filters !== undefined
        ? { filters: input.filters as unknown as Prisma.InputJsonValue }
        : {}),
      ...(input.isPublic !== undefined ? { isPublic: input.isPublic } : {}),
    },
  });

  return toSavedReportRecord(report);
}

export async function deleteSavedReport(
  ownerId: string,
  reportId: string,
  staffId?: string | null,
): Promise<void> {
  const businessId = await getOwnedBusinessId(ownerId);
  const resolvedStaffId = staffId ?? (await resolveStaffIdForUser(ownerId, businessId));

  const existing = await prisma.savedReport.findFirst({
    where: { id: reportId, businessId },
  });
  if (!existing) throw new Error("Report not found");
  if (
    resolvedStaffId &&
    existing.createdByStaffId &&
    existing.createdByStaffId !== resolvedStaffId
  ) {
    throw new Error("You can only delete your own reports");
  }

  await prisma.savedReport.delete({ where: { id: reportId } });
}

export async function listDashboardWidgets(ownerId: string): Promise<DashboardWidgetRecord[]> {
  const businessId = await getOwnedBusinessId(ownerId);

  const widgets = await prisma.dashboardWidget.findMany({
    where: { businessId },
    orderBy: { displayOrder: "asc" },
  });

  return widgets.map(toWidgetRecord);
}

export async function upsertDashboardWidget(
  ownerId: string,
  input: DashboardWidgetInput,
  widgetId?: string,
): Promise<DashboardWidgetRecord> {
  const businessId = await getOwnedBusinessId(ownerId);

  if (widgetId) {
    const existing = await prisma.dashboardWidget.findFirst({
      where: { id: widgetId, businessId },
    });
    if (!existing) throw new Error("Widget not found");

    const widget = await prisma.dashboardWidget.update({
      where: { id: widgetId },
      data: {
        title: input.title.trim(),
        widgetType: input.widgetType,
        positionX: input.positionX ?? existing.positionX,
        positionY: input.positionY ?? existing.positionY,
        width: input.width ?? existing.width,
        height: input.height ?? existing.height,
        configuration: (input.configuration ?? existing.configuration) as Prisma.InputJsonValue,
        displayOrder: input.displayOrder ?? existing.displayOrder,
      },
    });

    return toWidgetRecord(widget);
  }

  const widget = await prisma.dashboardWidget.create({
    data: {
      businessId,
      title: input.title.trim(),
      widgetType: input.widgetType,
      positionX: input.positionX ?? 0,
      positionY: input.positionY ?? 0,
      width: input.width ?? 4,
      height: input.height ?? 2,
      configuration: (input.configuration ?? {}) as Prisma.InputJsonValue,
      displayOrder: input.displayOrder ?? 0,
    },
  });

  return toWidgetRecord(widget);
}

export async function deleteDashboardWidget(ownerId: string, widgetId: string): Promise<void> {
  const businessId = await getOwnedBusinessId(ownerId);

  const existing = await prisma.dashboardWidget.findFirst({
    where: { id: widgetId, businessId },
  });
  if (!existing) throw new Error("Widget not found");

  await prisma.dashboardWidget.delete({ where: { id: widgetId } });
}
