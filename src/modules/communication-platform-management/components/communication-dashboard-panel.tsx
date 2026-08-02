"use client";

import Link from "next/link";
import { Mail, Megaphone, MessageSquare, Send } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CommunicationPlatformNav } from "@/modules/communication-platform-management/components/communication-platform-nav";
import { COMMUNICATION_PLATFORM_ROUTES } from "@/modules/communication-platform-management/constants/routes";
import type { CommunicationPlatformContext } from "@/modules/communication-platform-management/lib/get-communication-platform-context";
import type {
  CommunicationAnalyticsRecord,
  CommunicationMessageRecord,
} from "@/modules/communication-platform-management/types/communication-platform-types";

interface CommunicationDashboardPanelProps {
  context: CommunicationPlatformContext;
  analytics: CommunicationAnalyticsRecord;
  messages: CommunicationMessageRecord[];
}

export function CommunicationDashboardPanel({
  context,
  analytics,
  messages,
}: CommunicationDashboardPanelProps) {
  const cards = [
    {
      label: "Messages",
      value: analytics.totalMessages,
      sub: `${analytics.deliveryRate}% delivery rate`,
      icon: Send,
    },
    {
      label: "Delivered",
      value: analytics.delivered,
      sub: `${analytics.failed} failed`,
      icon: Mail,
    },
    {
      label: "Campaigns",
      value: analytics.campaigns,
      sub: `${analytics.templates} templates`,
      icon: Megaphone,
    },
    {
      label: "Channels",
      value: analytics.channels,
      sub: `${analytics.queued} queued`,
      icon: MessageSquare,
    },
  ];

  return (
    <div className="space-y-8">
      <CommunicationPlatformNav />
      <p className="text-muted-foreground text-sm">
        Communication platform for {context.business.businessName ?? "your business"}.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
              <card.icon className="text-muted-foreground h-4 w-4" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{card.value}</p>
              <p className="text-muted-foreground text-xs">{card.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent messages</CardTitle>
          <Link
            href={COMMUNICATION_PLATFORM_ROUTES.inbox()}
            className="text-primary text-sm hover:underline"
          >
            View inbox
          </Link>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <p className="text-muted-foreground text-sm">No messages yet.</p>
          ) : (
            <ul className="space-y-3">
              {messages.slice(0, 5).map((message) => (
                <li key={message.id} className="flex items-center justify-between text-sm">
                  <span>{message.recipient}</span>
                  <Badge variant="secondary">{message.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
