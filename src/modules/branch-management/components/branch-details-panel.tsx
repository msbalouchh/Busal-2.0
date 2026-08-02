"use client";

import { Loader2, MapPin, Pencil, RotateCcw, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  archiveBranchManagementAction,
  restoreBranchManagementAction,
  setPrimaryBranchManagementAction,
} from "@/modules/branch-management/actions/branch-management-actions";
import { BranchStatusBadge } from "@/modules/branch-management/components/branch-status-badge";
import { BRANCH_MANAGEMENT_ROUTES } from "@/modules/branch-management/constants/routes";
import { FLOOR_TABLE_MANAGEMENT_ROUTES } from "@/modules/floor-table-management/constants/routes";
import { ORDER_MANAGEMENT_ROUTES } from "@/modules/order-management/constants/routes";
import { RESERVATION_MANAGEMENT_ROUTES } from "@/modules/reservation-management/constants/routes";
import type { BranchManagementContext } from "@/modules/branch-management/lib/get-branch-management-context";
import type { BranchManagementRecord } from "@/modules/branch-management/types/branch-management-types";
import { BRANCH_TYPE_OPTIONS } from "@/modules/branch-management/types/branch-management-types";

interface BranchDetailsPanelProps {
  context: Pick<BranchManagementContext, "permissionsFlags">;
  branch: BranchManagementRecord;
}

export function BranchDetailsPanel({ context, branch }: BranchDetailsPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const typeLabel =
    BRANCH_TYPE_OPTIONS.find((option) => option.value === branch.type)?.label ?? branch.type;

  const runAction = (action: () => Promise<{ success: true }>, message: string) => {
    startTransition(async () => {
      try {
        await action();
        toast.success(message);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to update branch");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {context.permissionsFlags.canUpdate ? (
          <Button asChild variant="outline">
            <Link href={BRANCH_MANAGEMENT_ROUTES.edit(branch.id)}>
              <Pencil className="h-4 w-4" />
              Edit branch
            </Link>
          </Button>
        ) : null}
        {context.permissionsFlags.canManageSettings ? (
          <Button asChild variant="outline">
            <Link href={BRANCH_MANAGEMENT_ROUTES.settings(branch.id)}>Branch settings</Link>
          </Button>
        ) : null}
        <Button asChild variant="secondary">
          <Link href={FLOOR_TABLE_MANAGEMENT_ROUTES.floorListForBranch(branch.id)}>
            Manage floors & tables
          </Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href={RESERVATION_MANAGEMENT_ROUTES.listForBranch(branch.id)}>
            Manage reservations
          </Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href={ORDER_MANAGEMENT_ROUTES.listForBranch(branch.id)}>Manage orders</Link>
        </Button>
        {context.permissionsFlags.canUpdate && !branch.isPrimary && branch.status === "ACTIVE" ? (
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() =>
              runAction(() => setPrimaryBranchManagementAction(branch.id), "Primary branch updated")
            }
          >
            <Star className="h-4 w-4" />
            Set primary
          </Button>
        ) : null}
        {context.permissionsFlags.canDelete && branch.status === "ACTIVE" && !branch.isPrimary ? (
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() =>
              runAction(() => archiveBranchManagementAction(branch.id), "Branch archived")
            }
          >
            <Trash2 className="h-4 w-4" />
            Archive
          </Button>
        ) : null}
        {context.permissionsFlags.canUpdate && branch.status === "ARCHIVED" ? (
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() =>
              runAction(() => restoreBranchManagementAction(branch.id), "Branch restored")
            }
          >
            <RotateCcw className="h-4 w-4" />
            Restore
          </Button>
        ) : null}
      </div>

      <Card className="rounded-xl shadow-sm">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle className="text-2xl tracking-tight">{branch.name}</CardTitle>
            <BranchStatusBadge status={branch.status} isPrimary={branch.isPrimary} />
          </div>
          <p className="text-muted-foreground font-mono text-sm">{branch.code}</p>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem label="Type" value={typeLabel} />
          <DetailItem label="Phone" value={branch.phone ?? "—"} />
          <DetailItem label="Email" value={branch.email ?? "—"} />
          <DetailItem label="Website" value={branch.website ?? "—"} />
          <DetailItem label="Timezone" value={branch.timezone ?? "—"} />
          <DetailItem label="Currency" value={branch.currency ?? "—"} />
          <DetailItem label="Tax number" value={branch.taxNumber ?? "—"} />
          <DetailItem
            label="Coordinates"
            value={
              branch.latitude != null && branch.longitude != null
                ? `${branch.latitude}, ${branch.longitude}`
                : "—"
            }
          />
          <DetailItem
            label="Address"
            value={
              <span className="inline-flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {[
                  branch.addressLine1,
                  branch.addressLine2,
                  branch.city,
                  branch.county,
                  branch.postcode,
                  branch.country,
                ]
                  .filter(Boolean)
                  .join(", ") || "—"}
              </span>
            }
          />
        </CardContent>
      </Card>

      {isPending ? (
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Updating branch...
        </div>
      ) : null}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-muted-foreground text-xs tracking-wide uppercase">{label}</p>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}
