"use client";

import { useTransition } from "react";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendCustomerMessageAction } from "@/modules/customer-portal/actions/customer-portal-actions";
import { formatPortalDate } from "@/modules/customer-portal/components/customer-portal-format";

import type { CustomerMessageList } from "@/modules/customer-portal/types/customer-portal";

interface CustomerPortalMessagesPanelProps {
  messages: CustomerMessageList;
}

export function CustomerPortalMessagesPanel({ messages }: CustomerPortalMessagesPanelProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Send a message</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              startTransition(async () => {
                try {
                  await sendCustomerMessageAction({
                    subject: String(formData.get("subject") ?? ""),
                    content: String(formData.get("content") ?? ""),
                  });
                  event.currentTarget.reset();
                  toast.success("Message sent");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Unable to send message.");
                }
              });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" name="subject" required disabled={isPending} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Message</Label>
              <textarea
                id="content"
                name="content"
                required
                disabled={isPending}
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-24 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <Button type="submit" disabled={isPending}>
              Send message
            </Button>
          </form>
        </CardContent>
      </Card>

      {messages.length === 0 ? (
        <EmptyState
          title="No conversations"
          description="Your message history will appear here."
          icon={<MessageSquare className="text-muted-foreground h-6 w-6" />}
        />
      ) : (
        <div className="space-y-3">
          {messages.map((conversation) => (
            <Card key={conversation.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <CardTitle className="text-base">{conversation.subject}</CardTitle>
                  <Badge variant="outline">{conversation.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                {conversation.preview ? (
                  <p className="text-muted-foreground line-clamp-2">{conversation.preview}</p>
                ) : null}
                <p className="text-muted-foreground text-xs">
                  {formatPortalDate(conversation.lastMessageAt)} · {conversation.sourceChannel}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
