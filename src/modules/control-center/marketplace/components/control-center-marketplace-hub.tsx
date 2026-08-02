"use client";

import { Eye, Loader2, Search } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { PageContainer } from "@/components/common/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  approveControlCenterPackageAction,
  archiveControlCenterPackageAction,
  featureControlCenterPackageAction,
  getControlCenterMarketplaceItemDetailAction,
  getControlCenterPublisherDetailAction,
  hideControlCenterPackageAction,
  queryControlCenterCatalogAction,
  queryControlCenterIssueReportsAction,
  queryControlCenterPublishersAction,
  rejectControlCenterPackageAction,
  reinstateControlCenterPublisherAction,
  removeControlCenterPackageAction,
  requestControlCenterPackageChangesAction,
  resolveControlCenterIssueReportAction,
  restoreControlCenterPackageAction,
  suspendControlCenterPackageAction,
  suspendControlCenterPublisherAction,
  updateControlCenterPackageReviewAction,
  verifyControlCenterPublisherAction,
} from "@/modules/control-center/marketplace/actions/control-center-marketplace-actions";
import {
  MarketplaceStatusBadge,
  publisherVerificationBadge,
} from "@/modules/control-center/marketplace/components/marketplace-status-badge";
import { MARKETPLACE_CATALOG_FILTER_CATEGORIES } from "@/modules/control-center/marketplace/constants/control-center-marketplace";
import type {
  ControlCenterCatalogItem,
  ControlCenterMarketplaceItemDetail,
  ControlCenterMarketplaceManagementBundle,
  ControlCenterPublisherDetail,
  ControlCenterPublisherDirectoryItem,
} from "@/modules/control-center/marketplace/types/control-center-marketplace-types";
import { ControlCenterEmptyState } from "@/modules/control-center/components/dashboard/empty-state";
import { PlatformStatCard } from "@/modules/control-center/components/dashboard/platform-stat-card";
import { RevenueCard } from "@/modules/control-center/components/dashboard/revenue-card";
import { SectionHeader } from "@/modules/control-center/components/dashboard/section-header";
import { TenantConfirmDialog } from "@/modules/control-center/tenants/components/tenant-confirm-dialog";

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(cents / 100);
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  );
}

function TrendBars({
  data,
  valueKey,
  formatValue,
}: {
  data: Array<{ month: string } & Record<string, number | string>>;
  valueKey: string;
  formatValue?: (value: number) => string;
}) {
  const values = data.map((entry) => Number(entry[valueKey] ?? 0));
  const max = Math.max(...values, 1);

  return (
    <div className="flex h-32 items-end gap-2">
      {data.map((entry) => {
        const value = Number(entry[valueKey] ?? 0);
        const height = Math.max((value / max) * 100, 4);

        return (
          <div key={entry.month} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="bg-primary/80 w-full rounded-t"
              style={{ height: `${height}%` }}
              title={formatValue ? formatValue(value) : String(value)}
            />
            <span className="text-muted-foreground text-[10px]">{entry.month.slice(5)}</span>
          </div>
        );
      })}
    </div>
  );
}

interface ControlCenterMarketplaceHubProps {
  bundle: ControlCenterMarketplaceManagementBundle;
}

