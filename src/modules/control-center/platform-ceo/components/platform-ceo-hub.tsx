"use client";

import Link from "next/link";
import {
  Archive,
  FileText,
  Loader2,
  MessageSquare,
  Plus,
  Search,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { PageContainer } from "@/components/common/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  archivePlatformCeoConversationAction,
  createPlatformCeoConversationAction,
  deletePlatformCeoConversationAction,
  sendPlatformCeoMessageAction,
} from "@/modules/control-center/platform-ceo/actions/platform-ceo-actions";
import { PLATFORM_CEO_ROUTES } from "@/modules/control-center/platform-ceo/constants/platform-ceo";
import type {
  PlatformCeoConversation,
  PlatformCeoHubBundle,
} from "@/modules/control-center/platform-ceo/types/platform-ceo.types";
import { ControlCenterEmptyState } from "@/modules/control-center/components/dashboard/empty-state";
import { SectionHeader } from "@/modules/control-center/components/dashboard/section-header";

interface PlatformCeoHubProps {
  initialBundle: PlatformCeoHubBundle;
}

function ConversationListItem({
  conversation,
  active,
  onSelect,
  onArchive,
  onDelete,
  disabled,
}: {
  conversation: PlatformCeoConversation;
  active: boolean;
  onSelect: () => void;
  onArchive: () => void;
  onDelete: () => void;
  disabled: boolean;
}) {
  return (
    <div
      className={`group flex items-start gap-2 rounded-md border p-2 text-sm ${
        active ? "border-primary bg-primary/5" : "border-transparent hover:border-border"
      }`}
    >
      <button
        type="button"
        className="min-w-0 flex-1 text-left"
        onClick={onSelect}
        disabled={disabled}
      >
        <div className="truncate font-medium">{conversation.title}</div>
        <div className="text-muted-foreground truncate text-xs">
          {conversation.messages.at(-1)?.content ?? "No messages yet"}
        </div>
      </button>
      <div className="flex shrink-0 gap-1 opacity-0 transition group-hover:opacity-100">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={onArchive}
          disabled={disabled}
          aria-label="Archive conversation"
        >
          <Archive className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={onDelete}
          disabled={disabled}
          aria-label="Delete conversation"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function PlatformCeoHub({ initialBundle }: PlatformCeoHubProps) {
  const [bundle, setBundle] = useState(initialBundle);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [isPending, startTransition] = useTransition();

  const activeConversation = bundle.activeConversation;
  const filteredConversations = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return bundle.recentConversations;
    return bundle.recentConversations.filter(
      (conversation) =>
        conversation.title.toLowerCase().includes(term) ||
        conversation.messages.some((message) => message.content.toLowerCase().includes(term)),
    );
  }, [bundle.recentConversations, search]);

  function updateActiveConversation(conversation: PlatformCeoConversation | null) {
    setBundle((current) => ({
      ...current,
      activeConversation: conversation,
      recentConversations: conversation
        ? [
            conversation,
            ...current.recentConversations.filter((entry) => entry.id !== conversation.id),
          ]
        : current.recentConversations,
    }));
  }

  function handleNewConversation() {
    startTransition(async () => {
      try {
        const conversation = await createPlatformCeoConversationAction("New conversation");
        updateActiveConversation(conversation);
        setDraft("");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to create conversation");
      }
    });
  }

  function handleSelectConversation(conversation: PlatformCeoConversation) {
    updateActiveConversation(conversation);
  }

  function handleSuggestedPrompt(prompt: string) {
    setDraft(prompt);
  }

  function handleSend() {
    const message = draft.trim();
    if (!message) return;

    startTransition(async () => {
      try {
        const response = await sendPlatformCeoMessageAction({
          conversationId: activeConversation?.id,
          message,
          title: message.slice(0, 80),
        });
        updateActiveConversation(response.conversation);
        setDraft("");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to send message");
      }
    });
  }

  function handleArchive(conversationId: string) {
    startTransition(async () => {
      try {
        await archivePlatformCeoConversationAction(conversationId);
        setBundle((current) => ({
          ...current,
          recentConversations: current.recentConversations.filter(
            (entry) => entry.id !== conversationId,
          ),
          activeConversation:
            current.activeConversation?.id === conversationId ? null : current.activeConversation,
        }));
        toast.success("Conversation archived");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to archive conversation");
      }
    });
  }

  function handleDelete(conversationId: string) {
    startTransition(async () => {
      try {
        await deletePlatformCeoConversationAction(conversationId);
        setBundle((current) => ({
          ...current,
          recentConversations: current.recentConversations.filter(
            (entry) => entry.id !== conversationId,
          ),
          activeConversation:
            current.activeConversation?.id === conversationId ? null : current.activeConversation,
        }));
        toast.success("Conversation deleted");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to delete conversation");
      }
    });
  }

  const showWelcome = !activeConversation || activeConversation.messages.length === 0;

  return (
    <PageContainer>
      <div className="mb-4 flex items-center justify-between gap-3">
        <SectionHeader
          title="Platform CEO"
          description="Executive advisor for platform operators. Read-only intelligence with advisory recommendations — no autonomous actions."
        />
        <Button variant="outline" size="sm" asChild>
          <Link href={PLATFORM_CEO_ROUTES.reports}>
            <FileText className="mr-2 h-4 w-4" />
            Executive Reports
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Card className="h-[calc(100vh-12rem)]">
          <CardHeader className="space-y-3 pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">Conversations</CardTitle>
              <Button size="sm" variant="outline" onClick={handleNewConversation} disabled={isPending}>
                <Plus className="mr-1 h-4 w-4" />
                New
              </Button>
            </div>
            <div className="relative">
              <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search conversations"
                className="pl-8"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-18rem)] px-4 pb-4">
              {filteredConversations.length === 0 ? (
                <ControlCenterEmptyState
                  title="No conversations"
                  description="Start a new conversation with the Platform CEO."
                />
              ) : (
                <div className="space-y-2">
                  {filteredConversations.map((conversation) => (
                    <ConversationListItem
                      key={conversation.id}
                      conversation={conversation}
                      active={activeConversation?.id === conversation.id}
                      onSelect={() => handleSelectConversation(conversation)}
                      onArchive={() => handleArchive(conversation.id)}
                      onDelete={() => handleDelete(conversation.id)}
                      disabled={isPending}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="flex min-h-[calc(100vh-12rem)] flex-col gap-4">
          {showWelcome ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5" />
                  Welcome, {bundle.operator.fullName}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  Ask executive questions about platform health, growth, churn, security, AI usage,
                  and commercial performance. Responses use Platform Intelligence context and
                  registered read-only tools.
                </p>
                <div>
                  <div className="mb-2 text-sm font-medium">Suggested prompts</div>
                  <div className="flex flex-wrap gap-2">
                    {bundle.suggestedPrompts.map((prompt) => (
                      <Button
                        key={prompt.id}
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleSuggestedPrompt(prompt.prompt)}
                        disabled={isPending}
                      >
                        {prompt.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="mb-2 text-sm font-medium">Registered tools</div>
                  <div className="flex flex-wrap gap-2">
                    {bundle.registeredTools.map((tool) => (
                      <span
                        key={tool.id}
                        className="bg-muted inline-flex rounded-full px-2.5 py-1 text-xs"
                      >
                        {tool.name}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card className="flex min-h-0 flex-1 flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-4 w-4" />
                {activeConversation?.title ?? "Chat"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex min-h-0 flex-1 flex-col gap-4">
              <ScrollArea className="min-h-[320px] flex-1 rounded-md border p-4">
                {activeConversation && activeConversation.messages.length > 0 ? (
                  <div className="space-y-4">
                    {activeConversation.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground ml-auto"
                            : "bg-muted"
                        }`}
                      >
                        <div className="mb-1 text-xs font-medium capitalize opacity-80">
                          {message.role === "user" ? "You" : "Platform CEO"}
                        </div>
                        <div className="whitespace-pre-wrap">{message.content}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <ControlCenterEmptyState
                    title="Start chatting"
                    description="Choose a suggested prompt or type your executive question below."
                  />
                )}
              </ScrollArea>

              <div className="space-y-2">
                <Textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Ask the Platform CEO about platform performance..."
                  rows={4}
                  disabled={isPending}
                />
                <div className="flex justify-end">
                  <Button onClick={handleSend} disabled={isPending || !draft.trim()}>
                    {isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    Send
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
