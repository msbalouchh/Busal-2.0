"use client";

import { Printer } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { QrCodePreview } from "@/modules/qr-ordering-management/components/qr-code-preview";
import { QR_ORDERING_ROUTES } from "@/modules/qr-ordering-management/constants/routes";
import type { TableQrCodeRecord } from "@/modules/qr-ordering-management/types/qr-ordering-types";

interface QrPrintableSheetProps {
  branchId: string;
  businessName: string;
  branchName: string;
  qrCodes: TableQrCodeRecord[];
}

export function QrPrintableSheet({
  branchId,
  businessName,
  branchName,
  qrCodes,
}: QrPrintableSheetProps) {
  const activeCodes = qrCodes.filter((code) => code.status === "ACTIVE");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-semibold">Printable QR Sheet</h1>
          <p className="text-muted-foreground text-sm">
            {businessName} · {branchName}
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" asChild>
            <Link href={QR_ORDERING_ROUTES.dashboardForBranch(branchId)}>Back</Link>
          </Button>
          <Button type="button" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-2">
        {activeCodes.map((code) => (
          <div
            key={code.id}
            className="flex break-inside-avoid flex-col items-center rounded-xl border bg-white p-6 text-center"
          >
            <p className="mb-1 text-lg font-semibold">{code.tableLabel}</p>
            <p className="text-muted-foreground mb-4 text-sm">Scan to order</p>
            <QrCodePreview value={code.qrCodeUrl} size={160} />
            <p className="text-muted-foreground mt-4 text-xs break-all">{code.qrCodeUrl}</p>
          </div>
        ))}
      </div>

      {activeCodes.length === 0 ? (
        <p className="text-muted-foreground text-center text-sm">No active QR codes to print.</p>
      ) : null}
    </div>
  );
}
