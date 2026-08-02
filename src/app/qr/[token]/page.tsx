import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { QrCustomerMenu } from "@/modules/qr-ordering-management/components/qr-customer-menu";
import { resolveQrSessionFromCookieAction } from "@/modules/qr-ordering-management/actions/qr-public-actions";
import { loadPublicQrMenu } from "@/services/restaurant-qr-ordering.service";

interface QrEntryPageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Order from your table" };
}

export default async function QrEntryPage({ params }: QrEntryPageProps) {
  const { token } = await params;

  try {
    const session = await resolveQrSessionFromCookieAction(token);
    const menu = await loadPublicQrMenu(session.token);

    return (
      <QrCustomerMenu
        tableToken={token}
        session={menu.session}
        categories={menu.categories}
        products={menu.products}
      />
    );
  } catch {
    notFound();
  }
}
