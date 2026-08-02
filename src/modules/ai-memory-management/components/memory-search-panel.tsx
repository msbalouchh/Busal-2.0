"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MemoryNav } from "@/modules/ai-memory-management/components/memory-nav";
import { AI_MEMORY_ROUTES } from "@/modules/ai-memory-management/constants/routes";
import type { AiMemoryContext } from "@/modules/ai-memory-management/lib/get-ai-memory-context";
import type {
  MemoryListResult,
  MemorySearchQuery,
} from "@/modules/ai-memory-management/types/ai-memory-types";

interface MemorySearchPanelProps {
  context: AiMemoryContext;
  results: MemoryListResult;
  query: MemorySearchQuery;
}

const CONTEXT_SCOPES = [
  { value: "ALL", label: "All scopes" },
  { value: "business", label: "Business" },
  { value: "customer", label: "Customer" },
  { value: "staff", label: "Staff" },
  { value: "conversation", label: "Conversation" },
  { value: "agent", label: "Agent" },
] as const;

export function MemorySearchPanel({ results, query }: MemorySearchPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(query.search ?? "");
  const [semanticQuery, setSemanticQuery] = useState(query.semanticQuery ?? "");
  const [contextScope, setContextScope] = useState<string>(query.contextScope ?? "ALL");

  const runSearch = () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (semanticQuery.trim()) params.set("semanticQuery", semanticQuery.trim());
    if (contextScope !== "ALL") params.set("contextScope", contextScope);
    startTransition(() => {
      router.push(`${AI_MEMORY_ROUTES.search()}?${params.toString()}`);
    });
  };

  return (
    <div className="space-y-8">
      <MemoryNav />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Memory Search</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-2">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Keyword search"
              aria-label="Keyword search"
            />
            <Input
              value={semanticQuery}
              onChange={(event) => setSemanticQuery(event.target.value)}
              placeholder="Semantic search query (abstraction layer)"
              aria-label="Semantic search query"
            />
          </div>
          <div className="flex flex-col gap-3 lg:flex-row">
            <select
              value={contextScope}
              onChange={(event) => setContextScope(event.target.value)}
              className="border-input bg-background ring-offset-background focus-visible:ring-ring h-10 rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none lg:w-56"
              aria-label="Context scope"
            >
              {CONTEXT_SCOPES.map((scope) => (
                <option key={scope.value} value={scope.value}>
                  {scope.label}
                </option>
              ))}
            </select>
            <Button onClick={runSearch} disabled={isPending}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Search
            </Button>
          </div>

          <p className="text-muted-foreground text-sm">
            Keyword search is active. Semantic search uses the provider-agnostic abstraction layer
            and falls back to keyword matching until an embedding provider is connected.
          </p>

          {results.items.length === 0 ? (
            <p className="text-muted-foreground text-sm">No search results found.</p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {results.items.map((memory) => (
                <li key={memory.id} className="p-4">
                  <Link
                    href={AI_MEMORY_ROUTES.memory(memory.id)}
                    className="hover:text-primary font-medium transition-colors"
                  >
                    {memory.title}
                  </Link>
                  <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                    {memory.content}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
