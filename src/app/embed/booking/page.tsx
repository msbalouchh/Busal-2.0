import type { Metadata } from "next";

import { EmbedBookingWidget } from "@/modules/platform/components/embed-booking-widget";
import { verifyEmbedToken } from "@/modules/platform/services/platform-embed.service";

export const metadata: Metadata = {
  title: "Booking",
};

interface EmbedBookingPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function EmbedBookingPage({ searchParams }: EmbedBookingPageProps) {
  const params = await searchParams;
  const token = params.token ?? "";
  const payload = token ? verifyEmbedToken(token) : null;

  if (!payload || payload.widgetType !== "booking") {
    return (
      <main className="bg-background text-foreground mx-auto max-w-lg p-6">
        <p className="text-destructive text-sm">Invalid or expired embed token.</p>
      </main>
    );
  }

  return (
    <main className="bg-background text-foreground mx-auto max-w-lg p-6">
      <EmbedBookingWidget businessId={payload.businessId} token={token} />
    </main>
  );
}
