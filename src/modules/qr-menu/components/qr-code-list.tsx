"use client";

import { Loader2, Link2Off, Pencil, Power, PowerOff, Trash2 } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QR_ASSIGNMENT_FILTER_OPTIONS } from "@/modules/qr-menu/constants/routes";
import type { QRAssignmentFilterValue } from "@/modules/qr-menu/constants/routes";
import { QR_MENU_SELECT_CLASSNAME } from "@/modules/qr-menu/lib/qr-menu-form";
import {
  formatLastScanned,
  formatQRCodeStatus,
  type ClientQRCode,
} from "@/modules/qr-menu/lib/qr-menu-utils";

interface QRCodeFiltersProps {
  searchQuery: string;
  filterActive: "" | "active" | "inactive";
  filterAssignment: QRAssignmentFilterValue;
  isPending: boolean;
  onSearchChange: (value: string) => void;
  onFilterActiveChange: (value: "" | "active" | "inactive") => void;
  onFilterAssignmentChange: (value: QRAssignmentFilterValue) => void;
}

export function QRCodeFilters({
  searchQuery,
  filterActive,
  filterAssignment,
  isPending,
  onSearchChange,
  onFilterActiveChange,
  onFilterAssignmentChange,
}: QRCodeFiltersProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-4">
      <div className="space-y-2 lg:col-span-2">
        <Label htmlFor="qr-search">Search</Label>
        <Input
          id="qr-search"
          placeholder="Code or slug"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          disabled={isPending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="filter-qr-active">Active</Label>
        <select
          id="filter-qr-active"
          className={QR_MENU_SELECT_CLASSNAME}
          value={filterActive}
          onChange={(event) =>
            onFilterActiveChange(event.target.value as "" | "active" | "inactive")
          }
          disabled={isPending}
        >
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="filter-qr-assignment">Assignment</Label>
        <select
          id="filter-qr-assignment"
          className={QR_MENU_SELECT_CLASSNAME}
          value={filterAssignment}
          onChange={(event) =>
            onFilterAssignmentChange(event.target.value as QRAssignmentFilterValue)
          }
          disabled={isPending}
        >
          {QR_ASSIGNMENT_FILTER_OPTIONS.map((option) => (
            <option key={option.value || "all"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

interface QRCodeListProps {
  qrCodes: ClientQRCode[];
  isPending: boolean;
  hasFilters: boolean;
  onEdit: (qrCode: ClientQRCode) => void;
  onDelete: (qrCodeId: string) => void;
  onActivate: (qrCodeId: string) => void;
  onDeactivate: (qrCodeId: string) => void;
  onRemoveTableAssignment: (qrCodeId: string) => void;
  onCreate: () => void;
}

export function QRCodeList({
  qrCodes,
  isPending,
  hasFilters,
  onEdit,
  onDelete,
  onActivate,
  onDeactivate,
  onRemoveTableAssignment,
  onCreate,
}: QRCodeListProps) {
  if (isPending && qrCodes.length === 0) {
    return (
      <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed">
        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (qrCodes.length === 0) {
    return (
      <EmptyState
        title={hasFilters ? "No matching QR codes" : "No QR codes yet"}
        description={
          hasFilters
            ? "Try adjusting your search or filters to find QR codes."
            : "Create your first QR code to start sharing your menu."
        }
        action={
          hasFilters
            ? undefined
            : {
                label: "Create QR code",
                onClick: onCreate,
              }
        }
      />
    );
  }

  return (
    <div className="relative overflow-x-auto rounded-lg border">
      {isPending ? (
        <div className="bg-background/60 absolute inset-0 z-10 flex items-center justify-center">
          <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
        </div>
      ) : null}
      <table className="w-full min-w-[960px] text-sm">
        <thead>
          <tr className="bg-muted/40 border-b text-left">
            <th className="px-4 py-3 font-medium">Code</th>
            <th className="px-4 py-3 font-medium">Slug</th>
            <th className="px-4 py-3 font-medium">Assigned Table</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Scan Count</th>
            <th className="px-4 py-3 font-medium">Last Scanned</th>
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {qrCodes.map((qrCode) => (
            <tr key={qrCode.id} className="border-b last:border-b-0">
              <td className="px-4 py-3 font-medium">{qrCode.code}</td>
              <td className="text-muted-foreground px-4 py-3">{qrCode.slug}</td>
              <td className="px-4 py-3">{qrCode.tableName ?? "—"}</td>
              <td className="px-4 py-3">{formatQRCodeStatus(qrCode.isActive)}</td>
              <td className="px-4 py-3">{qrCode.scanCount}</td>
              <td className="px-4 py-3">{formatLastScanned(qrCode.lastScannedAt)}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(qrCode)}
                    disabled={isPending}
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                  {qrCode.isActive ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onDeactivate(qrCode.id)}
                      disabled={isPending}
                    >
                      <PowerOff className="h-4 w-4" />
                      Deactivate
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onActivate(qrCode.id)}
                      disabled={isPending}
                    >
                      <Power className="h-4 w-4" />
                      Activate
                    </Button>
                  )}
                  {qrCode.tableId ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onRemoveTableAssignment(qrCode.id)}
                      disabled={isPending}
                    >
                      <Link2Off className="h-4 w-4" />
                      Remove table
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(qrCode.id)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
