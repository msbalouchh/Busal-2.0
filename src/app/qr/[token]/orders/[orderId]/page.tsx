import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { QrOrderTrackingPanel } from "@/modules/qr-ordering-management/components/qr-order-tracking-panel";
import { QR_PUBLIC_ROUTES } from "@/modules/qr-ordering-management/constants/routes";
import { resolveQrSessionFromCookieAction } from "@/modules/qr-ordering-management/actions/qr-public-actions";
import { getQrOrderTracking } from "@/services/restaurant-qr-ordering.service";

interface QrOrderTrackingPageProps {
  params: Promise<{ token: string; orderId: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Order tracking" };
}

export default async function QrOrderTrackingPage({ params }: QrOrderTrackingPageProps) {
  const { token, orderId } = await params;

  try {
    const session = await resolveQrSessionFromCookieAction(token);
    const order = await getQrOrderTracking(session.token, orderId);

    return (
      <div className="mx-auto min-h-screen max-w-lg px-4 py-6">
        <Button type="button" variant="ghost" size="sm" asChild className="mb-4">
          <Link href={QR_PUBLIC_ROUTES.orders(token)}>← Back to orders</Link>
        </Button>
        <QrOrderTrackingPanel order={order} />
      </div>
    );
  } catch {
    notFound();
  }
}
