"use client";

import type { TenantHealthStatus, TenantLifecycleStatus } from "@prisma/client";
import { Eye, Loader2, Search } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { PageContainer } from "@/components/common/page-container";
import { Button } from "@/components/ui/button";
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
import { queryControlCenterTenantsAction } from "@/modules/control-center/tenants/actions/control-center-tenant-actions";
import {
  TenantStatusBadge,
  tenantHealthBadgeVariant,
  tenantLifecycleBadgeVariant,
} from "@/modules/control-center/tenants/components/tenant-status-badge";
import { ControlCenterEmptyState } from "@/modules/control-center/components/dashboard/empty-state";
import { SectionHeader } from "@/modules/control-center/components/dashboard/section-header";
import {
  CONTROL_CENTER_TENANT_ROUTES,
  TENANT_HEALTH_FILTER_OPTIONS,
  TENANT_LIFECYCLE_FILTER_OPTIONS,
  TENANT_PLAN_FILTER_OPTIONS,
  TENANT_SORT_OPTIONS,
} from "@/modules/control-center/tenants/constants/control-center-tenants";
import type {
  ControlCenterTenantDirectoryItem,
  ControlCenterTenantDirectoryResult,
} from "@/modules/control-center/tenants/types/control-center-tenants-types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ControlCenterTenantDirectoryProps {
  initialDirectory: ControlCenterTenantDirectoryResult;
}

function formatDate(value: string | null): string {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  );
}

export function ControlCenterTenantDirectory({
  initialDirectory,
}: ControlCenterTenantDirectoryProps) {
  const [isPending, startTransition] = useTransition();
  const [directory, setDirectory] = useState(initialDirectory);
  const [search, setSearch] = useState("");
  const [lifecycleStatus, setLifecycleStatus] = useState("");
  const [healthStatus, setHealthStatus] = useState("");
  const [subscriptionPlan, setSubscriptionPlan] = useState("");
  const [country, setCountry] = useState("");
  const [sortBy, setSortBy] = useState<(typeof TENANT_SORT_OPTIONS)[number]>("createdAt");
  const [selectedTenant, setSelectedTenant] = useState<ControlCenterTenantDirectoryItem | null>(
    null,
  );

  const loadDirectory = (page = directory.page) => {
    startTransition(async () => {
      try {
        const result = await queryControlCenterTenantsAction({
          search: search || undefined,
          lifecycleStatus: (lifecycleStatus as TenantLifecycleStatus) || null,
          healthStatus: (healthStatus as TenantHealthStatus) || null,
          subscriptionPlan: subscriptionPlan || null,
          country: country || null,
          sortBy,
          page,
        });
        setDirectory(result);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load tenant directory");
      }
    });
  };

  return (
    <PageContainer>
      <SectionHeader
        title="Tenant Management"
        description="Search, filter, and manage tenants across the Busal platform."
      />

      <div className="grid gap-4 rounded-lg border p-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-2 xl:col-span-2">
          <Label htmlFor="tenant-search">Search</Label>
          <div className="relative">
            <Search className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
            <Input
              id="tenant-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Business, owner, or email"
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tenant-status">Status</Label>
          <select
            id="tenant-status"
            value={lifecycleStatus}
            onChange={(event) => setLifecycleStatus(event.target.value)}
            className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
          >
            <option value="">All statuses</option>
            {TENANT_LIFECYCLE_FILTER_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tenant-health">Health</Label>
          <select
            id="tenant-health"
            value={healthStatus}
            onChange={(event) => setHealthStatus(event.target.value)}
            className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
          >
            <option value="">All health states</option>
            {TENANT_HEALTH_FILTER_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tenant-plan">Plan</Label>
          <select
            id="tenant-plan"
            value={subscriptionPlan}
            onChange={(event) => setSubscriptionPlan(event.target.value)}
            className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
          >
            <option value="">All plans</option>
            {TENANT_PLAN_FILTER_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tenant-region">Region</Label>
          <Input
            id="tenant-region"
            value={country}
            onChange={(event) => setCountry(event.target.value)}
            placeholder="Country code"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tenant-sort">Sort by</Label>
          <select
            id="tenant-sort"
            value={sortBy}
            onChange={(event) =>
              setSortBy(event.target.value as (typeof TENANT_SORT_OPTIONS)[number])
            }
            className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
          >
            {TENANT_SORT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <Button onClick={() => loadDirectory(1)} disabled={isPending} className="w-full">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply filters"}
          </Button>
        </div>
      </div>

      {directory.items.length === 0 ? (
        <ControlCenterEmptyState
          title="No tenants found"
          description="Adjust your filters or create a tenant to populate the directory."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last activity</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {directory.items.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">{tenant.businessName}</p>
                      <p className="text-muted-foreground text-xs">{tenant.ownerEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <TenantStatusBadge
                        label={tenant.lifecycleStatus}
                        variant={tenantLifecycleBadgeVariant(tenant.lifecycleStatus)}
                      />
                      <TenantStatusBadge
                        label={tenant.healthStatus}
                        variant={tenantHealthBadgeVariant(tenant.healthStatus)}
                      />
                    </div>
                  </TableCell>
                  <TableCell>{tenant.subscriptionPlan ?? "—"}</TableCell>
                  <TableCell>{tenant.country ?? "—"}</TableCell>
                  <TableCell>{tenant.businessType ?? "—"}</TableCell>
                  <TableCell>{formatDate(tenant.createdAt)}</TableCell>
                  <TableCell>{formatDate(tenant.lastActivityAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedTenant(tenant)}>
                        Quick view
                      </Button>
                      <Button asChild variant="default" size="sm">
                        <Link href={CONTROL_CENTER_TENANT_ROUTES.detail(tenant.businessId)}>
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
          Showing {directory.items.length} of {directory.total} tenants
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

      <Dialog open={Boolean(selectedTenant)} onOpenChange={() => setSelectedTenant(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedTenant?.businessName}</DialogTitle>
          </DialogHeader>
          {selectedTenant ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground text-xs uppercase">Tenant ID</p>
                  <p className="text-sm font-medium">{selectedTenant.tenantId}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase">Business ID</p>
                  <p className="text-sm font-medium">{selectedTenant.businessId}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase">Owner</p>
                  <p className="text-sm font-medium">{selectedTenant.ownerEmail}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase">Branches / Users</p>
                  <p className="text-sm font-medium">
                    {selectedTenant.branchCount} / {selectedTenant.userCount}
                  </p>
                </div>
              </div>
              <Button asChild>
                <Link href={CONTROL_CENTER_TENANT_ROUTES.detail(selectedTenant.businessId)}>
                  Open full tenant profile
                </Link>
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
