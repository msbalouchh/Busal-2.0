"use client";

import Link from "next/link";
import { useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  exportDocumentAction,
  duplicateDocumentAction,
} from "@/modules/document-platform-management/actions/document-platform-actions";
import { DocumentPlatformNav } from "@/modules/document-platform-management/components/document-platform-nav";
import { DOCUMENT_PLATFORM_ROUTES } from "@/modules/document-platform-management/constants/routes";
import type { DocumentPlatformContext } from "@/modules/document-platform-management/lib/get-document-platform-context";
import type {
  DocumentPreviewRecord,
  DocumentRecord,
} from "@/modules/document-platform-management/types/document-platform-types";

interface DocumentViewerPanelProps {
  context: DocumentPlatformContext;
  document: DocumentRecord;
  preview: DocumentPreviewRecord | null;
}

export function DocumentViewerPanel({ context, document, preview }: DocumentViewerPanelProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-8">
      <DocumentPlatformNav />

      <div>
        <h2 className="text-xl font-semibold">{document.name}</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge>{document.documentType}</Badge>
          <Badge variant="secondary">{document.status}</Badge>
          <Badge variant="outline">v{document.version}</Badge>
          {preview ? (
            <Badge variant={preview.checksumValid ? "outline" : "destructive"}>
              {preview.checksumValid ? "Checksum valid" : "Checksum invalid"}
            </Badge>
          ) : null}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted overflow-x-auto rounded p-4 text-xs">
            {preview?.content ?? "{}"}
          </pre>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Link href={DOCUMENT_PLATFORM_ROUTES.documentVersions(document.id)}>
          <Button variant="outline">Version history</Button>
        </Link>
        {context.permissionsFlags.canExport ? (
          <Button
            variant="outline"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await exportDocumentAction(document.id, "PDF");
              })
            }
          >
            Export PDF
          </Button>
        ) : null}
        {context.permissionsFlags.canCreate ? (
          <Button
            variant="outline"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await duplicateDocumentAction(document.id);
              })
            }
          >
            Duplicate
          </Button>
        ) : null}
      </div>
    </div>
  );
}
