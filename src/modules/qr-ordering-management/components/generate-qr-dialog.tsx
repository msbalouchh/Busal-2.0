"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { generateTableQrCodeAction } from "@/modules/qr-ordering-management/actions/qr-ordering-actions";
import type { QrTableAssignmentOption } from "@/modules/qr-ordering-management/types/qr-ordering-types";

interface GenerateQrDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string;
  tables: QrTableAssignmentOption[];
  onGenerated: () => void;
}

export function GenerateQrDialog({
  open,
  onOpenChange,
  branchId,
  tables,
  onGenerated,
}: GenerateQrDialogProps) {
  const [selectedTableId, setSelectedTableId] = useState("");
  const [isPending, startTransition] = useTransition();

  const unassignedTables = tables.filter((table) => !table.hasQrCode);

  const handleGenerate = () => {
    if (!selectedTableId) {
      toast.error("Select a table");
      return;
    }

    startTransition(async () => {
      try {
        await generateTableQrCodeAction(branchId, selectedTableId);
        toast.success("QR code generated");
        onGenerated();
        onOpenChange(false);
        setSelectedTableId("");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to generate QR code");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate table QR code</DialogTitle>
          <DialogDescription>
            Assign a scannable QR code to a restaurant table for customer ordering.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="qr-table-select">Table</Label>
          <select
            id="qr-table-select"
            className="border-input bg-background flex h-10 w-full rounded-md border px-3 text-sm"
            value={selectedTableId}
            onChange={(event) => setSelectedTableId(event.target.value)}
            disabled={isPending}
          >
            <option value="">Select table</option>
            {unassignedTables.map((table) => (
              <option key={table.id} value={table.id}>
                {table.label}
              </option>
            ))}
          </select>
          {unassignedTables.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              All tables already have QR codes assigned.
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleGenerate} disabled={isPending || !selectedTableId}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Generate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
