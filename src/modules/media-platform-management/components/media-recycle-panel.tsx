"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MediaPlatformNav } from "@/modules/media-platform-management/components/media-platform-nav";
import {
  permanentlyDeleteMediaFileAction,
  restoreMediaFileAction,
} from "@/modules/media-platform-management/actions/media-platform-actions";
import { formatBytes } from "@/modules/media-platform-management/lib/media-platform-validation";
import type { MediaPlatformContext } from "@/modules/media-platform-management/lib/get-media-platform-context";
import type { MediaFileRecord } from "@/modules/media-platform-management/types/media-platform-types";

interface MediaRecyclePanelProps {
  context: MediaPlatformContext;
  files: MediaFileRecord[];
}

export function MediaRecyclePanel({ context, files }: MediaRecyclePanelProps) {
  return (
    <div className="space-y-8">
      <MediaPlatformNav />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recycle bin</CardTitle>
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <p className="text-muted-foreground text-sm">Recycle bin is empty.</p>
          ) : (
            <ul className="space-y-3">
              {files.map((file) => (
                <li
                  key={file.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded border p-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-muted-foreground text-xs">{formatBytes(file.size)}</p>
                  </div>
                  <div className="flex gap-2">
                    {context.permissionsFlags.canUpdate ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => restoreMediaFileAction(file.id)}
                      >
                        Restore
                      </Button>
                    ) : null}
                    {context.permissionsFlags.canDelete ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => permanentlyDeleteMediaFileAction(file.id)}
                      >
                        Delete permanently
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
