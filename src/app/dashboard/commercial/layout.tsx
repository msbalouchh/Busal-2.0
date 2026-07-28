import type { Metadata } from "next";

import { CommercialNav } from "@/modules/commercial/components/commercial-nav";

export const metadata: Metadata = {
  title: "Commercial Catalogue",
};

export default function CommercialLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Commercial Catalogue</h1>
        <p className="text-muted-foreground text-sm">
          Product categories, commercial products, bundles, and price books.
        </p>
      </div>
      <CommercialNav />
      {children}
    </div>
  );
}
