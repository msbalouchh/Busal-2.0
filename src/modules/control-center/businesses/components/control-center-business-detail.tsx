"use client";

import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { PageContainer } from "@/components/common/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  activateControlCenterBusinessAction,
  archiveControlCenterBusinessAction,
  deleteControlCenterBusinessAction,
  suspendControlCenterBusinessAction,
  transferControlCenterBusinessOwnershipAction,
  updateControlCenterBusinessAction,
} from "@/modules/control-center/businesses/actions/control-center-business-actions";
import {
  BusinessStatusBadge,
  businessHealthBadgeVariant,
  businessLifecycleBadgeVariant,
} from "@/modules/control-center/businesses/components/business-status-badge";
import { TenantActivityTimeline } from "@/modules/control-center/tenants/components/tenant-activity-timeline";
import { TenantConfirmDialog } from "@/modules/control-center/tenants/components/tenant-confirm-dialog";
import { SectionHeader } from "@/modules/control-center/components/dashboard/section-header";
import { CONTROL_CENTER_BUSINESS_ROUTES } from "@/modules/control-center/businesses/constants/control-center-businesses";
import type { ControlCenterBusinessDetailBundle } from "@/modules/control-center/businesses/types/control-center-businesses-types";
import { TenantPlatformLists } from "@/modules/tenant-platform/components/tenant-platform-lists";

interface ControlCenterBusinessDetailProps {
  bundle: ControlCenterBusinessDetailBundle;
}

type ConfirmAction = "activate" | "suspend" | "archive" | "delete" | null;

