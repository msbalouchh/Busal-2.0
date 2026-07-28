import type { Metadata } from "next";

import { SearchPlatformNav } from "@/modules/search-platform/components/search-platform-nav";

export const metadata: Metadata = {
  title: "Global Search & Indexing",
};

export default function SearchPlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Global Search & Indexing Platform</h1>
        <p className="text-muted-foreground text-sm">
          Centralized search service and universal index across every Busal module.
        </p>
      </div>
      <SearchPlatformNav />
      {children}
    </div>
  );
}
