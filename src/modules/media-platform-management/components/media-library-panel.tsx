"use client";

import Link from "next/link";
import { Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MediaPlatformNav } from "@/modules/media-platform-management/components/media-platform-nav";
import { MEDIA_PLATFORM_ROUTES } from "@/modules/media-platform-management/constants/routes";
import { formatBytes } from "@/modules/media-platform-management/lib/media-platform-validation";
import {
  softDeleteMediaFileAction,
  toggleFavoriteAction,
} from "@/modules/media-platform-management/actions/media-platform-actions";
import type { MediaPlatformContext } from "@/modules/media-platform-management/lib/get-media-platform-context";
import type { MediaFileRecord } from "@/modules/media-platform-management/types/media-platform-types";

interface MediaLibraryPanelProps {
  context: MediaPlatformContext;
  files: MediaFileRecord[];
}

export function MediaLibraryPanel({ context, files }: MediaLibraryPanelProps) {
  return (
    <div className="space-y-8">
      <MediaPlatformNav />
      <p className="text-muted-foreground text-sm">
        {files.length} files in the library for {context.business.businessName ?? "your business"}.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All files</CardTitle>
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No files yet. Upload from Upload Center.
            </p>
          ) : (
            <ul className="space-y-3">
              {files.map((file) => (
                <li
                  key={file.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded border p-3 text-sm"
                >
                  <div className="space-y-1">
                    <Link
                      href={MEDIA_PLATFORM_ROUTES.fileDetail(file.id)}
                      className="font-medium hover:underline"
                    >
                      {file.name}
                    </Link>
                    <p className="text-muted-foreground text-xs">
                      {formatBytes(file.size)} · {file.mimeType}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{file.fileType}</Badge>
                    {file.isFavorite ? (
                      <Star
                        className="h-4 w-4 fill-current text-yellow-500"
                        aria-label="Favorite"
                      />
                    ) : null}
                    {context.permissionsFlags.canUpdate ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => toggleFavoriteAction(file.id)}
                      >
                        {file.isFavorite ? "Unfavorite" : "Favorite"}
                      </Button>
                    ) : null}
                    {context.permissionsFlags.canDelete ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => softDeleteMediaFileAction(file.id)}
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
