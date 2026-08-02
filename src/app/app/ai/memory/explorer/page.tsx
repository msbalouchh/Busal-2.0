import type { Metadata } from "next";
import { Brain } from "lucide-react";
import type { MemoryType } from "@prisma/client";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { MemoryExplorerPanel } from "@/modules/ai-memory-management/components/memory-explorer-panel";
import { getMemoryExplorerContext } from "@/modules/ai-memory-management/lib/get-ai-memory-context";

interface PageProps {
  searchParams: Promise<{ search?: string; memoryType?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Memory Explorer" };
}

export default async function AiMemoryExplorerPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const context = await getMemoryExplorerContext({
    search: params.search,
    memoryType: (params.memoryType as MemoryType | "ALL") ?? "ALL",
    pageSize: 24,
  });

  return (
    <ApplicationPageTemplate
      title="Memory Explorer"
      description="Browse and filter business, customer, staff, and agent memories."
      icon={Brain}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Memory", href: "/app/ai/memory" },
        { label: "Explorer" },
      ]}
    >
      <MemoryExplorerPanel context={context} list={context.list} />
    </ApplicationPageTemplate>
  );
}
