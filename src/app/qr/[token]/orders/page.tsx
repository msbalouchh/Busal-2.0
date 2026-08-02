import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { formatQrCurrency } from "@/modules/qr-ordering-management/lib/qr-cart-utils";
import { QR_PUBLIC_ROUTES } from "@/modules/qr-ordering-management/constants/routes";
import { resolveQrSessionFromCookieAction } from "@/modules/qr-ordering-management/actions/qr-public-actions";
import { listQrSessionOrders } from "@/services/restaurant-qr-ordering.service";

interface QrOrdersPageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Your orders" };
}

export default async function QrOrdersPage({ params }: QrOrdersPageProps) {
  const { token } = await params;

  try {
    const session = await resolveQrSessionFromCookieAction(token);
    const orders = await listQrSessionOrders(session.token);

    return (
      <div className="mx-auto min-h-screen max-w-lg px-4 py-6 pb-24">
        <Button type="button" variant="ghost" size="sm" asChild className="mb-4">
          <Link href={QR_PUBLIC_ROUTES.menu(token)}>← Back to menu</Link>
        </Button>
        <h1 className="mb-4 text-2xl font-semibold">Your orders</h1>
        <div className="space-y-3">
          {orders.length === 0 ? (
            <p className="text-muted-foreground text-sm">No orders yet.</p>
          ) : (
            orders.map((order) => (
              <Link
                key={order.id}
                href={QR_PUBLIC_ROUTES.orderTracking(token, order.id)}
                className="hover:bg-muted/40 block rounded-xl border p-4 transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{order.orderNumber}</p>
                    <p className="text-muted-foreground text-sm">
                      {new Date(order.placedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatQrCurrency(order.totalAmount)}</p>
                    <p className="text-muted-foreground text-sm">{order.kitchenStatus}</p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    );
  } catch {
    notFound();
  }
}
