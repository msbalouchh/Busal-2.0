"use client";

import Link from "next/link";
import { HardDrive, Image, Star, Trash2, FolderOpen, Tag } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MediaPlatformNav } from "@/modules/media-platform-management/components/media-platform-nav";
import { MEDIA_PLATFORM_ROUTES } from "@/modules/media-platform-management/constants/routes";
import { formatBytes } from "@/modules/media-platform-management/lib/media-platform-validation";
import type { MediaPlatformContext } from "@/modules/media-platform-management/lib/get-media-platform-context";
import type {
  MediaFileRecord,
  MediaSummaryRecord,
} from "@/modules/media-platform-management/types/media-platform-types";

interface MediaDashboardPanelProps {
  context: MediaPlatformContext;
  summary: MediaSummaryRecord;
  recentFiles: MediaFileRecord[];
}

export function MediaDashboardPanel({ context, summary, recentFiles }: MediaDashboardPanelProps) {
  const cards = [
    { label: "Files", value: summary.total, sub: formatBytes(summary.totalBytes), icon: Image },
    { label: "Favorites", value: summary.favorites, sub: "Starred files", icon: Star },
    { label: "Folders", value: summary.folders, sub: "Organized storage", icon: FolderOpen },
    { label: "Tags", value: summary.tags, sub: "File labels", icon: Tag },
    { label: "Recycle Bin", value: summary.deleted, sub: "Deleted files", icon: Trash2 },
    {
      label: "Storage",
      value: `${Math.round((summary.totalBytes / (5 * 1024 ** 3)) * 100)}%`,
      sub: formatBytes(summary.totalBytes),
      icon: HardDrive,
    },
  ];

  return (
    <div className="space-y-8">
      <MediaPlatformNav />
      <p className="text-muted-foreground text-sm">
        Media library for {context.business.businessName ?? "your business"}.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
              <card.icon className="text-muted-foreground h-4 w-4" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{card.value}</p>
              <p className="text-muted-foreground text-xs">{card.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent files</CardTitle>
          <Link
            href={MEDIA_PLATFORM_ROUTES.library()}
            className="text-primary text-sm hover:underline"
          >
            View library
          </Link>
        </CardHeader>
        <CardContent>
          {recentFiles.length === 0 ? (
            <p className="text-muted-foreground text-sm">No files uploaded yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentFiles.map((file) => (
                <li key={file.id} className="flex items-center justify-between text-sm">
                  <Link
                    href={MEDIA_PLATFORM_ROUTES.fileDetail(file.id)}
                    className="font-medium hover:underline"
                  >
                    {file.name}
                  </Link>
                  <Badge variant="secondary">{file.fileType}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
