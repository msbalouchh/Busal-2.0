"use client";

import type { SalesLeadStatus } from "@prisma/client";
import { Loader2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  queryCommercialLeadsAction,
  updateCommercialLeadAction,
} from "@/modules/commercial-platform/actions/commercial-platform-actions";
import { LEAD_PIPELINE_STATUSES } from "@/modules/commercial-platform/constants/commercial-platform";
import type {
  CommercialPlatformPermissions,
  LeadDirectoryResult,
} from "@/modules/commercial-platform/types/commercial-platform-types";
import { LEAD_SOURCE_LABELS, LEAD_STATUS_LABELS } from "@/modules/sales-crm/constants/routes";
import { formatSalesMoney } from "@/modules/sales-crm/utils/sales-utils";
import type { SalesLeadData } from "@/services/sales-crm.service";

interface CommercialLeadsPanelProps {
  initialDirectory: LeadDirectoryResult;
  allLeads: SalesLeadData[];
  permissions: CommercialPlatformPermissions;
}

export function CommercialLeadsPanel({
  initialDirectory,
  allLeads,
  permissions,
}: CommercialLeadsPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [view, setView] = useState<"list" | "pipeline">("pipeline");
  const [directory, setDirectory] = useState(initialDirectory);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const selectedLead = allLeads.find((lead) => lead.id === selectedLeadId) ?? null;

  const pipelineColumns = useMemo(() => {
    return LEAD_PIPELINE_STATUSES.map((columnStatus) => ({
      status: columnStatus,
      label: LEAD_STATUS_LABELS[columnStatus],
      leads: allLeads.filter((lead) => lead.status === columnStatus),
    }));
  }, [allLeads]);

  const loadDirectory = (page = directory.page) => {
    startTransition(async () => {
      try {
        const result = await queryCommercialLeadsAction({
          search: search.trim() || undefined,
          status: status ? (status as SalesLeadStatus) : undefined,
          page,
        });
        setDirectory(result.directory);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load leads");
      }
    });
  };

  const saveLeadNotes = () => {
    if (!selectedLeadId) {
      return;
    }

    startTransition(async () => {
      try {
        await updateCommercialLeadAction({
          leadId: selectedLeadId,
          notes,
        });
        toast.success("Lead notes saved");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to save lead");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={view === "pipeline" ? "default" : "outline"}
          onClick={() => setView("pipeline")}
        >
          Pipeline
        </Button>
        <Button
          type="button"
          variant={view === "list" ? "default" : "outline"}
          onClick={() => setView("list")}
        >
          List
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="lead-search">Search</Label>
          <Input
            id="lead-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Lead title, company, notes"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lead-status">Status</Label>
          <select
            id="lead-status"
            className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">All statuses</option>
            {LEAD_PIPELINE_STATUSES.map((value) => (
              <option key={value} value={value}>
                {LEAD_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <Button type="button" disabled={isPending} onClick={() => loadDirectory(1)}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply filters"}
          </Button>
        </div>
      </div>

      {view === "pipeline" ? (
        <div className="grid gap-4 xl:grid-cols-5">
          {pipelineColumns.map((column) => (
            <div key={column.status} className="rounded-lg border p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium">{column.label}</h3>
                <span className="text-muted-foreground text-xs">{column.leads.length}</span>
              </div>
              <ul className="space-y-2 text-sm">
                {column.leads.length === 0 ? (
                  <li className="text-muted-foreground text-xs">No leads</li>
                ) : (
                  column.leads.map((lead) => (
                    <li key={lead.id}>
                      <button
                        type="button"
                        className="hover:bg-muted/40 w-full rounded-md border p-3 text-left"
                        onClick={() => {
                          setSelectedLeadId(lead.id);
                          setNotes(lead.notes ?? "");
                        }}
                      >
                        <p className="font-medium">{lead.title}</p>
                        <p className="text-muted-foreground mt-1 text-xs">
                          {LEAD_SOURCE_LABELS[lead.source]} ·{" "}
                          {formatSalesMoney(lead.estimatedValuePence)}
                        </p>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left">Lead</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Source</th>
                <th className="px-4 py-3 text-left">Value</th>
              </tr>
            </thead>
            <tbody>
              {directory.items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-muted-foreground px-4 py-8 text-center">
                    No leads match your filters.
                  </td>
                </tr>
              ) : (
                directory.items.map((lead) => (
                  <tr key={lead.id} className="border-t">
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="text-left font-medium hover:underline"
                        onClick={() => {
                          setSelectedLeadId(lead.id);
                          setNotes(lead.notes ?? "");
                        }}
                      >
                        {lead.title}
                      </button>
                      <div className="text-muted-foreground text-xs">
                        {lead.companyName ?? "No company"}
                      </div>
                    </td>
                    <td className="px-4 py-3">{LEAD_STATUS_LABELS[lead.status]}</td>
                    <td className="px-4 py-3">{LEAD_SOURCE_LABELS[lead.source]}</td>
                    <td className="px-4 py-3">{formatSalesMoney(lead.estimatedValuePence)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedLead && permissions.canManageLeads ? (
        <div className="rounded-lg border p-4">
          <h2 className="mb-3 font-semibold">Lead details</h2>
          <p className="text-sm font-medium">{selectedLead.title}</p>
          <p className="text-muted-foreground mb-3 text-sm">
            {selectedLead.companyName ?? "No company"} · {LEAD_STATUS_LABELS[selectedLead.status]}
          </p>
          <div className="space-y-2">
            <Label htmlFor="lead-notes">Notes</Label>
            <textarea
              id="lead-notes"
              className="border-input bg-background min-h-24 w-full rounded-md border px-3 py-2 text-sm"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>
          <Button type="button" className="mt-3" disabled={isPending} onClick={saveLeadNotes}>
            Save notes
          </Button>
        </div>
      ) : null}
    </div>
  );
}
