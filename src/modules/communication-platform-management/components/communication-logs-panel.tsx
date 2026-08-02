"use client";

import { useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { retryFailedMessagesAction } from "@/modules/communication-platform-management/actions/communication-platform-actions";
import { CommunicationPlatformNav } from "@/modules/communication-platform-management/components/communication-platform-nav";
import type { CommunicationPlatformContext } from "@/modules/communication-platform-management/lib/get-communication-platform-context";
import type { CommunicationMessageRecord } from "@/modules/communication-platform-management/types/communication-platform-types";

interface CommunicationLogsPanelProps {
  context: CommunicationPlatformContext;
  messages: CommunicationMessageRecord[];
}

export function CommunicationLogsPanel({ context, messages }: CommunicationLogsPanelProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-8">
      <CommunicationPlatformNav />

      {context.permissionsFlags.canManage ? (
        <Button
          variant="outline"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await retryFailedMessagesAction();
            })
          }
        >
          Retry failed messages
        </Button>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Delivery logs ({messages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {messages.map((message) => (
              <li key={message.id} className="rounded border p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{message.recipient}</span>
                  <Badge variant="secondary">{message.status}</Badge>
                </div>
                <p className="text-muted-foreground mt-1">
                  {message.providerReference || "No provider reference"} ·{" "}
                  {message.sentAt ? new Date(message.sentAt).toLocaleString() : "Not sent"}
                </p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
