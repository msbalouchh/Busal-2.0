"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "@/lib/motion";
import { cn } from "@/lib/utils";
import {
  filterApplicationSearchItems,
  type ApplicationSearchItem,
} from "@/modules/application-shell/constants/search-items";

export function CommandSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const results = useMemo(() => filterApplicationSearchItems(query), [query]);

  const groupedResults = useMemo(() => {
    const groups = new Map<string, ApplicationSearchItem[]>();

    for (const item of results) {
      const existing = groups.get(item.group) ?? [];
      existing.push(item);
      groups.set(item.group, existing);
    }

    return Array.from(groups.entries());
  }, [results]);

  const navigateTo = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);

    if (value.trim().length >= 2) {
      setIsSearching(true);
      window.setTimeout(() => setIsSearching(false), 280);
    } else {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setIsSearching(false);
    }
  }, [open]);

  return (
    <>
      <Button
        variant="outline"
        className={cn(
          "text-muted-foreground hidden h-9 w-full max-w-xs justify-between gap-2 px-3 md:inline-flex",
          motion.transitionColors,
          motion.buttonPress,
        )}
        onClick={() => setOpen(true)}
        aria-label="Open command search"
        aria-keyshortcuts="Control+K Meta+K"
      >
        <span className="flex items-center gap-2">
          <Search className="h-4 w-4" aria-hidden="true" />
          <span className="text-sm">Search Busal OS...</span>
        </span>
        <kbd className="bg-muted text-muted-foreground pointer-events-none hidden rounded border px-1.5 py-0.5 font-mono text-[10px] sm:inline-block">
          ⌘K
        </kbd>
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className={cn("md:hidden", motion.buttonPress)}
        onClick={() => setOpen(true)}
        aria-label="Open command search"
      >
        <Search className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
          <DialogHeader className="space-y-0 border-b px-4 py-3">
            <DialogTitle className="sr-only">Command search</DialogTitle>
            <DialogDescription className="sr-only">
              Search navigation, actions, and modules across Busal OS
            </DialogDescription>
            <div className="relative">
              <Search
                className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
                aria-hidden="true"
              />
              <Input
                autoFocus
                value={query}
                onChange={(event) => handleQueryChange(event.target.value)}
                placeholder="Search navigation, actions, modules..."
                className="border-0 pl-9 shadow-none focus-visible:ring-0"
                aria-label="Search query"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && results[0]) {
                    event.preventDefault();
                    navigateTo(results[0].href);
                  }
                }}
              />
            </div>
          </DialogHeader>

          <div className="max-h-80 overflow-y-auto p-2" role="listbox" aria-label="Search results">
            {isSearching ? (
              <div className="space-y-2 p-2" aria-busy="true" aria-label="Searching">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-12 w-full" />
                ))}
              </div>
            ) : groupedResults.length === 0 ? (
              <p className="text-muted-foreground px-3 py-6 text-center text-sm">
                No results for &ldquo;{query}&rdquo;
              </p>
            ) : (
              groupedResults.map(([group, items]) => (
                <div key={group} className="mb-2">
                  <p className="text-muted-foreground px-2 py-1.5 text-xs font-medium tracking-wide uppercase">
                    {group}
                  </p>
                  <ul className="space-y-0.5">
                    {items.map((item) => {
                      const Icon = item.icon;

                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            className={cn(
                              "hover:bg-accent flex w-full items-center gap-3 rounded-md px-2 py-2.5 text-left",
                              motion.transitionColors,
                            )}
                            role="option"
                            aria-selected="false"
                            onClick={() => navigateTo(item.href)}
                          >
                            <span className="bg-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
                              <Icon className="h-4 w-4" aria-hidden="true" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium">
                                {item.label}
                              </span>
                              <span className="text-muted-foreground block truncate text-xs">
                                {item.description}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))
            )}
          </div>

          <div className="text-muted-foreground border-t px-4 py-2 text-xs">
            Enter to open · Esc to close · ⌘K to toggle
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
