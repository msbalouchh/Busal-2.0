"use client";

import { Plus } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  activateQRCodeAction,
  createQRCodeAction,
  deactivateQRCodeAction,
  deleteQRCodeAction,
  updateQRCodeAction,
} from "@/modules/qr-menu/actions/qr-menu-actions";
import { CreateQRCodeDialog } from "@/modules/qr-menu/components/create-qr-code-dialog";
import { EditQRCodeDialog } from "@/modules/qr-menu/components/edit-qr-code-dialog";
import { QRCodeDeleteDialog } from "@/modules/qr-menu/components/qr-code-delete-dialog";
import { QRCodeFilters, QRCodeList } from "@/modules/qr-menu/components/qr-code-list";
import type { QRAssignmentFilterValue } from "@/modules/qr-menu/constants/routes";
import {
  buildCreateQRCodePayload,
  buildUpdateQRCodePayload,
  createEmptyQRCodeForm,
  qrCodeToFormState,
  type QRCodeFormState,
} from "@/modules/qr-menu/lib/qr-menu-form";
import type { ClientQRCode, ClientTableOption } from "@/modules/qr-menu/lib/qr-menu-utils";

interface QRMenuManagerProps {
  qrCodes: ClientQRCode[];
  tables: ClientTableOption[];
}

export function QRMenuManager({ qrCodes, tables }: QRMenuManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogForm, setDialogForm] = useState<QRCodeFormState>(createEmptyQRCodeForm());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterActive, setFilterActive] = useState<"" | "active" | "inactive">("");
  const [filterAssignment, setFilterAssignment] = useState<QRAssignmentFilterValue>("");
  const [deleteTarget, setDeleteTarget] = useState<ClientQRCode | null>(null);

  const hasFilters = Boolean(searchQuery.trim() || filterActive || filterAssignment);

  const filteredQRCodes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return qrCodes.filter((qrCode) => {
      if (filterActive === "active" && !qrCode.isActive) {
        return false;
      }

      if (filterActive === "inactive" && qrCode.isActive) {
        return false;
      }

      if (filterAssignment === "assigned" && !qrCode.tableId) {
        return false;
      }

      if (filterAssignment === "unassigned" && qrCode.tableId) {
        return false;
      }

      if (!query) {
        return true;
      }

      return qrCode.code.toLowerCase().includes(query) || qrCode.slug.toLowerCase().includes(query);
    });
  }, [qrCodes, searchQuery, filterActive, filterAssignment]);

  const openCreateDialog = () => {
    setDialogMode("create");
    setEditingId(null);
    setDialogForm(createEmptyQRCodeForm());
    setDialogOpen(true);
  };

  const openEditDialog = (qrCode: ClientQRCode) => {
    setDialogMode("edit");
    setEditingId(qrCode.id);
    setDialogForm(qrCodeToFormState(qrCode));
    setDialogOpen(true);
  };

  const handleFormSubmit = (form: QRCodeFormState) => {
    startTransition(async () => {
      try {
        if (editingId) {
          await updateQRCodeAction(editingId, buildUpdateQRCodePayload(form));
          toast.success("QR code updated");
        } else {
          await createQRCodeAction(buildCreateQRCodePayload(form));
          toast.success("QR code created");
        }
        setDialogOpen(false);
        setEditingId(null);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to save QR code");
      }
    });
  };

  const handleDeleteRequest = (qrCodeId: string) => {
    const qrCode = qrCodes.find((item) => item.id === qrCodeId);

    if (!qrCode) {
      return;
    }

    setDeleteTarget(qrCode);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) {
      return;
    }

    startTransition(async () => {
      try {
        await deleteQRCodeAction(deleteTarget.id);
        toast.success("QR code deleted");
        setDeleteTarget(null);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to delete QR code");
      }
    });
  };

  const handleRemoveTableAssignment = (qrCodeId: string) => {
    startTransition(async () => {
      try {
        await updateQRCodeAction(qrCodeId, { tableId: null });
        toast.success("Table assignment removed");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to remove table assignment");
      }
    });
  };

  const handleActivate = (qrCodeId: string) => {
    startTransition(async () => {
      try {
        await activateQRCodeAction(qrCodeId);
        toast.success("QR code activated");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to activate QR code");
      }
    });
  };

  const handleDeactivate = (qrCodeId: string) => {
    startTransition(async () => {
      try {
        await deactivateQRCodeAction(qrCodeId);
        toast.success("QR code deactivated");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to deactivate QR code");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button type="button" onClick={openCreateDialog} disabled={isPending}>
          <Plus className="h-4 w-4" />
          New QR code
        </Button>
      </div>

      <QRCodeFilters
        searchQuery={searchQuery}
        filterActive={filterActive}
        filterAssignment={filterAssignment}
        isPending={isPending}
        onSearchChange={setSearchQuery}
        onFilterActiveChange={setFilterActive}
        onFilterAssignmentChange={setFilterAssignment}
      />

      <QRCodeList
        qrCodes={filteredQRCodes}
        isPending={isPending}
        hasFilters={hasFilters}
        onEdit={openEditDialog}
        onDelete={handleDeleteRequest}
        onActivate={handleActivate}
        onDeactivate={handleDeactivate}
        onRemoveTableAssignment={handleRemoveTableAssignment}
        onCreate={openCreateDialog}
      />

      <QRCodeDeleteDialog
        open={Boolean(deleteTarget)}
        qrCodeLabel={deleteTarget ? `${deleteTarget.code} (${deleteTarget.slug})` : ""}
        isPending={isPending}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        onConfirm={handleDeleteConfirm}
      />

      {dialogMode === "create" ? (
        <CreateQRCodeDialog
          open={dialogOpen}
          initialForm={dialogForm}
          tables={tables}
          isPending={isPending}
          onOpenChange={setDialogOpen}
          onSubmit={handleFormSubmit}
        />
      ) : (
        <EditQRCodeDialog
          open={dialogOpen}
          initialForm={dialogForm}
          tables={tables}
          isPending={isPending}
          onOpenChange={setDialogOpen}
          onSubmit={handleFormSubmit}
        />
      )}
    </div>
  );
}
