"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createCommunicationCampaignAction,
  deleteCommunicationCampaignAction,
  executeCommunicationCampaignAction,
} from "@/modules/communication-platform-management/actions/communication-platform-actions";
import { CommunicationPlatformNav } from "@/modules/communication-platform-management/components/communication-platform-nav";
import type { CommunicationPlatformContext } from "@/modules/communication-platform-management/lib/get-communication-platform-context";
import type { CommunicationCampaignRecord } from "@/modules/communication-platform-management/types/communication-platform-types";

interface CommunicationCampaignsPanelProps {
  context: CommunicationPlatformContext & {
    audience: Array<{ email: string; name: string }>;
  };
  campaigns: CommunicationCampaignRecord[];
}

export function CommunicationCampaignsPanel({
  context,
  campaigns,
}: CommunicationCampaignsPanelProps) {
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();

  const defaultRecipients = context.audience.map((entry) => entry.email);

  return (
    <div className="space-y-8">
      <CommunicationPlatformNav />

      {context.permissionsFlags.canCreate ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New campaign</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="max-w-xl space-y-4"
              onSubmit={(formEvent) => {
                formEvent.preventDefault();
                startTransition(async () => {
                  try {
                    await createCommunicationCampaignAction({
                      name,
                      channel: "EMAIL",
                      recipients: defaultRecipients,
                      subject: subject || name,
                      content,
                    });
                    setName("");
                    setSubject("");
                    setContent("");
                    toast.success("Campaign created");
                  } catch (error) {
                    toast.error(
                      error instanceof Error ? error.message : "Unable to create campaign.",
                    );
                  }
                });
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="campaign-name">Campaign name</Label>
                <Input
                  id="campaign-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Campaign name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="campaign-subject">Subject</Label>
                <Input
                  id="campaign-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="campaign-content">Message</Label>
                <textarea
                  id="campaign-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  className="border-input bg-background min-h-28 w-full rounded-md border px-3 py-2 text-sm"
                  placeholder="Write your campaign message"
                />
              </div>
              <p className="text-muted-foreground text-sm">
                Audience: {defaultRecipients.length} opted-in customer
                {defaultRecipients.length === 1 ? "" : "s"} with email.
              </p>
              <Button type="submit" disabled={isPending || defaultRecipients.length === 0}>
                Create
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Campaigns ({campaigns.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <p className="text-muted-foreground text-sm">No campaigns yet.</p>
          ) : (
            <ul className="space-y-3">
              {campaigns.map((campaign) => (
                <li
                  key={campaign.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded border p-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{campaign.name}</p>
                    <Badge variant="secondary">{campaign.status}</Badge>
                  </div>
                  <div className="flex gap-2">
                    {context.permissionsFlags.canSend ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() =>
                          startTransition(async () => {
                            try {
                              await executeCommunicationCampaignAction(campaign.id);
                              toast.success("Campaign executed");
                            } catch (error) {
                              toast.error(
                                error instanceof Error ? error.message : "Unable to run campaign.",
                              );
                            }
                          })
                        }
                      >
                        Run
                      </Button>
                    ) : null}
                    {context.permissionsFlags.canDelete ? (
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={isPending}
                        onClick={() =>
                          startTransition(async () => {
                            await deleteCommunicationCampaignAction(campaign.id);
                          })
                        }
                      >
                        Delete
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
