"use client";

import { LayoutGrid, List, Loader2, Search } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { PageContainer } from "@/components/common/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addControlCenterIncidentNoteAction,
  addControlCenterTicketNoteAction,
  archiveControlCenterKnowledgeArticleAction,
  assignControlCenterIncidentAction,
  closeControlCenterTicketAction,
  createControlCenterIncidentAction,
  draftControlCenterKnowledgeArticleAction,
  getControlCenterTicketDetailAction,
  publishControlCenterKnowledgeArticleAction,
  queryControlCenterKnowledgeArticlesAction,
  queryControlCenterSupportIncidentsAction,
  queryControlCenterTicketsAction,
  refreshControlCenterSupportBundleAction,
  resolveControlCenterSupportIncidentAction,
  updateControlCenterIncidentPostmortemAction,
} from "@/modules/control-center/support/actions/control-center-support-actions";
import { SupportStatusBadge } from "@/modules/control-center/support/components/support-status-badge";
import {
  SUPPORT_KANBAN_COLUMNS,
  TICKET_PRIORITY_OPTIONS,
  TICKET_STATUS_OPTIONS,
} from "@/modules/control-center/support/constants/control-center-support";
import type {
  ControlCenterIncidentItem,
  ControlCenterSupportManagementBundle,
  ControlCenterTicketDetail,
  ControlCenterTicketItem,
} from "@/modules/control-center/support/types/control-center-support-types";
import { ControlCenterEmptyState } from "@/modules/control-center/components/dashboard/empty-state";
import { PlatformStatCard } from "@/modules/control-center/components/dashboard/platform-stat-card";
import { SectionHeader } from "@/modules/control-center/components/dashboard/section-header";
import { TenantConfirmDialog } from "@/modules/control-center/tenants/components/tenant-confirm-dialog";

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  );
}

function TrendBars({
  data,
  valueKey,
}: {
  data: Array<Record<string, string | number>>;
  valueKey: string;
}) {
  const values = data.map((entry) => Number(entry[valueKey] ?? 0));
  const max = Math.max(...values, 1);

  return (
    <div className="flex h-24 items-end gap-2">
      {data.map((entry, index) => {
        const value = Number(entry[valueKey] ?? 0);
        const height = Math.max((value / max) * 100, 4);
        const label = String(entry.day ?? entry.channel ?? index);

        return (
          <div key={label} className="flex flex-1 flex-col items-center gap-1">
            <div className="bg-primary/80 w-full rounded-t" style={{ height: `${height}%` }} />
            <span className="text-muted-foreground text-[10px]">{label.slice(5)}</span>
          </div>
        );
      })}
    </div>
  );
}

interface ControlCenterSupportHubProps {
  bundle: ControlCenterSupportManagementBundle;
  defaultView?: "support" | "incidents";
}

