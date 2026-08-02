"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MediaPlatformNav } from "@/modules/media-platform-management/components/media-platform-nav";
import {
  createMediaTagAction,
  deleteMediaTagAction,
} from "@/modules/media-platform-management/actions/media-platform-actions";
import type { MediaPlatformContext } from "@/modules/media-platform-management/lib/get-media-platform-context";
import type { MediaTagRecord } from "@/modules/media-platform-management/types/media-platform-types";

interface MediaTagsPanelProps {
  context: MediaPlatformContext;
  tags: MediaTagRecord[];
}

export function MediaTagsPanel({ context, tags }: MediaTagsPanelProps) {
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();

  function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      await createMediaTagAction({ name });
      setName("");
    });
  }

  return (
    <div className="space-y-8">
      <MediaPlatformNav />

      {context.permissionsFlags.canUpdate ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create tag</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="flex flex-wrap gap-3">
              <div className="min-w-[200px] flex-1 space-y-2">
                <Label htmlFor="tag-name">Name</Label>
                <Input
                  id="tag-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={pending} className="self-end">
                Create
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tags</CardTitle>
        </CardHeader>
        <CardContent>
          {tags.length === 0 ? (
            <p className="text-muted-foreground text-sm">No tags yet.</p>
          ) : (
            <ul className="space-y-3">
              {tags.map((tag) => (
                <li
                  key={tag.id}
                  className="flex items-center justify-between rounded border p-3 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: tag.color }}
                      aria-hidden="true"
                    />
                    <span className="font-medium">{tag.name}</span>
                    <span className="text-muted-foreground text-xs">{tag.fileCount} files</span>
                  </div>
                  {context.permissionsFlags.canDelete ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteMediaTagAction(tag.id)}
                    >
                      Delete
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
