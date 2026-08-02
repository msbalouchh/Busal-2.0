"use client";

import { useTransition } from "react";
import { Archive, Loader2, Pin, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MemoryNav } from "@/modules/ai-memory-management/components/memory-nav";
import {
  archiveMemoryAction,
  deleteMemoryAction,
  pinMemoryAction,
} from "@/modules/ai-memory-management/actions/ai-memory-actions";
import type { AiMemoryContext } from "@/modules/ai-memory-management/lib/get-ai-memory-context";
import type {
  MemoryRecord,
  MemoryReferenceRecord,
} from "@/modules/ai-memory-management/types/ai-memory-types";

interface MemoryDetailPanelProps {
  context: AiMemoryContext;
  memory: MemoryRecord;
  references: MemoryReferenceRecord[];
}

export function MemoryDetailPanel({ context, memory, references }: MemoryDetailPanelProps) {
  const [isPending, startTransition] = useTransition();

  const runAction = (action: () => Promise<unknown>) => {
    startTransition(async () => {
      await action();
    });
  };

  return (
    <div className="space-y-8">
      <MemoryNav />

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl">{memory.title}</CardTitle>
            <p className="text-muted-foreground mt-1 text-sm">
              {memory.memoryType} · importance {memory.importanceScore.toFixed(2)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {context.permissionsFlags.canUpdate ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={() => runAction(() => pinMemoryAction(memory.id, !memory.isPinned))}
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Pin className="h-4 w-4" />
                  )}
                  {memory.isPinned ? "Unpin" : "Pin"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={() =>
                    runAction(() => archiveMemoryAction(memory.id, !memory.isArchived))
                  }
                >
                  <Archive className="h-4 w-4" />
                  {memory.isArchived ? "Restore" : "Archive"}
                </Button>
              </>
            ) : null}
            {context.permissionsFlags.canDelete ? (
              <Button
                variant="destructive"
                size="sm"
                disabled={isPending}
                onClick={() => runAction(() => deleteMemoryAction(memory.id))}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-sm font-medium">Content</h3>
            <p className="text-muted-foreground mt-2 text-sm whitespace-pre-wrap">
              {memory.content}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="text-sm font-medium">Metadata</h3>
              <pre className="bg-muted mt-2 overflow-x-auto rounded-md p-3 text-xs">
                {JSON.stringify(memory.metadata, null, 2)}
              </pre>
            </div>
            <div>
              <h3 className="text-sm font-medium">Context links</h3>
              <ul className="text-muted-foreground mt-2 space-y-1 text-sm">
                <li>Agent: {memory.agentId ?? "—"}</li>
                <li>Staff: {memory.staffId ?? "—"}</li>
                <li>Customer: {memory.customerId ?? "—"}</li>
                <li>Conversation: {memory.conversationId ?? "—"}</li>
                <li>Embedding ref: {memory.embeddingReference ?? "—"}</li>
                <li>
                  Expires: {memory.expiresAt ? new Date(memory.expiresAt).toLocaleString() : "—"}
                </li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium">References</h3>
            {references.length === 0 ? (
              <p className="text-muted-foreground mt-2 text-sm">No references linked.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {references.map((reference) => (
                  <li key={reference.id} className="rounded-md border px-3 py-2 text-sm">
                    {reference.entityType} · {reference.entityId} · {reference.relationship}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
