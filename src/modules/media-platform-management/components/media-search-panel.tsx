"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MediaPlatformNav } from "@/modules/media-platform-management/components/media-platform-nav";
import { MEDIA_PLATFORM_ROUTES } from "@/modules/media-platform-management/constants/routes";
import type {
  MediaFileRecord,
  MediaTagRecord,
} from "@/modules/media-platform-management/types/media-platform-types";

interface MediaSearchPanelProps {
  search: string;
  results: { files: MediaFileRecord[]; tags: MediaTagRecord[] };
}

export function MediaSearchPanel({ search, results }: MediaSearchPanelProps) {
  const router = useRouter();
  const [query, setQuery] = useState(search);

  function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    router.push(`${MEDIA_PLATFORM_ROUTES.search()}?${params.toString()}`);
  }

  return (
    <div className="space-y-8">
      <MediaPlatformNav />

      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search files..."
        />
        <Button type="submit">Search</Button>
      </form>

      {search ? (
        <p className="text-muted-foreground text-sm">Results for &quot;{search}&quot;</p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Files</CardTitle>
          </CardHeader>
          <CardContent>
            {results.files.length === 0 ? (
              <p className="text-muted-foreground text-sm">No files found.</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {results.files.map((file) => (
                  <li key={file.id} className="flex items-center justify-between">
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tags</CardTitle>
          </CardHeader>
          <CardContent>
            {results.tags.length === 0 ? (
              <p className="text-muted-foreground text-sm">No tags found.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {results.tags.map((tag) => (
                  <li key={tag.id}>{tag.name}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