function formatDate(value: string | null): string {
  if (!value) return "—";
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

export function ControlCenterBusinessDetail({ bundle }: ControlCenterBusinessDetailProps) {
  const { profile, permissions } = bundle;
  const [isPending, startTransition] = useTransition();
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newOwnerId, setNewOwnerId] = useState("");
  const [form, setForm] = useState({
    businessName: profile.businessName ?? "",
    businessType: profile.businessType ?? "",
    industry: profile.industry ?? "",
    country: profile.country ?? "",
    timezone: profile.timezone ?? "",
    currency: profile.currency ?? "",
    phone: profile.phone ?? "",
    businessEmail: profile.businessEmail ?? "",
  });

  const runLifecycle = (action: Exclude<ConfirmAction, null>) => {
    startTransition(async () => {
      try {
        switch (action) {
          case "activate":
            await activateControlCenterBusinessAction(profile.businessId);
            toast.success("Business activated");
            break;
          case "suspend":
            await suspendControlCenterBusinessAction(profile.businessId);
            toast.success("Business suspended");
            break;
          case "archive":
            await archiveControlCenterBusinessAction(profile.businessId);
            toast.success("Business archived");
            break;
          case "delete":
            await deleteControlCenterBusinessAction(profile.businessId);
            toast.success("Business deleted");
            break;
        }
        setConfirmAction(null);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Action failed");
      }
    });
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateControlCenterBusinessAction({
          businessId: profile.businessId,
          ...form,
        });
        toast.success("Business profile updated");
        setIsEditing(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to update business");
      }
    });
  };

  const handleTransferOwnership = () => {
    if (!newOwnerId.trim()) {
      toast.error("Enter a new owner user ID");
      return;
    }

    startTransition(async () => {
      try {
        await transferControlCenterBusinessOwnershipAction({
          businessId: profile.businessId,
          newOwnerId: newOwnerId.trim(),
        });
        toast.success("Ownership transferred");
        setNewOwnerId("");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Transfer failed");
      }
    });
  };

  return (
    <PageContainer>
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href={CONTROL_CENTER_BUSINESS_ROUTES.directory}>
            <ArrowLeft className="h-4 w-4" />
            Back to directory
          </Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          <BusinessStatusBadge
            label={profile.status}
            variant={businessLifecycleBadgeVariant(profile.status)}
          />
          <BusinessStatusBadge
            label={profile.healthStatus}
            variant={businessHealthBadgeVariant(profile.healthStatus)}
          />
        </div>
      </div>

      <SectionHeader
        title={profile.businessName ?? "Business profile"}
        description="Cross-tenant business profile, subscription, revenue, AI usage, and operational health."
        action={
          permissions.canEdit ? (
            <Button
              variant={isEditing ? "default" : "outline"}
              size="sm"
              onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isEditing ? "Save changes" : "Edit profile"}
            </Button>
          ) : null
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Branches</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{profile.branchCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Staff</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{profile.staffCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(profile.revenue.mrrPence)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">AI Tokens (month)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{profile.aiUsage.aiTokensThisMonth.toLocaleString()}</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Business Profile</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {isEditing ? (
              <>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="business-name">Business name</Label>
                  <Input
                    id="business-name"
                    value={form.businessName}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, businessName: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business-type">Business type</Label>
                  <Input
                    id="business-type"
                    value={form.businessType}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, businessType: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={form.industry}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, industry: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={form.country}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, country: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input
                    id="timezone"
                    value={form.timezone}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, timezone: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    value={form.currency}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, currency: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, phone: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="business-email">Business email</Label>
                  <Input
                    id="business-email"
                    value={form.businessEmail}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, businessEmail: event.target.value }))
                    }
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-muted-foreground text-xs uppercase">Business ID</p>
                  <p className="text-sm font-medium">{profile.businessId}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase">Business code</p>
                  <p className="text-sm font-medium">{profile.businessCode ?? "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase">Type</p>
                  <p className="text-sm font-medium">{profile.businessType ?? "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase">Industry</p>
                  <p className="text-sm font-medium">{profile.industry ?? "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase">Country</p>
                  <p className="text-sm font-medium">{profile.country ?? "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase">Timezone</p>
                  <p className="text-sm font-medium">{profile.timezone ?? "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase">Created</p>
                  <p className="text-sm font-medium">{formatDate(profile.createdAt)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase">Last activity</p>
                  <p className="text-sm font-medium">{formatDate(profile.lastActivityAt)}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Owner</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-muted-foreground text-xs uppercase">Name</p>
              <p className="text-sm font-medium">
                {profile.owner.fullName ?? profile.owner.email}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase">Email</p>
              <p className="text-sm font-medium">{profile.owner.email}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase">User ID</p>
              <p className="text-sm font-medium">{profile.owner.id}</p>
            </div>
            {permissions.canTransfer ? (
              <div className="space-y-2 border-t pt-4">
                <Label htmlFor="new-owner-id">Transfer ownership</Label>
                <div className="flex gap-2">
                  <Input
                    id="new-owner-id"
                    value={newOwnerId}
                    onChange={(event) => setNewOwnerId(event.target.value)}
                    placeholder="New owner user ID"
                  />
                  <Button
                    variant="outline"
                    onClick={handleTransferOwnership}
                    disabled={isPending}
                  >
                    Transfer
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground text-xs uppercase">Plan</p>
              <p className="text-sm font-medium">{profile.subscriptionPlan ?? "None"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase">Status</p>
              <p className="text-sm font-medium">{profile.subscriptionStatus}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Health Status</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground text-xs uppercase">Health status</p>
              <p className="text-sm font-medium">{profile.health?.healthStatus ?? profile.healthStatus}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase">Checks</p>
              <p className="text-sm font-medium">
                {profile.health?.checks?.length ?? 0} health checks
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total paid</span>
              <span>{formatCurrency(profile.revenue.paidInvoicesPence)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Outstanding</span>
              <span>{formatCurrency(profile.revenue.outstandingPence)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">MRR</span>
              <span>{formatCurrency(profile.revenue.mrrPence)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Usage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tokens (month)</span>
              <span>{profile.aiUsage.aiTokensThisMonth.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tool executions</span>
              <span>{profile.aiUsage.aiToolExecutions.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Agent executions</span>
              <span>{profile.aiUsage.aiAgentExecutions.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Storage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Used</span>
              <span>{formatBytes(profile.storage.storageUsedBytes)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Limit</span>
              <span>
                {profile.storage.maxStorageBytes
                  ? formatBytes(profile.storage.maxStorageBytes)
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Usage</span>
              <span>{profile.storage.usagePercent.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Feature Access</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-muted-foreground mb-2 text-xs uppercase">Assigned features</p>
            <div className="flex flex-wrap gap-2">
              {profile.featureAccess.assignedFeatures.length > 0 ? (
                profile.featureAccess.assignedFeatures.map((feature) => (
                  <BusinessStatusBadge key={feature} label={feature} />
                ))
              ) : (
                <p className="text-muted-foreground text-sm">No assigned features</p>
              )}
            </div>
          </div>
          <div>
            <p className="text-muted-foreground mb-2 text-xs uppercase">Enabled modules</p>
            <div className="flex flex-wrap gap-2">
              {profile.featureAccess.enabledModules.length > 0 ? (
                profile.featureAccess.enabledModules.map((moduleKey) => (
                  <BusinessStatusBadge key={moduleKey} label={moduleKey} />
                ))
              ) : (
                <p className="text-muted-foreground text-sm">No enabled modules</p>
              )}
            </div>
          </div>
          <p className="text-muted-foreground text-sm">
            {profile.featureAccess.activeFeatureFlags} active feature flags
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Branches</CardTitle>
        </CardHeader>
        <CardContent>
          {profile.branches.length === 0 ? (
            <p className="text-muted-foreground text-sm">No branches configured.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Staff</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profile.branches.map((branch) => (
                  <TableRow key={branch.id}>
                    <TableCell>
                      {branch.name}
                      {branch.isMain ? " (Main)" : ""}
                    </TableCell>
                    <TableCell>
                      {[branch.city, branch.country].filter(Boolean).join(", ") || "—"}
                    </TableCell>
                    <TableCell>{branch.staffCount}</TableCell>
                    <TableCell>{branch.isActive ? "Active" : "Inactive"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            {profile.invoices.length === 0 ? (
              <p className="text-muted-foreground text-sm">No invoices found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profile.invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>{invoice.invoiceNumber}</TableCell>
                      <TableCell>{invoice.status}</TableCell>
                      <TableCell>{formatCurrency(invoice.totalPence)}</TableCell>
                      <TableCell>{formatDate(invoice.dueAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payments</CardTitle>
          </CardHeader>
          <CardContent>
            {profile.payments.length === 0 ? (
              <p className="text-muted-foreground text-sm">No payments found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profile.payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{formatCurrency(payment.amountPence)}</TableCell>
                      <TableCell>{payment.status}</TableCell>
                      <TableCell>{payment.method}</TableCell>
                      <TableCell>{formatDate(payment.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <TenantActivityTimeline items={profile.activities} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audit Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <TenantPlatformLists auditLogs={profile.auditLogs} />
          </CardContent>
        </Card>
      </section>

      {(permissions.canEdit || permissions.canSuspend || permissions.canDelete) && (
        <section className="flex flex-wrap gap-2 rounded-lg border p-4">
          {permissions.canEdit && profile.status !== "ACTIVE" ? (
            <Button variant="outline" onClick={() => setConfirmAction("activate")}>
              Activate
            </Button>
          ) : null}
          {permissions.canSuspend && profile.status === "ACTIVE" ? (
            <Button variant="outline" onClick={() => setConfirmAction("suspend")}>
              Suspend
            </Button>
          ) : null}
          {permissions.canEdit && profile.status !== "ARCHIVED" ? (
            <Button variant="outline" onClick={() => setConfirmAction("archive")}>
              Archive
            </Button>
          ) : null}
          {permissions.canDelete ? (
            <Button variant="destructive" onClick={() => setConfirmAction("delete")}>
              Delete
            </Button>
          ) : null}
        </section>
      )}

      <TenantConfirmDialog
        open={Boolean(confirmAction)}
        title={`Confirm ${confirmAction}`}
        description={`Are you sure you want to ${confirmAction} this business?`}
        confirmLabel={confirmAction ?? "Confirm"}
        destructive={confirmAction === "suspend" || confirmAction === "delete"}
        loading={isPending}
        onConfirm={() => {
          if (confirmAction) runLifecycle(confirmAction);
        }}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null);
        }}
      />
    </PageContainer>
  );
}
