"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  sendOwnerAiOperationsMessageAction,
} from "@/modules/customer-ai/actions/ai-operations-actions";
import { CUSTOMER_AI_ROUTES } from "@/modules/customer-ai/constants/customer-ai.constants";
import type { AiOperationsCapabilities } from "@/modules/customer-ai/types/customer-ai.types";
import type { BusinessRevenueSnapshot } from "@/modules/customer-ai/services/revenue-aggregation.service";

interface AiOperationsPanelProps {
  overview: {
    aiConversationsToday: number;
    escalationsToday: number;
    aiActionsToday: number;
    ordersToday: number | null;
    reservationsToday: number | null;
    revenueToday: number | null;
    revenueAvailable: boolean;
    revenueSnapshot?: BusinessRevenueSnapshot;
  };
  actions: Array<{
    id: string;
    toolId: string;
    audience: string;
    success: boolean;
    executionStatus: string;
    channel: string;
    createdAt: string;
  }>;
  capabilities: AiOperationsCapabilities;
  tools: Array<{
    toolId: string;
    name: string;
    riskLevel: string;
    audience: string;
    permission: string;
  }>;
  pendingConfirmations: Array<{
    actionId: string;
    toolId: string;
    status: string;
    expiresAt: string;
    channel: string;
  }>;
  expiredConfirmations: Array<{
    actionId: string;
    toolId: string;
    expiresAt: string;
  }>;
  canManage: boolean;
}

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function AiOperationsPanel({
  overview,
  actions,
  capabilities,
  tools,
  pendingConfirmations,
  expiredConfirmations,
  canManage,
}: AiOperationsPanelProps) {
  const [message, setMessage] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [reply, setReply] = useState<string | null>(null);
  const [chatPendingConfirmations, setChatPendingConfirmations] = useState<
    Array<{ actionId: string; description: string }>
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const revenueSnapshot = overview.revenueSnapshot;
  const currency = revenueSnapshot?.currency ?? "GBP";

  const handleSend = (confirmedActions?: string[]) => {
    if (!message.trim() && !confirmedActions?.length) return;
    setError(null);
    startTransition(async () => {
      try {
        const result = await sendOwnerAiOperationsMessageAction({
          message: message.trim() || "Yes, confirm.",
          conversationId,
          confirmedActions,
        });
        setReply(result.content);
        setConversationId(result.conversationId);
        setChatPendingConfirmations(result.requiresConfirmation ?? []);
        setMessage("");
      } catch (sendError) {
        setError(sendError instanceof Error ? sendError.message : "Failed to send message");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-sm">
          Business operational overview — real data only, tenant-isolated.
        </p>
        {canManage ? (
          <Link
            href={CUSTOMER_AI_ROUTES.controlCenter}
            className="text-primary text-sm underline"
          >
            Configure operations capabilities
          </Link>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>AI conversations today</CardDescription>
            <CardTitle className="text-2xl">{overview.aiConversationsToday}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Orders today</CardDescription>
            <CardTitle className="text-2xl">{overview.ordersToday ?? "—"}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Reservations today</CardDescription>
            <CardTitle className="text-2xl">{overview.reservationsToday ?? "—"}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Escalations today</CardDescription>
            <CardTitle className="text-2xl">{overview.escalationsToday}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>AI actions today</CardDescription>
            <CardTitle className="text-2xl">{overview.aiActionsToday}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue</CardTitle>
          <CardDescription>
            {overview.revenueAvailable
              ? revenueSnapshot?.definition
              : "Revenue unavailable — insufficient order/payment data in this workspace."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {overview.revenueAvailable && revenueSnapshot ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {revenueSnapshot.periods.map((period) => (
                <div key={period.period} className="rounded-lg border p-3">
                  <p className="text-muted-foreground text-xs capitalize">{period.period}</p>
                  <p className="text-xl font-semibold">
                    {formatCurrency(period.revenueAmount, period.currency)}
                  </p>
                  <p className="text-muted-foreground text-xs">{period.orderCount} paid orders</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              No reliable revenue aggregate is available. Order totals can still be retrieved via AI
              tools when OMS data exists.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Capability state</CardTitle>
          <CardDescription>
            Confirmation: {capabilities.requireConfirmation ? "required" : "optional"} ·{" "}
            {capabilities.destructiveActionsEnabled ? "Destructive actions on" : "Destructive actions off"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {[
            ["ordersCreate", "Orders"],
            ["createOrder", "Customer orders"],
            ["ordersCancel", "Cancel orders"],
            ["createReservation", "Reservations"],
            ["reservationsCancel", "Cancel reservations"],
            ["readMenu", "Menu"],
            ["inventoryRead", "Inventory"],
            ["analyticsRead", "Analytics"],
          ].map(([key, label]) => (
            <Badge
              key={key}
              variant={capabilities[key as keyof AiOperationsCapabilities] ? "default" : "outline"}
            >
              {label}: {capabilities[key as keyof AiOperationsCapabilities] ? "on" : "off"}
            </Badge>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ask AI about your business</CardTitle>
          <CardDescription>
            Uses real Busal data — orders, reservations, inventory, revenue, and AI activity.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder='e.g. "What was our revenue this week?"'
              disabled={isPending}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleSend();
              }}
            />
            <Button onClick={() => handleSend()} disabled={isPending || !message.trim()}>
              Ask
            </Button>
          </div>
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
          {reply ? (
            <div className="bg-muted rounded-md p-3 text-sm whitespace-pre-wrap">{reply}</div>
          ) : null}
          {chatPendingConfirmations.length > 0 ? (
            <div className="border-amber-200 bg-amber-50 rounded-md border p-3 text-sm">
              <p className="font-medium">Confirmation required:</p>
              <ul className="mt-1 list-disc pl-4">
                {chatPendingConfirmations.map((item) => (
                  <li key={item.actionId} className="flex items-center justify-between gap-2">
                    <span>{item.description}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => handleSend([item.actionId])}
                    >
                      Confirm
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pending confirmations</CardTitle>
            <CardDescription>Awaiting user confirmation before execution.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {pendingConfirmations.length === 0 ? (
              <p className="text-muted-foreground">No pending confirmations.</p>
            ) : (
              pendingConfirmations.map((item) => (
                <div key={item.actionId} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">{item.toolId}</p>
                    <p className="text-muted-foreground text-xs">
                      Expires {new Date(item.expiresAt).toLocaleString()} · {item.channel}
                    </p>
                  </div>
                  <Badge variant="outline">{item.status}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Expired confirmations</CardTitle>
            <CardDescription>Actions that expired before confirmation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {expiredConfirmations.length === 0 ? (
              <p className="text-muted-foreground">No expired confirmations recently.</p>
            ) : (
              expiredConfirmations.map((item) => (
                <div key={item.actionId} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">{item.toolId}</p>
                    <p className="text-muted-foreground text-xs">
                      Expired {new Date(item.expiresAt).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="secondary">expired</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI Action History</CardTitle>
            <CardDescription>Recent tool executions with audit trail.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {actions.length === 0 ? (
              <p className="text-muted-foreground">No AI actions recorded yet.</p>
            ) : (
              actions.map((action) => (
                <div key={action.id} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">{action.toolId}</p>
                    <p className="text-muted-foreground text-xs">
                      {new Date(action.createdAt).toLocaleString()} · {action.channel} ·{" "}
                      {action.audience}
                    </p>
                  </div>
                  <Badge variant={action.success ? "default" : "destructive"}>
                    {action.executionStatus}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Available AI Tools</CardTitle>
            <CardDescription>
              {tools.length} tools · confirmation: {capabilities.requireConfirmation ? "on" : "off"}
            </CardDescription>
          </CardHeader>
          <CardContent className="max-h-80 space-y-2 overflow-y-auto text-sm">
            {tools.map((tool) => (
              <div key={tool.toolId} className="flex items-start justify-between gap-2 border-b pb-2">
                <div>
                  <p className="font-medium">{tool.name}</p>
                  <p className="text-muted-foreground text-xs">{tool.toolId}</p>
                </div>
                <div className="flex gap-1">
                  <Badge variant="outline">{tool.riskLevel}</Badge>
                  <Badge variant="secondary">{tool.audience}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
