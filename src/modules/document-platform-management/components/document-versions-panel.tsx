"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentPlatformNav } from "@/modules/document-platform-management/components/document-platform-nav";
import type {
  DocumentRecord,
  DocumentVersionRecord,
} from "@/modules/document-platform-management/types/document-platform-types";

interface DocumentVersionsPanelProps {
  document: DocumentRecord;
  versions: DocumentVersionRecord[];
}

export function DocumentVersionsPanel({ document, versions }: DocumentVersionsPanelProps) {
  return (
    <div className="space-y-8">
      <DocumentPlatformNav />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Version history — {document.name} (current v{document.version})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {versions.map((version) => (
              <li key={version.id} className="rounded border p-3 text-sm">
                <p className="font-medium">Version {version.version}</p>
                <p className="text-muted-foreground text-xs">{version.filePath}</p>
                <p className="text-muted-foreground text-xs">
                  Checksum: {version.checksum.slice(0, 16)}…
                </p>
                <p className="text-muted-foreground text-xs">
                  {new Date(version.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
