"use client";

import { useState, useTransition } from "react";

import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createDocumentFolderAction,
  deleteDocumentFolderAction,
} from "@/modules/document-platform-management/actions/document-platform-actions";
import { DocumentPlatformNav } from "@/modules/document-platform-management/components/document-platform-nav";
import type { DocumentPlatformContext } from "@/modules/document-platform-management/lib/get-document-platform-context";
import type { DocumentFolderRecord } from "@/modules/document-platform-management/types/document-platform-types";

interface DocumentFoldersPanelProps {
  context: DocumentPlatformContext;
  folders: DocumentFolderRecord[];
}

export function DocumentFoldersPanel({ context, folders }: DocumentFoldersPanelProps) {
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-8">
      <DocumentPlatformNav />

      {context.permissionsFlags.canCreate ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New folder</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="flex flex-col gap-3 sm:max-w-xl sm:flex-row sm:items-end"
              onSubmit={(formEvent) => {
                formEvent.preventDefault();
                startTransition(async () => {
                  await createDocumentFolderAction({ name });
                  setName("");
                });
              }}
            >
              <div className="flex-1 space-y-2">
                <Label htmlFor="folder-name">Name</Label>
                <Input
                  id="folder-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={isPending}>
                Create
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Folders ({folders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {folders.length === 0 ? (
            <EmptyState
              title="No folders yet"
              description="Create a folder to organize documents in your library."
              className="border-none bg-transparent p-6"
            />
          ) : (
            <ul className="space-y-2">
              {folders.map((folder) => (
                <li
                  key={folder.id}
                  className="hover:bg-muted/40 flex flex-col gap-3 rounded-lg border p-3 text-sm transition-colors sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">{folder.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {folder.documentCount} documents · {folder.childCount} subfolders
                    </p>
                  </div>
                  {context.permissionsFlags.canDelete && folder.name !== "System" ? (
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={isPending}
                      onClick={() =>
                        startTransition(async () => {
                          await deleteDocumentFolderAction(folder.id);
                        })
                      }
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
