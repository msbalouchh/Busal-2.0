"use client";

import { useTransition } from "react";
import { LifeBuoy } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCustomerSupportTicketAction } from "@/modules/customer-portal/actions/customer-portal-actions";
import { formatPortalDate } from "@/modules/customer-portal/components/customer-portal-format";

import type { CustomerSupportTicketList } from "@/modules/customer-portal/types/customer-portal";

interface CustomerPortalSupportPanelProps {
  tickets: CustomerSupportTicketList;
}

export function CustomerPortalSupportPanel({ tickets }: CustomerPortalSupportPanelProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Create support ticket</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              startTransition(async () => {
                try {
                  await createCustomerSupportTicketAction({
                    subject: String(formData.get("subject") ?? ""),
                    content: String(formData.get("content") ?? ""),
                  });
                  event.currentTarget.reset();
                  toast.success("Support ticket created");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Unable to create ticket.");
                }
              });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" name="subject" required disabled={isPending} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Describe your issue</Label>
              <textarea
                id="content"
                name="content"
                required
                disabled={isPending}
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-24 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <Button type="submit" disabled={isPending}>
              Submit ticket
            </Button>
          </form>
        </CardContent>
      </Card>

      {tickets.length === 0 ? (
        <EmptyState
          title="No support tickets"
          description="Create a ticket if you need help."
          icon={<LifeBuoy className="text-muted-foreground h-6 w-6" />}
        />
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <Card key={ticket.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <CardTitle className="text-base">{ticket.subject}</CardTitle>
                  <Badge variant="outline">{ticket.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="text-sm">
                <p className="text-muted-foreground text-xs">
                  Created {formatPortalDate(ticket.createdAt)} · Updated{" "}
                  {formatPortalDate(ticket.updatedAt)}
                  {ticket.priority ? ` · ${ticket.priority}` : ""}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
