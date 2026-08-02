"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { CONTROL_CENTER_ROUTES } from "@/modules/control-center/constants/routes";
import { queryControlCenterTenantsAction } from "@/modules/control-center/tenants/actions/control-center-tenant-actions";

export function ControlCenterGlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    Array<{ id: string; businessName: string; ownerEmail: string }>
  >([]);
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
        const response = await queryControlCenterTenantsAction({
          search: value,
          page: 1,
          pageSize: 8,
        });
        setResults(
          response.items.map((tenant) => ({
            id: tenant.businessId,
            businessName: tenant.businessName,
            ownerEmail: tenant.ownerEmail,
          })),
        );
      } catch {
        setError("Platform search is unavailable right now.");
        setResults([]);
      }
    });
  }

  function navigateToTenant(businessId: string) {
    setOpen(false);
    router.push(`${CONTROL_CENTER_ROUTES.tenants}/${businessId}`);
  }

  return (
    <>
      <Button
        variant="outline"
        className="hidden h-9 w-full max-w-xs justify-start gap-2 md:inline-flex"
        onClick={() => setOpen(true)}
        aria-label="Open platform search"
        aria-keyshortcuts="Control+K Meta+K"
      >
        <Search className="text-muted-foreground h-4 w-4" />
        <span className="text-muted-foreground text-sm">Search tenants...</span>
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open platform search"
      >
        <Search className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Platform Search</DialogTitle>
            <DialogDescription>
              Search tenants, businesses, and owner accounts across the platform.
            </DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            value={query}
            onChange={(event) => handleSearch(event.target.value)}
            placeholder="Search business name or owner email..."
            aria-label="Search query"
            onKeyDown={(event) => {
              if (event.key === "Enter" && results[0]) {
                event.preventDefault();
                navigateToTenant(results[0].id);
              }
            }}
          />
          <div className="max-h-72 space-y-2 overflow-y-auto">
            {isPending ? <p className="text-muted-foreground text-sm">Searching...</p> : null}
            {error ? <p className="text-destructive text-sm">{error}</p> : null}
            {!isPending && !error && results.length === 0 && query.trim().length >= 2 ? (
              <p className="text-muted-foreground text-sm">No tenants found.</p>
            ) : null}
            {results.map((result) => (
              <button
                key={result.id}
                type="button"
                className="hover:bg-accent w-full rounded-md border p-3 text-left"
                onClick={() => navigateToTenant(result.id)}
              >
                <p className="text-sm font-medium">{result.businessName}</p>
                <p className="text-muted-foreground text-xs">{result.ownerEmail}</p>
              </button>
            ))}
          </div>
          <Button asChild variant="link" className="px-0">
            <Link href={CONTROL_CENTER_ROUTES.tenants}>Open tenant directory</Link>
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
