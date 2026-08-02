"use client";

import Link from "next/link";
import { Archive, Loader2, Pin, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  archiveConversationAction,
  pinConversationAction,
} from "@/modules/ai-restaurant-assistant-management/actions/ai-restaurant-assistant-actions";
import { AI_RESTAURANT_ASSISTANT_ROUTES } from "@/modules/ai-restaurant-assistant-management/constants/routes";
import type { ConversationRecord } from "@/modules/ai-restaurant-assistant-management/types/ai-restaurant-assistant-types";

interface ConversationSidebarProps {
  conversations: ConversationRecord[];
  activeConversationId?: string | null;
  canChat: boolean;
}

export function ConversationSidebar({
  conversations,
  activeConversationId,
  canChat,
}: ConversationSidebarProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = conversations.filter((conversation) =>
    conversation.title.toLowerCase().includes(search.toLowerCase()),
  );

  const handlePin = (conversationId: string, isPinned: boolean) => {
    startTransition(async () => {
      await pinConversationAction(conversationId, !isPinned);
      router.refresh();
    });
  };

  const handleArchive = (conversationId: string) => {
    startTransition(async () => {
      await archiveConversationAction(conversationId);
      router.refresh();
    });
  };

  return (
    <aside className="bg-card flex h-full flex-col rounded-xl border">
      <div className="space-y-3 border-b p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold">Conversations</h2>
          {canChat ? (
            <Button type="button" size="sm" variant="outline" asChild>
              <Link href={AI_RESTAURANT_ASSISTANT_ROUTES.chat()}>New</Link>
            </Button>
          ) : null}
        </div>
        <div className="relative">
          <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search conversations"
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto p-2">
        {filtered.length === 0 ? (
          <p className="text-muted-foreground p-3 text-sm">No conversations yet.</p>
        ) : (
          filtered.map((conversation) => {
            const isActive = conversation.id === activeConversationId;

            return (
              <div
                key={conversation.id}
                className={`rounded-lg border p-3 ${isActive ? "border-primary bg-muted/50" : "border-transparent"}`}
              >
                <Link
                  href={AI_RESTAURANT_ASSISTANT_ROUTES.chat(conversation.id)}
                  className="block space-y-1"
                >
                  <div className="flex items-center gap-2">
                    {conversation.isPinned ? (
                      <Pin className="text-primary h-3.5 w-3.5 shrink-0" />
                    ) : null}
                    <p className="truncate text-sm font-medium">{conversation.title}</p>
                  </div>
                  {conversation.lastMessagePreview ? (
                    <p className="text-muted-foreground line-clamp-2 text-xs">
                      {conversation.lastMessagePreview}
                    </p>
                  ) : null}
                </Link>
                {canChat ? (
                  <div className="mt-2 flex gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      disabled={isPending}
                      onClick={() => handlePin(conversation.id, conversation.isPinned)}
                    >
                      <Pin className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      disabled={isPending}
                      onClick={() => handleArchive(conversation.id)}
                    >
                      {isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Archive className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
