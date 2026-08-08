"use client";

import type { TenantHealthStatus, TenantLifecycleStatus } from "@prisma/client";
import {
  Archive,
  CheckSquare,
  Download,
  Eye,
  Loader2,
  PauseCircle,
  PlayCircle,
  Search,
  Square,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { PageContainer } from "@/components/common/page-container";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  bulkControlCenterBusinessAction,
  exportControlCenterBusinessesCsvAction,
  getControlCenterBusinessDetailAction,
  queryControlCenterBusinessesAction,
} from "@/modules/control-center/businesses/actions/control-center-business-actions";
import {
  BusinessStatusBadge,
  businessHealthBadgeVariant,
  businessLifecycleBadgeVariant,
} from "@/modules/control-center/businesses/components/business-status-badge";
import {
  BUSINESS_HEALTH_FILTER_OPTIONS,
  BUSINESS_PLAN_FILTER_OPTIONS,
  BUSINESS_SORT_OPTIONS,
  BUSINESS_STATUS_FILTER_OPTIONS,
  BUSINESS_TYPE_FILTER_OPTIONS,
  CONTROL_CENTER_BUSINESS_ROUTES,
} from "@/modules/control-center/businesses/constants/control-center-businesses";
import type {
  ControlCenterBusinessDirectoryItem,
  ControlCenterBusinessDirectoryResult,
  ControlCenterBusinessPermissions,
  ControlCenterBusinessProfile,
} from "@/modules/control-center/businesses/types/control-center-businesses-types";
import { ControlCenterEmptyState } from "@/modules/control-center/components/dashboard/empty-state";
import { PlatformStatCard } from "@/modules/control-center/components/dashboard/platform-stat-card";
import { SectionHeader } from "@/modules/control-center/components/dashboard/section-header";
import { TenantConfirmDialog } from "@/modules/control-center/tenants/components/tenant-confirm-dialog";

interface ControlCenterBusinessDirectoryProps {
  initialDirectory: ControlCenterBusinessDirectoryResult;
  permissions: ControlCenterBusinessPermissions;
}

type BulkAction = "suspend" | "activate" | "archive" | null;

function formatDate(value: string | null): string {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  );
}

function formatCurrency(pence: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100);
}