export function ControlCenterSupportHub({
  bundle: initialBundle,
  defaultView = "support",
}: ControlCenterSupportHubProps) {
  const [isPending, startTransition] = useTransition();
  const [bundle, setBundle] = useState(initialBundle);
  const [tickets, setTickets] = useState(bundle.tickets);
  const [incidents, setIncidents] = useState(bundle.incidents);
  const [knowledge, setKnowledge] = useState(bundle.knowledge);
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<ControlCenterTicketItem | null>(null);
  const [ticketDetail, setTicketDetail] = useState<ControlCenterTicketDetail | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<ControlCenterIncidentItem | null>(null);
  const [noteText, setNoteText] = useState("");
  const [postmortemText, setPostmortemText] = useState("");
  const [newIncidentTitle, setNewIncidentTitle] = useState("");
  const [confirmCloseTicket, setConfirmCloseTicket] = useState<string | null>(null);

  const { widgets, permissions, serviceStatus, analytics, collaborationNotes, refreshedAt } =
    bundle;

  const refreshAll = () => {
    startTransition(async () => {
      try {
        const next = await refreshControlCenterSupportBundleAction();
        setBundle(next);
        setTickets(next.tickets);
        setIncidents(next.incidents);
        setKnowledge(next.knowledge);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to refresh support data");
      }
    });
  };

  const loadTickets = () => {
    startTransition(async () => {
      try {
        const result = await queryControlCenterTicketsAction({
          search: search || undefined,
          status: (statusFilter || undefined) as never,
          priority: (priorityFilter || undefined) as never,
        });
        setTickets(result);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load tickets");
      }
    });
  };

  const openTicketDrawer = (ticket: ControlCenterTicketItem) => {
    setSelectedTicket(ticket);
    setTicketDetail(null);
    startTransition(async () => {
      try {
        const detail = await getControlCenterTicketDetailAction(ticket.id);
        setTicketDetail(detail);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load ticket detail");
      }
    });
  };

  const runCloseTicket = () => {
    if (!confirmCloseTicket) return;
    startTransition(async () => {
      try {
        await closeControlCenterTicketAction(confirmCloseTicket);
        toast.success("Ticket closed");
        setConfirmCloseTicket(null);
        loadTickets();
        refreshAll();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to close ticket");
      }
    });
  };

  return (
    <PageContainer className="gap-10">
      <SectionHeader
        title={defaultView === "incidents" ? "Incident Management" : "Support & Incident Center"}
        description="Platform support tickets, customer context, incidents, service status, and knowledge base."
      />

      <p className="text-muted-foreground text-xs">Last updated {formatDate(refreshedAt)}</p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <PlatformStatCard title="Open Tickets" value={widgets.openTickets} />
        <PlatformStatCard title="Pending Tickets" value={widgets.pendingTickets} />
        <PlatformStatCard title="Escalated Tickets" value={widgets.escalatedTickets} />
        <PlatformStatCard title="Resolved Today" value={widgets.resolvedToday} />
        <PlatformStatCard title="SLA Status" value={`${widgets.slaCompliancePct}%`} />
        <PlatformStatCard title="Avg Response" value={`${widgets.avgResponseTimeMinutes}m`} />
        <PlatformStatCard title="Avg Resolution" value={`${widgets.avgResolutionTimeHours}h`} />
        <PlatformStatCard title="CSAT" value={`${widgets.customerSatisfactionPct}%`} />
        <PlatformStatCard title="Active Agents" value={widgets.activeSupportAgents} />
      </div>

      {permissions.canManageTickets ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <SectionHeader title="Ticket Management" />
            <div className="flex gap-2">
              <Button
                variant={viewMode === "table" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("table")}
              >
                <List className="mr-1 h-4 w-4" />
                Table
              </Button>
              <Button
                variant={viewMode === "kanban" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("kanban")}
              >
                <LayoutGrid className="mr-1 h-4 w-4" />
                Kanban
              </Button>
            </div>
          </div>

          <div className="grid gap-4 rounded-lg border p-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2 xl:col-span-2">
              <Label htmlFor="ticket-search">Search</Label>
              <div className="relative">
                <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
                <Input
                  id="ticket-search"
                  className="pl-9"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search tickets or tenants"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticket-status">Status</Label>
              <select
                id="ticket-status"
                className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="">All statuses</option>
                {TICKET_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticket-priority">Priority</Label>
              <select
                id="ticket-priority"
                className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value)}
              >
                <option value="">All priorities</option>
                {TICKET_PRIORITY_OPTIONS.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end xl:col-span-4">
              <Button onClick={loadTickets} disabled={isPending}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Apply Filters
              </Button>
            </div>
          </div>

          {viewMode === "kanban" ? (
            <div className="grid gap-4 overflow-x-auto lg:grid-cols-5">
              {SUPPORT_KANBAN_COLUMNS.map((column) => (
                <Card key={column.key}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{column.label}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {(tickets.kanban[column.key] ?? []).length === 0 ? (
                      <p className="text-muted-foreground text-xs">No tickets</p>
                    ) : (
                      (tickets.kanban[column.key] ?? []).map((ticket) => (
                        <button
                          key={ticket.id}
                          type="button"
                          className="hover:bg-muted w-full rounded border p-2 text-left text-sm"
                          onClick={() => openTicketDrawer(ticket)}
                        >
                          <p className="font-medium">{ticket.subject ?? "Untitled"}</p>
                          <p className="text-muted-foreground text-xs">{ticket.businessName}</p>
                        </button>
                      ))
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-2 text-left">Ticket</th>
                    <th className="px-4 py-2 text-left">Tenant</th>
                    <th className="px-4 py-2 text-left">Priority</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Category</th>
                    <th className="px-4 py-2 text-left">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8">
                        <ControlCenterEmptyState
                          title="No tickets found"
                          description="Support conversations will appear here."
                        />
                      </td>
                    </tr>
                  ) : (
                    tickets.items.map((ticket) => (
                      <tr
                        key={ticket.id}
                        className="hover:bg-muted/50 cursor-pointer border-t"
                        onClick={() => openTicketDrawer(ticket)}
                      >
                        <td className="px-4 py-2">{ticket.subject ?? "Untitled"}</td>
                        <td className="px-4 py-2">{ticket.businessName}</td>
                        <td className="px-4 py-2">
                          <SupportStatusBadge status={ticket.priority} />
                        </td>
                        <td className="px-4 py-2">
                          <SupportStatusBadge status={ticket.status} />
                        </td>
                        <td className="px-4 py-2">{ticket.category}</td>
                        <td className="px-4 py-2">{formatDate(ticket.lastMessageAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      {permissions.canManageIncidents ? (
        <section className="space-y-4">
          <SectionHeader title="Incident Management" />
          <div className="grid gap-4 rounded-lg border p-4 md:grid-cols-3">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="new-incident">Create Incident</Label>
              <Input
                id="new-incident"
                value={newIncidentTitle}
                onChange={(event) => setNewIncidentTitle(event.target.value)}
                placeholder="Incident title"
              />
            </div>
            <div className="flex items-end">
              <Button
                disabled={isPending || !newIncidentTitle.trim()}
                onClick={() => {
                  startTransition(async () => {
                    try {
                      await createControlCenterIncidentAction({
                        title: newIncidentTitle.trim(),
                        severity: "API_ERROR",
                      });
                      toast.success("Incident created");
                      setNewIncidentTitle("");
                      const next = await queryControlCenterSupportIncidentsAction({ active: true });
                      setIncidents(next);
                      refreshAll();
                    } catch (error) {
                      toast.error(
                        error instanceof Error ? error.message : "Unable to create incident",
                      );
                    }
                  });
                }}
              >
                Create Incident
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Incident</th>
                  <th className="px-4 py-2 text-left">Severity</th>
                  <th className="px-4 py-2 text-left">Impact</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Assigned</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {incidents.items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8">
                      <ControlCenterEmptyState
                        title="No incidents"
                        description="Platform incidents will appear here."
                      />
                    </td>
                  </tr>
                ) : (
                  incidents.items.map((incident) => (
                    <tr key={incident.id} className="border-t">
                      <td className="px-4 py-2">{incident.title}</td>
                      <td className="px-4 py-2">
                        <SupportStatusBadge status={incident.severity} />
                      </td>
                      <td className="px-4 py-2">{incident.impact ?? "—"}</td>
                      <td className="px-4 py-2">
                        <SupportStatusBadge status={incident.status} />
                      </td>
                      <td className="px-4 py-2">{incident.assignedStaff ?? "Unassigned"}</td>
                      <td className="px-4 py-2 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedIncident(incident)}
                        >
                          Details
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {permissions.canViewServiceStatus ? (
        <section className="space-y-4">
          <SectionHeader title="Service Status" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <PlatformStatCard
              title="Historical Uptime"
              value={`${serviceStatus.historicalUptimePct}%`}
            />
            <PlatformStatCard title="Ongoing Incidents" value={serviceStatus.ongoingIncidents} />
            <PlatformStatCard
              title="Scheduled Maintenance"
              value={serviceStatus.scheduledMaintenance.length}
            />
          </div>
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Service</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Availability</th>
                  <th className="px-4 py-2 text-left">Incidents</th>
                </tr>
              </thead>
              <tbody>
                {serviceStatus.services.map((service) => (
                  <tr key={service.name} className="border-t">
                    <td className="px-4 py-2">{service.name}</td>
                    <td className="px-4 py-2">
                      <SupportStatusBadge status={service.status} />
                    </td>
                    <td className="px-4 py-2">{service.availabilityPct}%</td>
                    <td className="px-4 py-2">{service.ongoingIncidents}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <SectionHeader title="Internal Communication" />
        {collaborationNotes.length === 0 ? (
          <ControlCenterEmptyState
            title="No collaboration notes"
            description="Incident notes and escalations will appear here."
          />
        ) : (
          <div className="space-y-2">
            {collaborationNotes.map((note) => (
              <Card key={note.id}>
                <CardContent className="space-y-1 pt-4 text-sm">
                  <p className="font-medium">{note.author}</p>
                  <p>{note.body}</p>
                  <p className="text-muted-foreground text-xs">{formatDate(note.createdAt)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {permissions.canManageKnowledge ? (
        <section className="space-y-4">
          <SectionHeader title="Knowledge Base" />
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Article</th>
                  <th className="px-4 py-2 text-left">Category</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Related</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {knowledge.items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8">
                      <ControlCenterEmptyState
                        title="No articles"
                        description="Knowledge base articles will appear here."
                      />
                    </td>
                  </tr>
                ) : (
                  knowledge.items.map((article) => (
                    <tr key={article.id} className="border-t">
                      <td className="px-4 py-2">{article.title}</td>
                      <td className="px-4 py-2">{article.category}</td>
                      <td className="px-4 py-2">
                        <SupportStatusBadge status={article.status} />
                      </td>
                      <td className="px-4 py-2">{article.relatedCount}</td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex justify-end gap-2">
                          {article.status !== "PUBLISHED" ? (
                            <Button
                              size="sm"
                              disabled={isPending}
                              onClick={() => {
                                startTransition(async () => {
                                  try {
                                    await publishControlCenterKnowledgeArticleAction(article.id);
                                    toast.success("Article published");
                                    const next = await queryControlCenterKnowledgeArticlesAction(
                                      {},
                                    );
                                    setKnowledge(next);
                                  } catch (error) {
                                    toast.error(
                                      error instanceof Error ? error.message : "Action failed",
                                    );
                                  }
                                });
                              }}
                            >
                              Publish
                            </Button>
                          ) : null}
                          {article.status !== "ARCHIVED" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isPending}
                              onClick={() => {
                                startTransition(async () => {
                                  try {
                                    await archiveControlCenterKnowledgeArticleAction(article.id);
                                    toast.success("Article archived");
                                    const next = await queryControlCenterKnowledgeArticlesAction(
                                      {},
                                    );
                                    setKnowledge(next);
                                  } catch (error) {
                                    toast.error(
                                      error instanceof Error ? error.message : "Action failed",
                                    );
                                  }
                                });
                              }}
                            >
                              Archive
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isPending}
                              onClick={() => {
                                startTransition(async () => {
                                  try {
                                    await draftControlCenterKnowledgeArticleAction(article.id);
                                    toast.success("Article moved to draft");
                                    const next = await queryControlCenterKnowledgeArticlesAction(
                                      {},
                                    );
                                    setKnowledge(next);
                                  } catch (error) {
                                    toast.error(
                                      error instanceof Error ? error.message : "Action failed",
                                    );
                                  }
                                });
                              }}
                            >
                              Draft
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {permissions.canViewAnalytics ? (
        <section className="space-y-4">
          <SectionHeader title="Support Analytics" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ticket Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <TrendBars data={analytics.ticketTrends} valueKey="opened" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">SLA Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>Compliance: {analytics.slaPerformance.compliancePct}%</p>
                <p>Met: {analytics.slaPerformance.met}</p>
                <p>Breached: {analytics.slaPerformance.breached}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Support Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <TrendBars data={analytics.supportVolume} valueKey="count" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Agent Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {analytics.agentPerformance.map((agent) => (
                  <div
                    key={agent.agent}
                    className="flex justify-between border-b pb-2 last:border-0"
                  >
                    <span>{agent.agent}</span>
                    <span>
                      {agent.resolved} resolved · {agent.avgResponseMinutes}m
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Customer Satisfaction</CardTitle>
              </CardHeader>
              <CardContent>
                <TrendBars data={analytics.satisfactionTrend} valueKey="score" />
              </CardContent>
            </Card>
          </div>
        </section>
      ) : null}

      <Drawer
        open={selectedTicket != null}
        onOpenChange={(open) => !open && setSelectedTicket(null)}
      >
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle>{selectedTicket?.subject ?? "Ticket Detail"}</DrawerTitle>
            <DrawerDescription>{selectedTicket?.businessName}</DrawerDescription>
          </DrawerHeader>
          <div className="space-y-4 overflow-y-auto px-4 pb-4">
            {ticketDetail == null ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <>
                <div className="grid gap-2 text-sm sm:grid-cols-2">
                  <p>
                    Status: <SupportStatusBadge status={ticketDetail.ticket.status} />
                  </p>
                  <p>
                    Priority: <SupportStatusBadge status={ticketDetail.ticket.priority} />
                  </p>
                  <p>Category: {ticketDetail.ticket.category}</p>
                  <p>Channel: {ticketDetail.ticket.sourceChannel}</p>
                </div>

                {ticketDetail.customerContext ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Customer Support</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p>Owner: {ticketDetail.customerContext.ownerEmail}</p>
                      <p>Plan: {ticketDetail.customerContext.subscriptionPlan ?? "—"}</p>
                      <p>Status: {ticketDetail.customerContext.subscriptionStatus ?? "—"}</p>
                      <p>System: {ticketDetail.customerContext.systemStatus}</p>
                      <p>
                        Usage: {ticketDetail.customerContext.usageSummary.activeUsers} users ·{" "}
                        {ticketDetail.customerContext.usageSummary.apiCallsThisMonth} API calls
                      </p>
                    </CardContent>
                  </Card>
                ) : null}

                <div>
                  <h4 className="mb-2 font-medium">Timeline</h4>
                  <ul className="space-y-2 text-sm">
                    {ticketDetail.timeline.map((entry) => (
                      <li key={entry.id} className="border-l-2 pl-3">
                        <p className="text-muted-foreground text-xs">
                          {formatDate(entry.createdAt)} · {entry.senderType}
                          {entry.isInternal ? " · Internal" : ""}
                        </p>
                        <p>{entry.body}</p>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ticket-note">Internal note</Label>
                  <Input
                    id="ticket-note"
                    value={noteText}
                    onChange={(event) => setNoteText(event.target.value)}
                    placeholder="Add internal note"
                  />
                </div>
              </>
            )}
          </div>
          {selectedTicket && ticketDetail ? (
            <DrawerFooter className="flex-row flex-wrap gap-2">
              {noteText ? (
                <Button
                  variant="outline"
                  disabled={isPending}
                  onClick={() => {
                    startTransition(async () => {
                      try {
                        await addControlCenterTicketNoteAction(selectedTicket.id, noteText);
                        toast.success("Note added");
                        setNoteText("");
                        openTicketDrawer(selectedTicket);
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : "Action failed");
                      }
                    });
                  }}
                >
                  Add Note
                </Button>
              ) : null}
              {selectedTicket.status !== "CLOSED" ? (
                <Button
                  variant="destructive"
                  disabled={isPending}
                  onClick={() => setConfirmCloseTicket(selectedTicket.id)}
                >
                  Close Ticket
                </Button>
              ) : null}
            </DrawerFooter>
          ) : null}
        </DrawerContent>
      </Drawer>

      <Drawer
        open={selectedIncident != null}
        onOpenChange={(open) => !open && setSelectedIncident(null)}
      >
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle>{selectedIncident?.title ?? "Incident Detail"}</DrawerTitle>
            <DrawerDescription>{selectedIncident?.severity.replace(/_/g, " ")}</DrawerDescription>
          </DrawerHeader>
          <div className="space-y-4 overflow-y-auto px-4 pb-4 text-sm">
            <div className="grid gap-2 sm:grid-cols-2">
              <p>
                Status:{" "}
                {selectedIncident ? <SupportStatusBadge status={selectedIncident.status} /> : null}
              </p>
              <p>Impact: {selectedIncident?.impact ?? "—"}</p>
              <p>Root cause: {selectedIncident?.rootCause ?? "—"}</p>
              <p>Assigned: {selectedIncident?.assignedStaff ?? "Unassigned"}</p>
            </div>
            <div>
              <h4 className="mb-2 font-medium">Timeline</h4>
              <ul className="space-y-2">
                {selectedIncident?.timeline.map((entry, index) => (
                  <li key={`${entry.at}-${index}`} className="border-l-2 pl-3">
                    <p className="text-muted-foreground text-xs">{formatDate(entry.at)}</p>
                    <p>{entry.event}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-2">
              <Label htmlFor="incident-note">Collaboration note</Label>
              <Input
                id="incident-note"
                value={noteText}
                onChange={(event) => setNoteText(event.target.value)}
                placeholder="Add incident note"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postmortem">Postmortem</Label>
              <Input
                id="postmortem"
                value={postmortemText}
                onChange={(event) => setPostmortemText(event.target.value)}
                placeholder="Postmortem summary"
              />
            </div>
          </div>
          {selectedIncident && selectedIncident.status !== "RESOLVED" ? (
            <DrawerFooter className="flex-row flex-wrap gap-2">
              {noteText ? (
                <Button
                  variant="outline"
                  disabled={isPending}
                  onClick={() => {
                    startTransition(async () => {
                      try {
                        await addControlCenterIncidentNoteAction(selectedIncident.id, noteText);
                        toast.success("Note added");
                        setNoteText("");
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : "Action failed");
                      }
                    });
                  }}
                >
                  Add Note
                </Button>
              ) : null}
              <Button
                variant="outline"
                disabled={isPending}
                onClick={() => {
                  startTransition(async () => {
                    try {
                      await assignControlCenterIncidentAction({
                        incidentId: selectedIncident.id,
                        assignedStaff: "Support Team",
                      });
                      toast.success("Incident assigned");
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Action failed");
                    }
                  });
                }}
              >
                Assign
              </Button>
              {postmortemText ? (
                <Button
                  variant="secondary"
                  disabled={isPending}
                  onClick={() => {
                    startTransition(async () => {
                      try {
                        await updateControlCenterIncidentPostmortemAction({
                          incidentId: selectedIncident.id,
                          postmortem: postmortemText,
                        });
                        toast.success("Postmortem saved");
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : "Action failed");
                      }
                    });
                  }}
                >
                  Save Postmortem
                </Button>
              ) : null}
              <Button
                disabled={isPending}
                onClick={() => {
                  startTransition(async () => {
                    try {
                      await resolveControlCenterSupportIncidentAction(selectedIncident.id);
                      toast.success("Incident resolved");
                      setSelectedIncident(null);
                      refreshAll();
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Action failed");
                    }
                  });
                }}
              >
                Resolve
              </Button>
            </DrawerFooter>
          ) : null}
        </DrawerContent>
      </Drawer>

      <TenantConfirmDialog
        open={confirmCloseTicket != null}
        onOpenChange={() => setConfirmCloseTicket(null)}
        title="Close ticket"
        description="This will close the support ticket for the tenant."
        confirmLabel="Close ticket"
        destructive
        loading={isPending}
        onConfirm={runCloseTicket}
      />
    </PageContainer>
  );
}
