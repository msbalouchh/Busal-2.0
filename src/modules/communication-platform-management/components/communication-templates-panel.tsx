"use client";

import { useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createCommunicationTemplateAction,
  deleteCommunicationTemplateAction,
} from "@/modules/communication-platform-management/actions/communication-platform-actions";
import { CommunicationPlatformNav } from "@/modules/communication-platform-management/components/communication-platform-nav";
import { CHANNEL_TYPE_OPTIONS } from "@/modules/communication-platform-management/constants/routes";
import type { CommunicationPlatformContext } from "@/modules/communication-platform-management/lib/get-communication-platform-context";
import type { CommunicationTemplateRecord } from "@/modules/communication-platform-management/types/communication-platform-types";

interface CommunicationTemplatesPanelProps {
  context: CommunicationPlatformContext;
  templates: CommunicationTemplateRecord[];
}

export function CommunicationTemplatesPanel({
  context,
  templates,
}: CommunicationTemplatesPanelProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [channel, setChannel] = useState<(typeof CHANNEL_TYPE_OPTIONS)[number]["value"]>("EMAIL");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-8">
      <CommunicationPlatformNav />

      {context.permissionsFlags.canCreate ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Template builder</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid max-w-xl gap-4"
              onSubmit={(formEvent) => {
                formEvent.preventDefault();
                startTransition(async () => {
                  await createCommunicationTemplateAction({ name, slug, channel, content });
                  setName("");
                  setSlug("");
                  setContent("");
                });
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="template-name">Name</Label>
                <Input
                  id="template-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-slug">Slug</Label>
                <Input
                  id="template-slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-channel">Channel</Label>
                <select
                  id="template-channel"
                  value={channel}
                  onChange={(e) =>
                    setChannel(e.target.value as (typeof CHANNEL_TYPE_OPTIONS)[number]["value"])
                  }
                  className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                >
                  {CHANNEL_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-content">Content</Label>
                <Input
                  id="template-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Hello {{name}}"
                  required
                />
              </div>
              <Button type="submit" disabled={isPending}>
                Create template
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Templates ({templates.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {templates.map((template) => (
              <li
                key={template.id}
                className="flex items-center justify-between rounded border p-3 text-sm"
              >
                <div>
                  <p className="font-medium">{template.name}</p>
                  <p className="text-muted-foreground text-xs">{template.slug}</p>
                  <Badge className="mt-1" variant="outline">
                    {template.channel}
                  </Badge>
                </div>
                {context.permissionsFlags.canDelete ? (
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={isPending}
                    onClick={() =>
                      startTransition(async () => {
                        await deleteCommunicationTemplateAction(template.id);
                      })
                    }
                  >
                    Delete
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
