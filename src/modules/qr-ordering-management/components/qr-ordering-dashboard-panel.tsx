"use client";

import Link from "next/link";
import { Printer, QrCode } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BranchSelector } from "@/modules/branch-management/components/branch-selector";
import { QrCodeListPanel } from "@/modules/qr-ordering-management/components/qr-code-list-panel";
import { QR_ORDERING_ROUTES } from "@/modules/qr-ordering-management/constants/routes";
import type { QrOrderingContext } from "@/modules/qr-ordering-management/lib/get-qr-ordering-context";
import type {
  QrDashboardStats,
  QrTableAssignmentOption,
  TableQrCodeRecord,
} from "@/modules/qr-ordering-management/types/qr-ordering-types";

interface QrOrderingDashboardPanelProps {
  context: QrOrderingContext;
  qrCodes: TableQrCodeRecord[];
  tables: QrTableAssignmentOption[];
  stats: QrDashboardStats;
}

export function QrOrderingDashboardPanel({
  context,
  qrCodes,
  tables,
  stats,
}: QrOrderingDashboardPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const branchId = context.selectedBranchId;

  const handleBranchChange = (nextBranchId: string) => {
    startTransition(() => {
      router.push(QR_ORDERING_ROUTES.dashboardForBranch(nextBranchId));
    });
  };

  const handleRefresh = () => {
    startTransition(() => router.refresh());
  };

  const statCards = [
    { label: "Total QR codes", value: stats.totalCodes },
    { label: "Active", value: stats.activeCodes },
    { label: "Inactive", value: stats.inactiveCodes },
    { label: "Tables without QR", value: stats.tablesWithoutQr },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-xs space-y-2">
          <p className="text-sm font-medium">Branch</p>
          <BranchSelector
            branches={context.branches}
            value={branchId ?? undefined}
            onValueChange={handleBranchChange}
            placeholder="Select branch"
            disabled={isPending}
          />
        </div>
        {branchId ? (
          <Button type="button" variant="outline" asChild disabled={isPending}>
            <Link href={QR_ORDERING_ROUTES.printSheet(branchId)}>
              <Printer className="mr-2 h-4 w-4" />
              Printable sheet
            </Link>
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                <QrCode className="h-4 w-4" />
                {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {branchId ? (
        <QrCodeListPanel
          branchId={branchId}
          qrCodes={qrCodes}
          tables={tables}
          permissions={context.permissionsFlags}
          onRefresh={handleRefresh}
        />
      ) : (
        <p className="text-muted-foreground text-sm">Select a branch to manage QR codes.</p>
      )}
    </div>
  );
}