function formatBytes(value: string): string {
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(1)} ${units[index]}`;
}

export function ControlCenterBusinessDirectory({
  initialDirectory,
  permissions,
}: ControlCenterBusinessDirectoryProps) {
  const [isPending, startTransition] = useTransition();
  const [directory, setDirectory] = useState(initialDirectory);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [healthStatus, setHealthStatus] = useState("");
  const [subscriptionPlan, setSubscriptionPlan] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [country, setCountry] = useState("");
  const [industry, setIndustry] = useState("");
  const [sortBy, setSortBy] = useState<(typeof BUSINESS_SORT_OPTIONS)[number]>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<BulkAction>(null);
  const [drawerBusiness, setDrawerBusiness] = useState<ControlCenterBusinessProfile | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  const allSelected = useMemo(
    () => directory.items.length > 0 && selectedIds.length === directory.items.length,
    [directory.items.length, selectedIds.length],
  );

  const loadDirectory = (page = directory.page) => {
    startTransition(async () => {
      try {
        const result = await queryControlCenterBusinessesAction({
          search: search || undefined,
          status: (status as TenantLifecycleStatus) || null,
          healthStatus: (healthStatus as TenantHealthStatus) || null,
          subscriptionPlan: subscriptionPlan || null,
          businessType: businessType || null,
          country: country || null,
          industry: industry || null,
          sortBy,
          sortDirection,
          page,
        });
        setDirectory(result);
        setSelectedIds([]);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load business directory");
      }
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(directory.items.map((item) => item.businessId));
  };

  const toggleSelect = (businessId: string) => {
    setSelectedIds((current) =>
      current.includes(businessId)
        ? current.filter((id) => id !== businessId)
        : [...current, businessId],
    );
  };

  const openDrawer = (item: ControlCenterBusinessDirectoryItem) => {
    setDrawerLoading(true);
    startTransition(async () => {
      try {
        const profile = await getControlCenterBusinessDetailAction(item.businessId);
        setDrawerBusiness(profile);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load business profile");
      } finally {
        setDrawerLoading(false);
      }
    });
  };

  const runBulkAction = () => {
    if (!bulkAction || selectedIds.length === 0) {
      return;
    }

    startTransition(async () => {
      try {
        const result = await bulkControlCenterBusinessAction({
          businessIds: selectedIds,
          action: bulkAction,
        });
        toast.success(`${result.succeeded.length} businesses updated`);
        if (result.failed.length > 0) {
          toast.error(`${result.failed.length} businesses failed`);
        }
        setBulkAction(null);
        loadDirectory(directory.page);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Bulk action failed");
      }
    });
  };

  const handleExport = () => {
    startTransition(async () => {
      try {
        const csv = await exportControlCenterBusinessesCsvAction({
          search: search || undefined,
          status: (status as TenantLifecycleStatus) || null,
          healthStatus: (healthStatus as TenantHealthStatus) || null,
          subscriptionPlan: subscriptionPlan || null,
          businessType: businessType || null,
          country: country || null,
          industry: industry || null,
          sortBy,
          sortDirection,
        });
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `busal-businesses-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success("Business export downloaded");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Export failed");
      }
    });
  };

  const stats = directory.statistics;

  return (
    <PageContainer>
      <SectionHeader
        title="Business Management"
        description="Search, filter, and manage businesses across the Busal platform."
        action={
          permissions.canExport ? (
            <Button variant="outline" size="sm" onClick={handleExport} disabled={isPending}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          ) : null
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <PlatformStatCard title="Total Businesses" value={stats.totalBusinesses} />
        <PlatformStatCard title="Active" value={stats.activeBusinesses} />
        <PlatformStatCard title="Suspended" value={stats.suspendedBusinesses} />
        <PlatformStatCard title="Archived" value={stats.archivedBusinesses} />
        <PlatformStatCard title="Total Branches" value={stats.totalBranches} />
        <PlatformStatCard title="Total Staff" value={stats.totalStaff} />
        <PlatformStatCard
          title="Platform MRR"
          value={formatCurrency(stats.totalMrrPence)}
          className="xl:col-span-2"
        />
      </section>

      <div className="grid gap-4 rounded-lg border p-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-2 xl:col-span-2">
          <Label htmlFor="business-search">Search</Label>
          <div className="relative">
            <Search className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
            <Input
              id="business-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Business name, code, owner, or email"
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="business-status">Status</Label>
          <select
            id="business-status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
          >
            <option value="">All statuses</option>
            {BUSINESS_STATUS_FILTER_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="business-health">Health</Label>
          <select
            id="business-health"
            value={healthStatus}
            onChange={(event) => setHealthStatus(event.target.value)}
            className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
          >
            <option value="">All health states</option>
            {BUSINESS_HEALTH_FILTER_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="business-plan">Plan</Label>
          <select
            id="business-plan"
            value={subscriptionPlan}
            onChange={(event) => setSubscriptionPlan(event.target.value)}
            className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
          >
            <option value="">All plans</option>
            {BUSINESS_PLAN_FILTER_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="business-type">Business type</Label>
          <select
            id="business-type"
            value={businessType}
            onChange={(event) => setBusinessType(event.target.value)}
            className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
          >
            <option value="">All types</option>
            {BUSINESS_TYPE_FILTER_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="business-country">Country</Label>
          <Input
            id="business-country"
            value={country}
            onChange={(event) => setCountry(event.target.value)}
            placeholder="Country code"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="business-industry">Industry</Label>
          <Input
            id="business-industry"
            value={industry}
            onChange={(event) => setIndustry(event.target.value)}
            placeholder="Industry"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="business-sort">Sort by</Label>
          <select
            id="business-sort"
            value={sortBy}
            onChange={(event) =>
              setSortBy(event.target.value as (typeof BUSINESS_SORT_OPTIONS)[number])
            }
            className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
          >
            {BUSINESS_SORT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="business-sort-direction">Direction</Label>
          <select
            id="business-sort-direction"
            value={sortDirection}
            onChange={(event) => setSortDirection(event.target.value as "asc" | "desc")}
            className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>

        <div className="flex items-end">
          <Button onClick={() => loadDirectory(1)} disabled={isPending} className="w-full">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply filters"}
          </Button>
        </div>
      </div>

      {permissions.canEdit && selectedIds.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border p-3">
          <span className="text-muted-foreground text-sm">{selectedIds.length} selected</span>
          <Button variant="outline" size="sm" onClick={() => setBulkAction("activate")}>
            <PlayCircle className="h-4 w-4" />
            Activate
          </Button>
          <Button variant="outline" size="sm" onClick={() => setBulkAction("suspend")}>
            <PauseCircle className="h-4 w-4" />
            Suspend
          </Button>
          <Button variant="outline" size="sm" onClick={() => setBulkAction("archive")}>
            <Archive className="h-4 w-4" />
            Archive
          </Button>
        </div>
      ) : null}

      {directory.items.length === 0 ? (
        <ControlCenterEmptyState
          title="No businesses found"
          description="Adjust your filters to find businesses on the platform."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                {permissions.canEdit ? (
                  <TableHead className="w-10">
                    <button type="button" onClick={toggleSelectAll} aria-label="Select all">
                      {allSelected ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </TableHead>
                ) : null}
                <TableHead>Business</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Branches</TableHead>
                <TableHead>Staff</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>AI Usage</TableHead>
                <TableHead>Storage</TableHead>
                <TableHead>Last activity</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {directory.items.map((business) => (
                <TableRow key={business.businessId}>
                  {permissions.canEdit ? (
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(business.businessId)}
                        onChange={() => toggleSelect(business.businessId)}
                        aria-label={`Select ${business.businessName}`}
                      />
                    </TableCell>
                  ) : null}
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">{business.businessName}</p>
                      <p className="text-muted-foreground text-xs">{business.ownerEmail}</p>
                      {business.businessCode ? (
                        <p className="text-muted-foreground text-xs">{business.businessCode}</p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <BusinessStatusBadge
                        label={business.status}
                        variant={businessLifecycleBadgeVariant(business.status)}
                      />
                      <BusinessStatusBadge
                        label={business.healthStatus}
                        variant={businessHealthBadgeVariant(business.healthStatus)}
                      />
                    </div>
                  </TableCell>
                  <TableCell>{business.subscriptionPlan ?? "—"}</TableCell>
                  <TableCell>{business.branchCount}</TableCell>
                  <TableCell>{business.staffCount}</TableCell>
                  <TableCell>{formatCurrency(business.revenuePence)}</TableCell>
                  <TableCell>{business.aiTokensThisMonth.toLocaleString()}</TableCell>
                  <TableCell>{formatBytes(business.storageUsedBytes)}</TableCell>
                  <TableCell>{formatDate(business.lastActivityAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openDrawer(business)}>
                        Quick view
                      </Button>
                      <Button asChild variant="default" size="sm">
                        <Link href={CONTROL_CENTER_BUSINESS_ROUTES.detail(business.businessId)}>
                          <Eye className="h-4 w-4" />
                          Open
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          Showing {directory.items.length} of {directory.total} businesses
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={directory.page <= 1 || isPending}
            onClick={() => loadDirectory(directory.page - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={directory.page >= directory.totalPages || isPending}
            onClick={() => loadDirectory(directory.page + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      <Drawer open={Boolean(drawerBusiness) || drawerLoading} onOpenChange={() => setDrawerBusiness(null)}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>{drawerBusiness?.businessName ?? "Business profile"}</DrawerTitle>
            <DrawerDescription>
              {drawerBusiness?.owner.email ?? "Loading business details..."}
            </DrawerDescription>
          </DrawerHeader>
          {drawerLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : drawerBusiness ? (
            <div className="space-y-4 overflow-y-auto px-4 pb-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground text-xs uppercase">Status</p>
                  <p className="text-sm font-medium">{drawerBusiness.status}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase">Health</p>
                  <p className="text-sm font-medium">{drawerBusiness.healthStatus}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase">Branches / Staff</p>
                  <p className="text-sm font-medium">
                    {drawerBusiness.branchCount} / {drawerBusiness.staffCount}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase">MRR</p>
                  <p className="text-sm font-medium">
                    {formatCurrency(drawerBusiness.revenue.mrrPence)}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
          {drawerBusiness ? (
            <DrawerFooter>
              <Button asChild>
                <Link href={CONTROL_CENTER_BUSINESS_ROUTES.detail(drawerBusiness.businessId)}>
                  Open full profile
                </Link>
              </Button>
            </DrawerFooter>
          ) : null}
        </DrawerContent>
      </Drawer>

      <TenantConfirmDialog
        open={Boolean(bulkAction)}
        title={`Bulk ${bulkAction ?? ""}`}
        description={`Apply ${bulkAction} to ${selectedIds.length} selected businesses?`}
        confirmLabel={`${bulkAction ?? "Confirm"}`}
        destructive={bulkAction === "suspend" || bulkAction === "archive"}
        loading={isPending}
        onConfirm={runBulkAction}
        onOpenChange={(open) => {
          if (!open) setBulkAction(null);
        }}
      />
    </PageContainer>
  );
}
