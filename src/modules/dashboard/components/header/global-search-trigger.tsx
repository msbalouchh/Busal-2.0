"use client";

import { Plus, Search } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { runGlobalSearchAction } from "@/modules/search-platform/actions/search-actions";
import { SEARCH_PLATFORM_ROUTES } from "@/modules/search-platform/constants/routes";
import Link from "next/link";

export function GlobalSearchTrigger() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Array<{ id: string; title: string; subtitle?: string }>>(
    [],
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSearch(value: string) {
    setQuery(value);
    setError(null);

    if (value.trim().length < 2) {
      setResults([]);
      return;
    }

    startTransition(async () => {
      try {
        const response = await runGlobalSearchAction({ query: value, pageSize: 8 });
        setResults(
          response.groups.flatMap((group) =>
            group.results.map((result) => ({
              id: result.id,
              title: result.title,
              subtitle: result.description,
            })),
          ),
        );
      } catch {
        setError("Search is unavailable right now.");
        setResults([]);
      }
    });
  }

  return (
    <>
      <Button
        variant="outline"
        className="hidden h-9 w-full max-w-xs justify-start gap-2 md:inline-flex"
        onClick={() => setOpen(true)}
        aria-label="Open global search"
      >
        <Search className="text-muted-foreground h-4 w-4" />
        <span className="text-muted-foreground text-sm">Search...</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Global Search</DialogTitle>
            <DialogDescription>Search across your business data and modules.</DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            value={query}
            onChange={(event) => handleSearch(event.target.value)}
            placeholder="Search orders, customers, menu items..."
            aria-label="Search query"
          />
          <div className="max-h-72 space-y-2 overflow-y-auto">
            {isPending ? <p className="text-muted-foreground text-sm">Searching...</p> : null}
            {error ? <p className="text-destructive text-sm">{error}</p> : null}
            {!isPending && !error && results.length === 0 && query.trim().length >= 2 ? (
              <p className="text-muted-foreground text-sm">No results found.</p>
            ) : null}
            {results.map((result) => (
              <div key={result.id} className="rounded-md border p-3">
                <p className="text-sm font-medium">{result.title}</p>
                {result.subtitle ? (
                  <p className="text-muted-foreground text-xs">{result.subtitle}</p>
                ) : null}
              </div>
            ))}
          </div>
          <Button asChild variant="link" className="px-0">
            <Link href={SEARCH_PLATFORM_ROUTES.overview}>Open search platform</Link>
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function QuickActionsMenu() {
  return (
    <Button asChild variant="ghost" size="icon" className="md:hidden" aria-label="Quick actions">
      <Link href="/dashboard">
        <Plus className="h-4 w-4" />
      </Link>
    </Button>
  );
}
