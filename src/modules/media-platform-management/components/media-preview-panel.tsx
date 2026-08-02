"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MediaPlatformNav } from "@/modules/media-platform-management/components/media-platform-nav";
import {
  downloadMediaFileAction,
  softDeleteMediaFileAction,
  toggleFavoriteAction,
} from "@/modules/media-platform-management/actions/media-platform-actions";
import { formatBytes } from "@/modules/media-platform-management/lib/media-platform-validation";
import type { MediaPlatformContext } from "@/modules/media-platform-management/lib/get-media-platform-context";
import type {
  MediaFileRecord,
  MediaPreviewRecord,
} from "@/modules/media-platform-management/types/media-platform-types";

interface MediaPreviewPanelProps {
  context: MediaPlatformContext;
  file: MediaFileRecord;
  preview: MediaPreviewRecord;
}

export function MediaPreviewPanel({ context, file, preview }: MediaPreviewPanelProps) {
  return (
    <div className="space-y-8">
      <MediaPlatformNav />

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">{file.name}</CardTitle>
            <p className="text-muted-foreground text-sm">{file.originalName}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{file.fileType}</Badge>
            <Badge variant={preview.checksumValid ? "default" : "destructive"}>
              {preview.checksumValid ? "Checksum valid" : "Checksum invalid"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Size</dt>
              <dd>{formatBytes(file.size)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">MIME type</dt>
              <dd>{file.mimeType}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Visibility</dt>
              <dd>{file.visibility}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Version</dt>
              <dd>v{file.version}</dd>
            </div>
          </dl>

          <pre className="bg-muted max-h-64 overflow-auto rounded-md p-4 text-xs">
            {preview.previewContent}
          </pre>

          <div className="flex flex-wrap gap-2">
            {context.permissionsFlags.canDownload ? (
              <Button type="button" onClick={() => downloadMediaFileAction(file.id)}>
                Download
              </Button>
            ) : null}
            {context.permissionsFlags.canUpdate ? (
              <Button type="button" variant="outline" onClick={() => toggleFavoriteAction(file.id)}>
                {file.isFavorite ? "Unfavorite" : "Favorite"}
              </Button>
            ) : null}
            {context.permissionsFlags.canDelete ? (
              <Button
                type="button"
                variant="destructive"
                onClick={() => softDeleteMediaFileAction(file.id)}
              >
                Move to recycle bin
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
