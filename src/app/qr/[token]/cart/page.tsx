import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { QrCustomerCartPage } from "@/modules/qr-ordering-management/components/qr-customer-cart-page";
import { resolveQrSessionFromCookieAction } from "@/modules/qr-ordering-management/actions/qr-public-actions";
import { loadPublicQrMenu } from "@/services/restaurant-qr-ordering.service";

interface QrCartPageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Your cart" };
}

export default async function QrCartPage({ params }: QrCartPageProps) {
  const { token } = await params;

  try {
    const session = await resolveQrSessionFromCookieAction(token);
    await loadPublicQrMenu(session.token);

    return <QrCustomerCartPage tableToken={token} session={session} />;
  } catch {
    notFound();
  }
}