export function ControlCenterMarketplaceHub({ bundle }: ControlCenterMarketplaceHubProps) {
  const [isPending, startTransition] = useTransition();
  const [catalog, setCatalog] = useState(bundle.catalog);
  const [publishers, setPublishers] = useState(bundle.publishers);
  const [issueReports, setIssueReports] = useState(bundle.issueReports);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedItem, setSelectedItem] = useState<ControlCenterCatalogItem | null>(null);
  const [itemDetail, setItemDetail] = useState<ControlCenterMarketplaceItemDetail | null>(null);
  const [selectedPublisher, setSelectedPublisher] =
    useState<ControlCenterPublisherDirectoryItem | null>(null);
  const [publisherDetail, setPublisherDetail] = useState<ControlCenterPublisherDetail | null>(null);
  const [changeNotes, setChangeNotes] = useState("");
  const [confirmAction, setConfirmAction] = useState<{
    type: "archive" | "remove" | "suspend-publisher";
    id: string;
  } | null>(null);

  const {
    widgets,
    permissions,
    recentActivity,
    pendingReviews,
    analytics,
    featuredAgents,
    licenses,
  } = bundle;

  const loadCatalog = (page = catalog.page) => {
    startTransition(async () => {
      try {
        const result = await queryControlCenterCatalogAction({
          search: search || undefined,
          category: (category || undefined) as never,
          status: (statusFilter || undefined) as never,
          page,
        });
        setCatalog(result);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load catalog");
      }
    });
  };

  const loadPublishers = () => {
    startTransition(async () => {
      try {
        const result = await queryControlCenterPublishersAction({ search: search || undefined });
        setPublishers(result);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load publishers");
      }
    });
  };

  const refreshPublishers = () => {
    loadPublishers();
  };

  const loadIssueReports = () => {
    startTransition(async () => {
      try {
        const result = await queryControlCenterIssueReportsAction({ status: "OPEN" });
        setIssueReports(result);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load reports");
      }
    });
  };

  const openItemDrawer = (item: ControlCenterCatalogItem) => {
    setSelectedItem(item);
    setItemDetail(null);
    startTransition(async () => {
      try {
        const detail = await getControlCenterMarketplaceItemDetailAction(item.id);
        setItemDetail(detail);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load package detail");
      }
    });
  };

  const openPublisherDrawer = (publisher: ControlCenterPublisherDirectoryItem) => {
    setSelectedPublisher(publisher);
    setPublisherDetail(null);
    startTransition(async () => {
      try {
        const detail = await getControlCenterPublisherDetailAction(publisher.id);
        setPublisherDetail(detail);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load publisher detail");
      }
    });
  };

  const runItemAction = async (action: () => Promise<void>, successMessage: string) => {
    startTransition(async () => {
      try {
        await action();
        toast.success(successMessage);
        loadCatalog();
        if (selectedItem) {
          openItemDrawer(selectedItem);
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Action failed");
      }
    });
  };

  const runConfirmedAction = () => {
    if (!confirmAction) return;

    startTransition(async () => {
      try {
        if (confirmAction.type === "archive") {
          await archiveControlCenterPackageAction(confirmAction.id);
          toast.success("Package archived");
        } else if (confirmAction.type === "remove") {
          await removeControlCenterPackageAction(confirmAction.id);
          toast.success("Package removed");
        } else {
          await suspendControlCenterPublisherAction(confirmAction.id);
          toast.success("Publisher suspended");
          refreshPublishers();
        }
        setConfirmAction(null);
        loadCatalog();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Action failed");
      }
    });
  };

  return (
    <PageContainer className="gap-10">
      <SectionHeader
        title="Marketplace Administration"
        description="Platform-wide marketplace catalog, publishers, reviews, licenses, and moderation."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <PlatformStatCard title="Total Apps" value={widgets.totalApps} />
        <PlatformStatCard title="AI Agents" value={widgets.totalAiAgents} />
        <PlatformStatCard title="Plugins" value={widgets.totalPlugins} />
        <PlatformStatCard title="Active Installations" value={widgets.activeInstallations} />
        <RevenueCard title="Revenue" amountPence={widgets.revenueCents} />
        <PlatformStatCard title="Downloads" value={widgets.totalDownloads} />
        <PlatformStatCard title="Avg Rating" value={widgets.averageRating.toFixed(1)} />
        <PlatformStatCard title="Pending Reviews" value={widgets.pendingReviews} />
        <PlatformStatCard title="Publishers" value={widgets.publisherCount} />
      </div>

      <section className="space-y-4">
        <SectionHeader title="Recent Activity" />
        {recentActivity.length === 0 ? (
          <ControlCenterEmptyState
            title="No recent activity"
            description="Marketplace audit logs will appear here."
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Action</th>
                  <th className="px-4 py-2 text-left">Entity</th>
                  <th className="px-4 py-2 text-left">When</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((entry) => (
                  <tr key={entry.id} className="border-t">
                    <td className="px-4 py-2 capitalize">{entry.action.replace(/_/g, " ")}</td>
                    <td className="px-4 py-2">
                      {entry.entityType} · {entry.entityId.slice(0, 8)}
                    </td>
                    <td className="px-4 py-2">{formatDate(entry.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {permissions.canManageCatalog ? (
        <section className="space-y-4">
          <SectionHeader title="Catalog Management" />
          <div className="grid gap-4 rounded-lg border p-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2 xl:col-span-2">
              <Label htmlFor="catalog-search">Search</Label>
              <div className="relative">
                <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
                <Input
                  id="catalog-search"
                  className="pl-9"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search packages or publishers"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="catalog-category">Category</Label>
              <select
                id="catalog-category"
                className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                <option value="">All categories</option>
                {MARKETPLACE_CATALOG_FILTER_CATEGORIES.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="catalog-status">Status</Label>
              <select
                id="catalog-status"
                className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="">All statuses</option>
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft</option>
                <option value="DEPRECATED">Deprecated</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
            <div className="flex items-end xl:col-span-4">
              <Button onClick={() => loadCatalog()} disabled={isPending}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Apply Filters
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Package</th>
                  <th className="px-4 py-2 text-left">Publisher</th>
                  <th className="px-4 py-2 text-left">Category</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Downloads</th>
                  <th className="px-4 py-2 text-left">Rating</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {catalog.items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8">
                      <ControlCenterEmptyState
                        title="No packages found"
                        description="Adjust filters or search terms."
                      />
                    </td>
                  </tr>
                ) : (
                  catalog.items.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="px-4 py-2">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-muted-foreground text-xs">
                          {item.featured ? "Featured · " : ""}
                          {item.adminHidden ? "Hidden · " : ""}v{item.versionLabel ?? "—"}
                        </div>
                      </td>
                      <td className="px-4 py-2">{item.publisherName}</td>
                      <td className="px-4 py-2">{item.category.replace(/_/g, " ")}</td>
                      <td className="px-4 py-2">
                        <MarketplaceStatusBadge status={item.status} />
                      </td>
                      <td className="px-4 py-2">{item.downloadCount}</td>
                      <td className="px-4 py-2">{item.averageRating.toFixed(1)}</td>
                      <td className="px-4 py-2 text-right">
                        <Button variant="ghost" size="sm" onClick={() => openItemDrawer(item)}>
                          <Eye className="mr-1 h-4 w-4" />
                          Details
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {permissions.canManageReviews ? (
        <section className="space-y-4">
          <SectionHeader title="Package Review" />
          {pendingReviews.length === 0 ? (
            <ControlCenterEmptyState
              title="No pending reviews"
              description="Draft submissions will appear here."
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-2 text-left">Package</th>
                    <th className="px-4 py-2 text-left">Publisher</th>
                    <th className="px-4 py-2 text-left">Security</th>
                    <th className="px-4 py-2 text-left">Compatibility</th>
                    <th className="px-4 py-2 text-left">Submitted</th>
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingReviews.map((review) => (
                    <tr key={review.id} className="border-t">
                      <td className="px-4 py-2">{review.name}</td>
                      <td className="px-4 py-2">{review.publisherName}</td>
                      <td className="px-4 py-2">
                        {review.securityReviewPassed ? "Passed" : "Pending"}
                      </td>
                      <td className="px-4 py-2">
                        {review.compatibilityReviewPassed ? "Passed" : "Pending"}
                      </td>
                      <td className="px-4 py-2">{formatDate(review.submittedAt)}</td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isPending}
                            onClick={() =>
                              runItemAction(
                                () =>
                                  updateControlCenterPackageReviewAction({
                                    itemId: review.id,
                                    securityReviewPassed: true,
                                  }),
                                "Security review recorded",
                              )
                            }
                          >
                            Security
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isPending}
                            onClick={() =>
                              runItemAction(
                                () =>
                                  updateControlCenterPackageReviewAction({
                                    itemId: review.id,
                                    compatibilityReviewPassed: true,
                                  }),
                                "Compatibility review recorded",
                              )
                            }
                          >
                            Compatibility
                          </Button>
                          <Button
                            size="sm"
                            disabled={isPending}
                            onClick={() =>
                              runItemAction(
                                () => approveControlCenterPackageAction(review.id),
                                "Package approved",
                              )
                            }
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={isPending}
                            onClick={() =>
                              runItemAction(
                                () => rejectControlCenterPackageAction(review.id),
                                "Package rejected",
                              )
                            }
                          >
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      {permissions.canManagePublishers ? (
        <section className="space-y-4">
          <SectionHeader title="Publisher Management" />
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Publisher</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Packages</th>
                  <th className="px-4 py-2 text-left">Revenue</th>
                  <th className="px-4 py-2 text-left">Downloads</th>
                  <th className="px-4 py-2 text-left">Rating</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {publishers.items.map((publisher) => (
                  <tr key={publisher.id} className="border-t">
                    <td className="px-4 py-2">{publisher.name}</td>
                    <td className="px-4 py-2">
                      {publisherVerificationBadge(publisher.verified, publisher.suspended)}
                    </td>
                    <td className="px-4 py-2">{publisher.publishedPackages}</td>
                    <td className="px-4 py-2">{formatCurrency(publisher.totalRevenueCents)}</td>
                    <td className="px-4 py-2">{publisher.totalDownloads}</td>
                    <td className="px-4 py-2">{publisher.averageRating.toFixed(1)}</td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openPublisherDrawer(publisher)}
                        >
                          Profile
                        </Button>
                        {!publisher.verified ? (
                          <Button
                            size="sm"
                            disabled={isPending}
                            onClick={() => {
                              startTransition(async () => {
                                try {
                                  await verifyControlCenterPublisherAction(publisher.id);
                                  toast.success("Publisher verified");
                                  refreshPublishers();
                                } catch (error) {
                                  toast.error(
                                    error instanceof Error ? error.message : "Action failed",
                                  );
                                }
                              });
                            }}
                          >
                            Verify
                          </Button>
                        ) : null}
                        {!publisher.suspended ? (
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={isPending}
                            onClick={() =>
                              setConfirmAction({ type: "suspend-publisher", id: publisher.id })
                            }
                          >
                            Suspend
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            disabled={isPending}
                            onClick={() => {
                              startTransition(async () => {
                                try {
                                  await reinstateControlCenterPublisherAction(publisher.id);
                                  toast.success("Publisher reinstated");
                                  refreshPublishers();
                                } catch (error) {
                                  toast.error(
                                    error instanceof Error ? error.message : "Action failed",
                                  );
                                }
                              });
                            }}
                          >
                            Reinstate
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {permissions.canManageLicenses ? (
        <section className="space-y-4">
          <SectionHeader title="License Management" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <PlatformStatCard title="Active" value={licenses.summary.active} />
            <PlatformStatCard title="Expired" value={licenses.summary.expired} />
            <PlatformStatCard title="Trial" value={licenses.summary.trial} />
            <PlatformStatCard title="Enterprise" value={licenses.summary.enterprise} />
            <PlatformStatCard title="Renewals Due" value={licenses.summary.renewalsDue} />
          </div>
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Tenant</th>
                  <th className="px-4 py-2 text-left">Package</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Seats</th>
                  <th className="px-4 py-2 text-left">Expires</th>
                </tr>
              </thead>
              <tbody>
                {licenses.items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8">
                      <ControlCenterEmptyState
                        title="No licenses"
                        description="Marketplace licenses will appear here."
                      />
                    </td>
                  </tr>
                ) : (
                  licenses.items.map((license) => (
                    <tr key={license.id} className="border-t">
                      <td className="px-4 py-2">{license.businessName}</td>
                      <td className="px-4 py-2">{license.itemName}</td>
                      <td className="px-4 py-2">{license.licenseType}</td>
                      <td className="px-4 py-2">
                        <MarketplaceStatusBadge status={license.status} />
                      </td>
                      <td className="px-4 py-2">
                        {license.seatsUsed}/{license.seatsTotal}
                      </td>
                      <td className="px-4 py-2">
                        {formatDate(license.expiresAt)}
                        {license.renewalDue ? " · Due" : ""}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {permissions.canViewAnalytics ? (
        <section className="space-y-4">
          <SectionHeader title="Marketplace Analytics" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Download Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <TrendBars data={analytics.downloadTrends} valueKey="downloads" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Installation Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <TrendBars data={analytics.installationTrends} valueKey="installations" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Revenue Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <TrendBars
                  data={analytics.revenueTrends}
                  valueKey="revenueCents"
                  formatValue={(value) => formatCurrency(value)}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Packages</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {analytics.topPackages.map((entry) => (
                  <div
                    key={entry.itemId}
                    className="flex justify-between border-b pb-2 last:border-0"
                  >
                    <span>{entry.name}</span>
                    <span>
                      {entry.downloads} dl · {formatCurrency(entry.revenueCents)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {analytics.categoryBreakdown.map((entry) => (
                  <div key={entry.category} className="flex justify-between">
                    <span>{entry.category.replace(/_/g, " ")}</span>
                    <span>{entry.count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Rating Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <TrendBars data={analytics.ratingTrends} valueKey="averageRating" />
              </CardContent>
            </Card>
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <SectionHeader title="AI Agent Marketplace" />
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Featured Agents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {featuredAgents.length === 0 ? (
                <p className="text-muted-foreground">No featured agents.</p>
              ) : (
                featuredAgents.map((agent) => (
                  <div key={agent.id} className="flex justify-between border-b pb-2 last:border-0">
                    <span>{agent.name}</span>
                    <span>{agent.downloadCount} installs</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Agent Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {analytics.agentPerformance.map((agent) => (
                <div
                  key={agent.itemId}
                  className="flex justify-between border-b pb-2 last:border-0"
                >
                  <span>{agent.name}</span>
                  <span>
                    {agent.installations} · {agent.averageRating.toFixed(1)}★
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      {permissions.canModerate ? (
        <section className="space-y-4">
          <SectionHeader title="Moderation" />
          {issueReports.items.length === 0 ? (
            <ControlCenterEmptyState
              title="No open reports"
              description="Abuse and issue reports will appear here."
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-2 text-left">Package</th>
                    <th className="px-4 py-2 text-left">Reporter</th>
                    <th className="px-4 py-2 text-left">Description</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {issueReports.items.map((report) => (
                    <tr key={report.id} className="border-t">
                      <td className="px-4 py-2">{report.itemName}</td>
                      <td className="px-4 py-2">{report.businessName}</td>
                      <td className="max-w-xs truncate px-4 py-2">{report.description}</td>
                      <td className="px-4 py-2">
                        <MarketplaceStatusBadge status={report.status} />
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isPending}
                            onClick={() => {
                              startTransition(async () => {
                                try {
                                  await resolveControlCenterIssueReportAction(
                                    report.id,
                                    "DISMISSED",
                                  );
                                  toast.success("Report dismissed");
                                  loadIssueReports();
                                } catch (error) {
                                  toast.error(
                                    error instanceof Error ? error.message : "Action failed",
                                  );
                                }
                              });
                            }}
                          >
                            Dismiss
                          </Button>
                          <Button
                            size="sm"
                            disabled={isPending}
                            onClick={() => {
                              startTransition(async () => {
                                try {
                                  await resolveControlCenterIssueReportAction(
                                    report.id,
                                    "RESOLVED",
                                  );
                                  toast.success("Report resolved");
                                  loadIssueReports();
                                } catch (error) {
                                  toast.error(
                                    error instanceof Error ? error.message : "Action failed",
                                  );
                                }
                              });
                            }}
                          >
                            Resolve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={isPending}
                            onClick={() =>
                              runItemAction(
                                () => suspendControlCenterPackageAction(report.itemId),
                                "Package suspended",
                              )
                            }
                          >
                            Suspend Package
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      <Drawer open={selectedItem != null} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle>{selectedItem?.name ?? "Package Detail"}</DrawerTitle>
            <DrawerDescription>
              {selectedItem?.publisherName} · {selectedItem?.category.replace(/_/g, " ")}
            </DrawerDescription>
          </DrawerHeader>
          <div className="space-y-4 overflow-y-auto px-4 pb-4">
            {itemDetail == null ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <>
                <div className="grid gap-2 text-sm sm:grid-cols-2">
                  <p>
                    Status: <MarketplaceStatusBadge status={itemDetail.item.status} />
                  </p>
                  <p>Downloads: {itemDetail.item.downloadCount}</p>
                  <p>Revenue: {formatCurrency(itemDetail.revenueCents)}</p>
                  <p>Installations: {itemDetail.installations}</p>
                  <p>Rating: {itemDetail.item.averageRating.toFixed(1)}</p>
                  <p>Reviews: {itemDetail.item.reviewCount}</p>
                </div>
                {itemDetail.versions.length > 0 ? (
                  <div>
                    <h4 className="mb-2 font-medium">Versions</h4>
                    <ul className="space-y-1 text-sm">
                      {itemDetail.versions.map((version) => (
                        <li key={version.id}>
                          v{version.versionLabel} · {version.status}
                          {version.requiresAi ? " · AI required" : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <div className="space-y-2">
                  <Label htmlFor="change-notes">Review notes</Label>
                  <Input
                    id="change-notes"
                    value={changeNotes}
                    onChange={(event) => setChangeNotes(event.target.value)}
                    placeholder="Request changes notes"
                  />
                </div>
              </>
            )}
          </div>
          {selectedItem && permissions.canManageCatalog ? (
            <DrawerFooter className="flex-row flex-wrap gap-2">
              <Button
                variant="outline"
                disabled={isPending}
                onClick={() =>
                  runItemAction(
                    () =>
                      featureControlCenterPackageAction(selectedItem.id, !selectedItem.featured),
                    selectedItem.featured ? "Unfeatured" : "Featured",
                  )
                }
              >
                {selectedItem.featured ? "Unfeature" : "Feature"}
              </Button>
              <Button
                variant="outline"
                disabled={isPending}
                onClick={() =>
                  runItemAction(
                    () =>
                      hideControlCenterPackageAction(selectedItem.id, !selectedItem.adminHidden),
                    selectedItem.adminHidden ? "Unhidden" : "Hidden",
                  )
                }
              >
                {selectedItem.adminHidden ? "Unhide" : "Hide"}
              </Button>
              <Button
                variant="outline"
                disabled={isPending}
                onClick={() => setConfirmAction({ type: "archive", id: selectedItem.id })}
              >
                Archive
              </Button>
              <Button
                variant="destructive"
                disabled={isPending}
                onClick={() => setConfirmAction({ type: "remove", id: selectedItem.id })}
              >
                Remove
              </Button>
              {selectedItem.status !== "PUBLISHED" ? (
                <Button
                  disabled={isPending}
                  onClick={() =>
                    runItemAction(
                      () => restoreControlCenterPackageAction(selectedItem.id),
                      "Package restored",
                    )
                  }
                >
                  Restore
                </Button>
              ) : null}
              {permissions.canManageReviews && changeNotes ? (
                <Button
                  variant="secondary"
                  disabled={isPending}
                  onClick={() =>
                    runItemAction(
                      () => requestControlCenterPackageChangesAction(selectedItem.id, changeNotes),
                      "Changes requested",
                    )
                  }
                >
                  Request Changes
                </Button>
              ) : null}
            </DrawerFooter>
          ) : null}
        </DrawerContent>
      </Drawer>

      <Drawer
        open={selectedPublisher != null}
        onOpenChange={(open) => !open && setSelectedPublisher(null)}
      >
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle>{selectedPublisher?.name ?? "Publisher Profile"}</DrawerTitle>
            <DrawerDescription>
              {selectedPublisher?.contactEmail ?? "No contact email"}
            </DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-4">
            {publisherDetail == null ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4 text-sm">
                <div className="grid gap-2 sm:grid-cols-2">
                  <p>Revenue: {formatCurrency(publisherDetail.revenueCents)}</p>
                  <p>Downloads: {publisherDetail.totalDownloads}</p>
                  <p>Packages: {publisherDetail.packages.length}</p>
                  <p>
                    Status:{" "}
                    {publisherVerificationBadge(
                      publisherDetail.publisher.verified,
                      publisherDetail.publisher.suspended,
                    )}
                  </p>
                </div>
                <div>
                  <h4 className="mb-2 font-medium">Published Packages</h4>
                  <ul className="space-y-1">
                    {publisherDetail.packages.map((pkg) => (
                      <li key={pkg.id}>
                        {pkg.name} · {pkg.downloadCount} downloads
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      <TenantConfirmDialog
        open={confirmAction != null}
        onOpenChange={() => setConfirmAction(null)}
        title={
          confirmAction?.type === "archive"
            ? "Archive package"
            : confirmAction?.type === "remove"
              ? "Remove package"
              : "Suspend publisher"
        }
        description="This action is audit logged and requires operator confirmation."
        confirmLabel="Confirm"
        destructive
        loading={isPending}
        onConfirm={runConfirmedAction}
      />
    </PageContainer>
  );
}
