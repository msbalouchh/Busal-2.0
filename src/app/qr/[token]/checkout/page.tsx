import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { QrCheckoutClient } from "@/modules/qr-ordering-management/components/qr-checkout-client";
import { QR_PUBLIC_ROUTES } from "@/modules/qr-ordering-management/constants/routes";
import { resolveQrSessionFromCookieAction } from "@/modules/qr-ordering-management/actions/qr-public-actions";
import { loadPublicQrMenu } from "@/services/restaurant-qr-ordering.service";

interface QrCheckoutPageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Checkout" };
}

export default async function QrCheckoutPage({ params }: QrCheckoutPageProps) {
  const { token } = await params;

  try {
    const session = await resolveQrSessionFromCookieAction(token);
    const menu = await loadPublicQrMenu(session.token);

    return (
      <div className="mx-auto min-h-screen max-w-lg px-4 py-6">
        <Button type="button" variant="ghost" size="sm" asChild className="mb-4">
          <Link href={QR_PUBLIC_ROUTES.menu(token)}>← Back to menu</Link>
        </Button>
        <QrCheckoutClient tableToken={token} session={menu.session} />
      </div>
    );
  } catch {
    notFound();
  }
}
