"use client";

import Link from "next/link";
import { useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  archiveDocumentAction,
  createDocumentAction,
  deleteDocumentAction,
  duplicateDocumentAction,
  exportDocumentAction,
  restoreDocumentAction,
} from "@/modules/document-platform-management/actions/document-platform-actions";
import { DocumentPlatformNav } from "@/modules/document-platform-management/components/document-platform-nav";
import { DOCUMENT_PLATFORM_ROUTES } from "@/modules/document-platform-management/constants/routes";
import type { DocumentPlatformContext } from "@/modules/document-platform-management/lib/get-document-platform-context";
import type { DocumentRecord } from "@/modules/document-platform-management/types/document-platform-types";

interface DocumentLibraryPanelProps {
  context: DocumentPlatformContext;
  documents: DocumentRecord[];
}

export function DocumentLibraryPanel({ context, documents }: DocumentLibraryPanelProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-8">
      <DocumentPlatformNav />

      {context.permissionsFlags.canCreate ? (
        <Button
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await createDocumentAction({
                name: "New Invoice",
                slug: `invoice-${Date.now()}`,
                documentType: "INVOICE",
              });
            })
          }
        >
          New document
        </Button>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Document library ({documents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {documents.length === 0 ? (
              <li className="text-muted-foreground text-sm">No documents yet.</li>
            ) : (
              documents.map((doc) => (
                <li
                  key={doc.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded border p-3 text-sm"
                >
                  <div>
                    <Link
                      href={DOCUMENT_PLATFORM_ROUTES.documentDetail(doc.id)}
                      className="font-medium hover:underline"
                    >
                      {doc.name}
                    </Link>
                    <div className="mt-1 flex gap-2">
                      <Badge variant="outline">{doc.documentType}</Badge>
                      <Badge variant="secondary">{doc.status}</Badge>
                      <Badge variant="outline">v{doc.version}</Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {context.permissionsFlags.canExport ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() =>
                          startTransition(async () => {
                            await exportDocumentAction(doc.id, "PDF");
                          })
                        }
                      >
                        Export
                      </Button>
                    ) : null}
                    {context.permissionsFlags.canCreate ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() =>
                          startTransition(async () => {
                            await duplicateDocumentAction(doc.id);
                          })
                        }
                      >
                        Duplicate
                      </Button>
                    ) : null}
                    {context.permissionsFlags.canUpdate && doc.status !== "ARCHIVED" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() =>
                          startTransition(async () => {
                            await archiveDocumentAction(doc.id);
                          })
                        }
                      >
                        Archive
                      </Button>
                    ) : null}
                    {context.permissionsFlags.canUpdate && doc.status === "ARCHIVED" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() =>
                          startTransition(async () => {
                            await restoreDocumentAction(doc.id);
                          })
                        }
                      >
                        Restore
                      </Button>
                    ) : null}
                    {context.permissionsFlags.canDelete ? (
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={isPending}
                        onClick={() =>
                          startTransition(async () => {
                            await deleteDocumentAction(doc.id);
                          })
                        }
                      >
                        Delete
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
