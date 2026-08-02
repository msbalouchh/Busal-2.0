"use client";

import { useTransition } from "react";
import { FolderPlus, Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MemoryNav } from "@/modules/ai-memory-management/components/memory-nav";
import {
  createMemoryCollectionAction,
  deleteMemoryCollectionAction,
} from "@/modules/ai-memory-management/actions/ai-memory-actions";
import type { AiMemoryContext } from "@/modules/ai-memory-management/lib/get-ai-memory-context";
import type { MemoryCollectionRecord } from "@/modules/ai-memory-management/types/ai-memory-types";

interface MemoryCollectionsPanelProps {
  context: AiMemoryContext;
  collections: MemoryCollectionRecord[];
}

export function MemoryCollectionsPanel({ context, collections }: MemoryCollectionsPanelProps) {
  const [isPending, startTransition] = useTransition();

  const handleCreate = (formData: FormData) => {
    startTransition(async () => {
      await createMemoryCollectionAction({
        name: String(formData.get("name") ?? ""),
        description: String(formData.get("description") ?? "") || null,
      });
    });
  };

  const handleDelete = (collectionId: string) => {
    startTransition(async () => {
      await deleteMemoryCollectionAction(collectionId);
    });
  };

  return (
    <div className="space-y-8">
      <MemoryNav />

      {context.permissionsFlags.canCreate ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create collection</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={handleCreate} className="grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
              <Input
                name="name"
                placeholder="Collection name"
                required
                aria-label="Collection name"
              />
              <Input
                name="description"
                placeholder="Description"
                aria-label="Collection description"
              />
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FolderPlus className="h-4 w-4" />
                )}
                Create
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Memory Collections</CardTitle>
        </CardHeader>
        <CardContent>
          {collections.length === 0 ? (
            <p className="text-muted-foreground text-sm">No collections created yet.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {collections.map((collection) => (
                <div key={collection.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{collection.name}</p>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {collection.description ?? "No description"}
                      </p>
                      <p className="text-muted-foreground mt-2 text-xs">
                        {collection.memoryCount} memories
                      </p>
                    </div>
                    {context.permissionsFlags.canDelete ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(collection.id)}
                        disabled={isPending}
                        aria-label={`Delete ${collection.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
