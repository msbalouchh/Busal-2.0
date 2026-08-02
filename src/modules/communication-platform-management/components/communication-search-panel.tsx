"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CommunicationPlatformNav } from "@/modules/communication-platform-management/components/communication-platform-nav";
import { COMMUNICATION_PLATFORM_ROUTES } from "@/modules/communication-platform-management/constants/routes";
import type {
  CommunicationMessageRecord,
  CommunicationTemplateRecord,
} from "@/modules/communication-platform-management/types/communication-platform-types";

interface CommunicationSearchPanelProps {
  search: string;
  results: {
    messages: CommunicationMessageRecord[];
    templates: CommunicationTemplateRecord[];
  };
}

function CommunicationSearchForm() {
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
          router.push(
            `${COMMUNICATION_PLATFORM_ROUTES.search()}?q=${encodeURIComponent(query.trim())}`,
          );
        });
      }}
    >
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search messages and templates..."
      />
      <Button type="submit" disabled={isPending}>
        Search
      </Button>
    </form>
  );
}

export function CommunicationSearchPanel({ search, results }: CommunicationSearchPanelProps) {
  return (
    <div className="space-y-8">
      <CommunicationPlatformNav />

      <Suspense fallback={<div className="bg-muted h-10 max-w-xl animate-pulse rounded" />}>
        <CommunicationSearchForm />
      </Suspense>

      {search ? (
        <p className="text-muted-foreground text-sm">Results for &quot;{search}&quot;</p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Messages ({results.messages.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {results.messages.map((message) => (
                <li key={message.id} className="text-sm">
                  {message.recipient}
                  <Badge className="ml-2" variant="secondary">
                    {message.status}
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
                    {template.channel}
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
