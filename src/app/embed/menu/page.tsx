import type { Metadata } from "next";

import { EmbedMenuWidget } from "@/modules/platform/components/embed-menu-widget";
import { verifyEmbedToken } from "@/modules/platform/services/platform-embed.service";

export const metadata: Metadata = {
  title: "Menu",
};

interface EmbedMenuPageProps {
  searchParams: Promise<{ token?: string; businessId?: string }>;
}

export default async function EmbedMenuPage({ searchParams }: EmbedMenuPageProps) {
  const params = await searchParams;
  const token = params.token ?? "";
  const payload = token ? verifyEmbedToken(token) : null;

  if (!payload || payload.widgetType !== "menu") {
    return (
      <main className="bg-background text-foreground mx-auto max-w-lg p-6">
        <p className="text-destructive text-sm">Invalid or expired embed token.</p>
      </main>
    );
  }

  return (
    <main className="bg-background text-foreground mx-auto max-w-lg p-6">
      <EmbedMenuWidget businessId={payload.businessId} token={token} />
    </main>
  );
}
