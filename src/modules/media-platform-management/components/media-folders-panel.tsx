"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MediaPlatformNav } from "@/modules/media-platform-management/components/media-platform-nav";
import {
  createMediaFolderAction,
  deleteMediaFolderAction,
} from "@/modules/media-platform-management/actions/media-platform-actions";
import type { MediaPlatformContext } from "@/modules/media-platform-management/lib/get-media-platform-context";
import type { MediaFolderRecord } from "@/modules/media-platform-management/types/media-platform-types";

interface MediaFoldersPanelProps {
  context: MediaPlatformContext;
  folders: MediaFolderRecord[];
}

export function MediaFoldersPanel({ context, folders }: MediaFoldersPanelProps) {
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();

  function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      await createMediaFolderAction({ name });
      setName("");
    });
  }

  return (
    <div className="space-y-8">
      <MediaPlatformNav />

      {context.permissionsFlags.canUpload ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create folder</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="flex flex-wrap gap-3">
              <div className="min-w-[200px] flex-1 space-y-2">
                <Label htmlFor="folder-name">Name</Label>
                <Input
                  id="folder-name"
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
          <CardTitle className="text-base">Folders</CardTitle>
        </CardHeader>
        <CardContent>
          {folders.length === 0 ? (
            <p className="text-muted-foreground text-sm">No folders yet.</p>
          ) : (
            <ul className="space-y-3">
              {folders.map((folder) => (
                <li
                  key={folder.id}
                  className="flex items-center justify-between rounded border p-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{folder.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {folder.fileCount} files · {folder.childCount} subfolders
                    </p>
                  </div>
                  {context.permissionsFlags.canDelete ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteMediaFolderAction(folder.id)}
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
