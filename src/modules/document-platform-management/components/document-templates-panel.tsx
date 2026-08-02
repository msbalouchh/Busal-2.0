"use client";

import { useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createDocumentTemplateAction,
  deleteDocumentTemplateAction,
} from "@/modules/document-platform-management/actions/document-platform-actions";
import { DocumentPlatformNav } from "@/modules/document-platform-management/components/document-platform-nav";
import { DOCUMENT_TYPE_OPTIONS } from "@/modules/document-platform-management/constants/routes";
import type { DocumentPlatformContext } from "@/modules/document-platform-management/lib/get-document-platform-context";
import type { DocumentTemplateRecord } from "@/modules/document-platform-management/types/document-platform-types";

interface DocumentTemplatesPanelProps {
  context: DocumentPlatformContext;
  templates: DocumentTemplateRecord[];
}

export function DocumentTemplatesPanel({ context, templates }: DocumentTemplatesPanelProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState('{"title":"{{title}}"}');
  const [documentType, setDocumentType] =
    useState<(typeof DOCUMENT_TYPE_OPTIONS)[number]["value"]>("INVOICE");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-8">
      <DocumentPlatformNav />

      {context.permissionsFlags.canCreate ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Template builder</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid max-w-xl gap-4"
              onSubmit={(formEvent) => {
                formEvent.preventDefault();
                startTransition(async () => {
                  await createDocumentTemplateAction({ name, slug, documentType, content });
                  setName("");
                  setSlug("");
                });
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="template-name">Name</Label>
                <Input
                  id="template-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-slug">Slug</Label>
                <Input
                  id="template-slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-type">Type</Label>
                <select
                  id="template-type"
                  value={documentType}
                  onChange={(e) =>
                    setDocumentType(
                      e.target.value as (typeof DOCUMENT_TYPE_OPTIONS)[number]["value"],
                    )
                  }
                  className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                >
                  {DOCUMENT_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-content">Content</Label>
                <Input
                  id="template-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={isPending}>
                Create template
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Templates ({templates.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {templates.length === 0 ? (
              <li className="text-muted-foreground text-sm">No templates yet.</li>
            ) : (
              templates.map((template) => (
                <li
                  key={template.id}
                  className="flex items-center justify-between rounded border p-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{template.name}</p>
                    <Badge variant="outline">{template.documentType}</Badge>
                  </div>
                  {context.permissionsFlags.canDelete ? (
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={isPending}
                      onClick={() =>
                        startTransition(async () => {
                          await deleteDocumentTemplateAction(template.id);
                        })
                      }
                    >
                      Delete
                    </Button>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
