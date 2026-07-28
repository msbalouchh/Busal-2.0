import type { Metadata } from "next";

import { QuotesNav } from "@/modules/quotes/components/quotes-nav";

export const metadata: Metadata = {
  title: "Quotes & Proposals",
};

export default function QuotesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Quotes & Proposals</h1>
        <p className="text-muted-foreground text-sm">
          Quote builder, pricing engine, proposal templates, and client delivery.
        </p>
      </div>
      <QuotesNav />
      {children}
    </div>
  );
}
