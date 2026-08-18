"use client";

import Image from "next/image";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomerAiChatPanel } from "@/modules/customer-ai/components/customer-ai-chat-panel";
import { sendCustomerAssistantMessageAction } from "@/modules/customer-portal/actions/customer-portal-actions";
import type { CustomerAiIdentity } from "@/modules/customer-ai/types/customer-ai.types";

interface CustomerPortalAssistantPanelProps {
  identity: CustomerAiIdentity;
}

export function CustomerPortalAssistantPanel({ identity }: CustomerPortalAssistantPanelProps) {
  const displayName = identity.whiteLabelName ?? identity.businessName;
  const greeting =
    identity.aiGreeting?.trim() ||
    `Hi! I'm ${identity.aiName}, the AI assistant for ${displayName}. How can I help you today?`;

  return (
    <Card className="flex min-h-[32rem] flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-base">
          {identity.aiAvatarUrl ? (
            <Image
              src={identity.aiAvatarUrl}
              alt={identity.aiName}
              width={40}
              height={40}
              className="rounded-full object-cover"
              unoptimized
            />
          ) : (
            <span className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold">
              {identity.aiName.charAt(0)}
            </span>
          )}
          <span>
            {identity.aiName}
            <span className="text-muted-foreground block text-xs font-normal">{displayName}</span>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <CustomerAiChatPanel
          aiName={identity.aiName}
          aiAvatarUrl={identity.aiAvatarUrl}
          businessLabel={displayName}
          greeting={greeting}
          onSend={async ({ message, conversationId, sessionToken, confirmedActions }) => {
            const result = await sendCustomerAssistantMessageAction({
              content: message,
              conversationId,
              sessionToken,
              confirmedActions,
            });

            return {
              conversationId: result.conversationId,
              sessionToken: result.sessionToken ?? sessionToken ?? "",
              content: result.reply,
              requiresConfirmation: result.requiresConfirmation,
              requiresVerification: result.requiresVerification,
            };
          }}
        />
      </CardContent>
    </Card>
  );
}
