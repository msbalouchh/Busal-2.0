"use client";

import { Plus } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  createTableAction,
  deleteTableAction,
  updateTableAction,
  updateTableStatusAction,
} from "@/modules/tables/actions/table-actions";
import {
  buildCreateTablePayload,
  buildUpdateTablePayload,
  TableFormDialog,
} from "@/modules/tables/components/table-form-dialog";
import { TableFilters, TableList } from "@/modules/tables/components/table-list";
import type { TableSortValue, TableStatusValue } from "@/modules/tables/constants/routes";
import {
  createEmptyTableForm,
  tableToFormState,
  type TableFormState,
} from "@/modules/tables/lib/table-form";
import {
  formatTableStatusLabel,
  getUniqueSections,
  type ClientTable,
} from "@/modules/tables/lib/table-utils";

interface TablesManagerProps {
  tables: ClientTable[];
}

export function TablesManager({ tables }: TablesManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogForm, setDialogForm] = useState<TableFormState>(createEmptyTableForm());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<TableStatusValue | "">("");
  const [filterSection, setFilterSection] = useState("");
  const [filterActive, setFilterActive] = useState<"" | "active" | "inactive">("");
  const [sortBy, setSortBy] = useState<TableSortValue>("name");

  const sections = useMemo(() => getUniqueSections(tables), [tables]);

  const hasFilters = Boolean(searchQuery.trim() || filterStatus || filterSection || filterActive);

  const filteredTables = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = tables.filter((table) => {
      if (filterStatus && table.status !== filterStatus) {
        return false;
      }

      if (filterSection && table.section !== filterSection) {
        return false;
      }

      if (filterActive === "active" && !table.isActive) {
        return false;
      }

      if (filterActive === "inactive" && table.isActive) {
        return false;
      }

      if (!query) {
        return true;
      }

      return table.name.toLowerCase().includes(query);
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "section") {
        const sectionCompare = (a.section ?? "").localeCompare(b.section ?? "");
        if (sectionCompare !== 0) {
          return sectionCompare;
        }
        return a.name.localeCompare(b.name);
      }

      if (sortBy === "capacity") {
        const capacityCompare = a.capacity - b.capacity;
        if (capacityCompare !== 0) {
          return capacityCompare;
        }
        return a.name.localeCompare(b.name);
      }

      return a.name.localeCompare(b.name);
    });
  }, [tables, searchQuery, filterStatus, filterSection, filterActive, sortBy]);

  const openCreateDialog = () => {
    setDialogMode("create");
    setEditingId(null);
    setDialogForm(createEmptyTableForm());
    setDialogOpen(true);
  };

  const openEditDialog = (table: ClientTable) => {
    setDialogMode("edit");
    setEditingId(table.id);
    setDialogForm(tableToFormState(table));
    setDialogOpen(true);
  };

  const handleFormSubmit = (form: TableFormState) => {
    startTransition(async () => {
      try {
        if (editingId) {
          await updateTableAction(editingId, buildUpdateTablePayload(form), form.status);
          toast.success("Table updated");
        } else {
          await createTableAction(buildCreateTablePayload(form), form.status);
          toast.success("Table created");
        }
        setDialogOpen(false);
        setEditingId(null);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to save table");
      }
    });
  };

  const handleDelete = (tableId: string) => {
    if (!window.confirm("Delete this table? This action cannot be undone.")) {
      return;
    }

    startTransition(async () => {
      try {
        await deleteTableAction(tableId);
        toast.success("Table deleted");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to delete table");
      }
    });
  };

  const handleStatusChange = (tableId: string, status: TableFormState["status"]) => {
    startTransition(async () => {
      try {
        await updateTableStatusAction(tableId, status);
        toast.success(`Status updated to ${formatTableStatusLabel(status)}`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to update status");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button type="button" onClick={openCreateDialog} disabled={isPending}>
          <Plus className="h-4 w-4" />
          New table
        </Button>
      </div>

      <TableFilters
        searchQuery={searchQuery}
        filterStatus={filterStatus}
        filterSection={filterSection}
        filterActive={filterActive}
        sortBy={sortBy}
        sections={sections}
        isPending={isPending}
        onSearchChange={setSearchQuery}
        onFilterStatusChange={setFilterStatus}
        onFilterSectionChange={setFilterSection}
        onFilterActiveChange={setFilterActive}
        onSortChange={setSortBy}
      />

      <TableList
        tables={filteredTables}
        isPending={isPending}
        hasFilters={hasFilters}
        onEdit={openEditDialog}
        onDelete={handleDelete}
        onStatusChange={handleStatusChange}
        onCreate={openCreateDialog}
      />

      <TableFormDialog
        open={dialogOpen}
        mode={dialogMode}
        initialForm={dialogForm}
        isPending={isPending}
        onOpenChange={setDialogOpen}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}
