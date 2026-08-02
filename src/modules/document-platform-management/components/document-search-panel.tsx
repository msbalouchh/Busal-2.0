"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DocumentPlatformNav } from "@/modules/document-platform-management/components/document-platform-nav";
import { DOCUMENT_PLATFORM_ROUTES } from "@/modules/document-platform-management/constants/routes";
import type {
  DocumentRecord,
  DocumentTemplateRecord,
} from "@/modules/document-platform-management/types/document-platform-types";

interface DocumentSearchPanelProps {
  search: string;
  results: { documents: DocumentRecord[]; templates: DocumentTemplateRecord[] };
}

function DocumentSearchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="flex max-w-xl gap-2"
      onSubmit={(formEvent) => {
        formEvent.preventDefault();
        startTransition(() => {
          router.push(`${DOCUMENT_PLATFORM_ROUTES.search()}?q=${encodeURIComponent(query.trim())}`);
        });
      }}
    >
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search documents..."
      />
      <Button type="submit" disabled={isPending}>
        Search
      </Button>
    </form>
  );
}

export function DocumentSearchPanel({ search, results }: DocumentSearchPanelProps) {
  return (
    <div className="space-y-8">
      <DocumentPlatformNav />

      <Suspense fallback={<div className="bg-muted h-10 max-w-xl animate-pulse rounded" />}>
        <DocumentSearchForm />
      </Suspense>

      {search ? (
        <p className="text-muted-foreground text-sm">Results for &quot;{search}&quot;</p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Documents ({results.documents.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {results.documents.map((doc) => (
                <li key={doc.id}>
                  <Link
                    href={DOCUMENT_PLATFORM_ROUTES.documentDetail(doc.id)}
                    className="font-medium hover:underline"
                  >
                    {doc.name}
                  </Link>
                  <Badge className="ml-2" variant="secondary">
                    {doc.documentType}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Templates ({results.templates.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {results.templates.map((template) => (
                <li key={template.id} className="text-sm">
                  {template.name}
                  <Badge className="ml-2" variant="outline">
                    {template.documentType}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
