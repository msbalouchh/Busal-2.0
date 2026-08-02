"use client";

import { Copy, Download, Eye, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  deleteTableQrCodeAction,
  regenerateTableQrCodeAction,
  updateTableQrCodeStatusAction,
} from "@/modules/qr-ordering-management/actions/qr-ordering-actions";
import { GenerateQrDialog } from "@/modules/qr-ordering-management/components/generate-qr-dialog";
import { QrCodePreview } from "@/modules/qr-ordering-management/components/qr-code-preview";
import { QrStatusBadge } from "@/modules/qr-ordering-management/components/qr-status-badge";
import type {
  QrTableAssignmentOption,
  TableQrCodeRecord,
} from "@/modules/qr-ordering-management/types/qr-ordering-types";
import type { QrOrderingPermissions } from "@/modules/qr-ordering-management/lib/get-qr-ordering-context";

interface QrCodeListPanelProps {
  branchId: string;
  qrCodes: TableQrCodeRecord[];
  tables: QrTableAssignmentOption[];
  permissions: QrOrderingPermissions;
  onRefresh: () => void;
}

export function QrCodeListPanel({
  branchId,
  qrCodes,
  tables,
  permissions,
  onRefresh,
}: QrCodeListPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [generateOpen, setGenerateOpen] = useState(false);
  const [previewCode, setPreviewCode] = useState<TableQrCodeRecord | null>(null);

  const runAction = (action: () => Promise<unknown>, successMessage: string) => {
    startTransition(async () => {
      try {
        await action();
        toast.success(successMessage);
        onRefresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Action failed");
      }
    });
  };

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      toast.error("Unable to copy link");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Table QR codes</h2>
          <p className="text-muted-foreground text-sm">
            Generate, regenerate, and manage table QR codes for customer ordering.
          </p>
        </div>
        {permissions.canGenerate ? (
          <Button type="button" onClick={() => setGenerateOpen(true)} disabled={isPending}>
            Generate QR code
          </Button>
        ) : null}
      </div>

      <div className="relative overflow-x-auto rounded-lg border">
        {isPending ? (
          <div className="bg-background/60 absolute inset-0 z-10 flex items-center justify-center">
            <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
          </div>
        ) : null}
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="bg-muted/40 border-b text-left">
              <th className="px-4 py-3 font-medium">Table</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Last generated</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {qrCodes.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-muted-foreground px-4 py-8 text-center">
                  No QR codes yet. Generate one for a table to get started.
                </td>
              </tr>
            ) : (
              qrCodes.map((code) => (
                <tr key={code.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3 font-medium">{code.tableLabel}</td>
                  <td className="px-4 py-3">
                    <QrStatusBadge status={code.status} />
                  </td>
                  <td className="px-4 py-3">{new Date(code.lastGeneratedAt).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewCode(code)}
                        disabled={isPending}
                      >
                        <Eye className="h-4 w-4" />
                        Preview
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => copyUrl(code.qrCodeUrl)}
                        disabled={isPending}
                      >
                        <Copy className="h-4 w-4" />
                        Copy link
                      </Button>
                      {permissions.canGenerate ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            runAction(
                              () => regenerateTableQrCodeAction(branchId, code.id),
                              "QR code regenerated",
                            )
                          }
                          disabled={isPending}
                        >
                          <RefreshCw className="h-4 w-4" />
                          Regenerate
                        </Button>
                      ) : null}
                      {permissions.canUpdate && code.status === "ACTIVE" ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            runAction(
                              () => updateTableQrCodeStatusAction(branchId, code.id, "INACTIVE"),
                              "QR code deactivated",
                            )
                          }
                          disabled={isPending}
                        >
                          Deactivate
                        </Button>
                      ) : null}
                      {permissions.canUpdate && code.status !== "ACTIVE" ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            runAction(
                              () => updateTableQrCodeStatusAction(branchId, code.id, "ACTIVE"),
                              "QR code activated",
                            )
                          }
                          disabled={isPending}
                        >
                          Activate
                        </Button>
                      ) : null}
                      {permissions.canDelete ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            runAction(
                              () => deleteTableQrCodeAction(branchId, code.id),
                              "QR code deleted",
                            )
                          }
                          disabled={isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <GenerateQrDialog
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        branchId={branchId}
        tables={tables}
        onGenerated={onRefresh}
      />

      <Dialog open={Boolean(previewCode)} onOpenChange={(open) => !open && setPreviewCode(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{previewCode?.tableLabel}</DialogTitle>
            <DialogDescription>Scan this code to open the customer menu.</DialogDescription>
          </DialogHeader>
          {previewCode ? (
            <div className="flex flex-col items-center gap-4">
              <QrCodePreview value={previewCode.qrCodeUrl} size={220} />
              <p className="text-muted-foreground text-center text-xs break-all">
                {previewCode.qrCodeUrl}
              </p>
              <Button type="button" variant="outline" asChild>
                <a href={previewCode.qrCodeUrl} target="_blank" rel="noreferrer">
                  <Download className="mr-2 h-4 w-4" />
                  Open menu link
                </a>
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
