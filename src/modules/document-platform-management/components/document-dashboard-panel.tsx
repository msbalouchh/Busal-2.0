"use client";

import Link from "next/link";
import { FileText, FolderOpen, Archive, Files } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentPlatformNav } from "@/modules/document-platform-management/components/document-platform-nav";
import { DOCUMENT_PLATFORM_ROUTES } from "@/modules/document-platform-management/constants/routes";
import type { DocumentPlatformContext } from "@/modules/document-platform-management/lib/get-document-platform-context";
import type {
  DocumentRecord,
  DocumentSummaryRecord,
} from "@/modules/document-platform-management/types/document-platform-types";

interface DocumentDashboardPanelProps {
  context: DocumentPlatformContext;
  summary: DocumentSummaryRecord;
  recentDocuments: DocumentRecord[];
}

export function DocumentDashboardPanel({
  context,
  summary,
  recentDocuments,
}: DocumentDashboardPanelProps) {
  const cards = [
    { label: "Documents", value: summary.total, sub: `${summary.active} active`, icon: FileText },
    { label: "Archived", value: summary.archived, sub: "Stored documents", icon: Archive },
    { label: "Folders", value: summary.folders, sub: "Organized structure", icon: FolderOpen },
    { label: "Templates", value: summary.templates, sub: "Reusable layouts", icon: Files },
  ];

  return (
    <div className="space-y-8">
      <DocumentPlatformNav />
      <p className="text-muted-foreground text-sm">
        Document platform for {context.business.businessName ?? "your business"}.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
          <CardTitle className="text-base">Recent documents</CardTitle>
          <Link
            href={DOCUMENT_PLATFORM_ROUTES.library()}
            className="text-primary text-sm hover:underline"
          >
            View library
          </Link>
        </CardHeader>
        <CardContent>
          {recentDocuments.length === 0 ? (
            <p className="text-muted-foreground text-sm">No documents yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentDocuments.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between text-sm">
                  <Link
                    href={DOCUMENT_PLATFORM_ROUTES.documentDetail(doc.id)}
                    className="font-medium hover:underline"
                  >
                    {doc.name}
                  </Link>
                  <Badge variant="secondary">{doc.documentType}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
