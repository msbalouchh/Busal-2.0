"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedControlCenterAction } from "@/modules/control-center/guards/control-center.guards";
import { CONTROL_CENTER_MARKETPLACE_ROUTES } from "@/modules/control-center/marketplace/constants/control-center-marketplace";
import type {
  ControlCenterCatalogQuery,
  ControlCenterIssueReportQuery,
  ControlCenterLicenseQuery,
  ControlCenterPackageReviewInput,
  ControlCenterPublisherQuery,
} from "@/modules/control-center/marketplace/types/control-center-marketplace-types";
import {
  getControlCenterMarketplaceItemDetail,
  getControlCenterPublisherDetail,
  queryControlCenterCatalog,
  queryControlCenterIssueReports,
  queryControlCenterLicenses,
  queryControlCenterPublishers,
  runControlCenterApprovePackage,
  runControlCenterArchivePackage,
  runControlCenterFeaturePackage,
  runControlCenterHidePackage,
  runControlCenterRejectPackage,
  runControlCenterReinstatePublisher,
  runControlCenterRemovePackage,
  runControlCenterRequestPackageChanges,
  runControlCenterResolveIssueReport,
  runControlCenterRestorePackage,
  runControlCenterSuspendPackage,
  runControlCenterSuspendPublisher,
  runControlCenterUpdatePackageReview,
  runControlCenterVerifyPublisher,
} from "@/services/control-center-marketplace.service";

function revalidateMarketplacePages() {
  revalidatePath(CONTROL_CENTER_MARKETPLACE_ROUTES.overview);
}

export async function queryControlCenterCatalogAction(query: ControlCenterCatalogQuery) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_MARKETPLACE, async () =>
    queryControlCenterCatalog(query),
  );
}

export async function queryControlCenterPublishersAction(query: ControlCenterPublisherQuery) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_MARKETPLACE, async () =>
    queryControlCenterPublishers(query),
  );
}

export async function queryControlCenterLicensesAction(query: ControlCenterLicenseQuery) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_MARKETPLACE, async () =>
    queryControlCenterLicenses(query),
  );
}

export async function queryControlCenterIssueReportsAction(query: ControlCenterIssueReportQuery) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_MARKETPLACE, async () =>
    queryControlCenterIssueReports(query),
  );
}

export async function getControlCenterMarketplaceItemDetailAction(itemId: string) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_MARKETPLACE, async () =>
    getControlCenterMarketplaceItemDetail(itemId),
  );
}

export async function getControlCenterPublisherDetailAction(publisherId: string) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_MARKETPLACE, async () =>
    getControlCenterPublisherDetail(publisherId),
  );
}

export async function featureControlCenterPackageAction(itemId: string, featured: boolean) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_MARKETPLACE, async () => {
    await runControlCenterFeaturePackage(itemId, featured);
    revalidateMarketplacePages();
  });
}

export async function hideControlCenterPackageAction(itemId: string, hidden: boolean) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_MARKETPLACE, async () => {
    await runControlCenterHidePackage(itemId, hidden);
    revalidateMarketplacePages();
  });
}

export async function archiveControlCenterPackageAction(itemId: string) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_MARKETPLACE, async () => {
    await runControlCenterArchivePackage(itemId);
    revalidateMarketplacePages();
  });
}

export async function removeControlCenterPackageAction(itemId: string) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_MARKETPLACE, async () => {
    await runControlCenterRemovePackage(itemId);
    revalidateMarketplacePages();
  });
}

export async function restoreControlCenterPackageAction(itemId: string) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_MARKETPLACE, async () => {
    await runControlCenterRestorePackage(itemId);
    revalidateMarketplacePages();
  });
}

export async function suspendControlCenterPackageAction(itemId: string) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_MARKETPLACE, async () => {
    await runControlCenterSuspendPackage(itemId);
    revalidateMarketplacePages();
  });
}

export async function approveControlCenterPackageAction(itemId: string) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_MARKETPLACE, async () => {
    await runControlCenterApprovePackage(itemId);
    revalidateMarketplacePages();
  });
}

export async function rejectControlCenterPackageAction(itemId: string, reason?: string) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_MARKETPLACE, async () => {
    await runControlCenterRejectPackage(itemId, reason);
    revalidateMarketplacePages();
  });
}

export async function requestControlCenterPackageChangesAction(itemId: string, notes: string) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_MARKETPLACE, async () => {
    await runControlCenterRequestPackageChanges(itemId, notes);
    revalidateMarketplacePages();
  });
}

export async function updateControlCenterPackageReviewAction(
  input: ControlCenterPackageReviewInput,
) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_MARKETPLACE, async () => {
    await runControlCenterUpdatePackageReview(input);
    revalidateMarketplacePages();
  });
}

export async function verifyControlCenterPublisherAction(publisherId: string) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_MARKETPLACE, async () => {
    await runControlCenterVerifyPublisher(publisherId);
    revalidateMarketplacePages();
  });
}

export async function suspendControlCenterPublisherAction(publisherId: string) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_MARKETPLACE, async () => {
    await runControlCenterSuspendPublisher(publisherId);
    revalidateMarketplacePages();
  });
}

export async function reinstateControlCenterPublisherAction(publisherId: string) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_MARKETPLACE, async () => {
    await runControlCenterReinstatePublisher(publisherId);
    revalidateMarketplacePages();
  });
}

export async function resolveControlCenterIssueReportAction(
  reportId: string,
  status: "RESOLVED" | "DISMISSED",
) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_MARKETPLACE, async () => {
    await runControlCenterResolveIssueReport(reportId, status);
    revalidateMarketplacePages();
  });
}
