"use client";

import { useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendCommunicationMessageAction } from "@/modules/communication-platform-management/actions/communication-platform-actions";
import { CommunicationPlatformNav } from "@/modules/communication-platform-management/components/communication-platform-nav";
import type { CommunicationPlatformContext } from "@/modules/communication-platform-management/lib/get-communication-platform-context";
import type { CommunicationMessageRecord } from "@/modules/communication-platform-management/types/communication-platform-types";

interface CommunicationInboxPanelProps {
  context: CommunicationPlatformContext;
  messages: CommunicationMessageRecord[];
}

export function CommunicationInboxPanel({ context, messages }: CommunicationInboxPanelProps) {
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-8">
      <CommunicationPlatformNav />

      {context.permissionsFlags.canSend ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Send message</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid max-w-xl gap-4"
              onSubmit={(formEvent) => {
                formEvent.preventDefault();
                startTransition(async () => {
                  await sendCommunicationMessageAction({
                    channel: "EMAIL",
                    recipient,
                    subject,
                    content,
                  });
                  setRecipient("");
                  setSubject("");
                  setContent("");
                });
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="recipient">Recipient</Label>
                <Input
                  id="recipient"
                  value={recipient}
                  onChange={(event) => setRecipient(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Input
                  id="content"
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={isPending}>
                Send message
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Unified inbox ({messages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <p className="text-muted-foreground text-sm">No messages in inbox.</p>
          ) : (
            <ul className="space-y-3">
              {messages.map((message) => (
                <li key={message.id} className="rounded border p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{message.recipient}</span>
                    <div className="flex gap-2">
                      <Badge variant="outline">{message.channel}</Badge>
                      <Badge variant="secondary">{message.status}</Badge>
                    </div>
                  </div>
                  <p className="text-muted-foreground mt-1">{message.subject || message.content}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
