"use client";

import Link from "next/link";
import { Bell, Calendar, ShoppingBag, Star } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CUSTOMER_PORTAL_ROUTES } from "@/modules/customer-portal/constants/routes";
import { formatPortalDate } from "@/modules/customer-portal/components/customer-portal-format";
import type {
  CustomerDashboardData,
  CustomerPortalContext,
} from "@/modules/customer-portal/types/customer-portal";

interface CustomerPortalDashboardPanelProps {
  context: CustomerPortalContext;
  dashboard: CustomerDashboardData;
}

export function CustomerPortalDashboardPanel({
  context,
  dashboard,
}: CustomerPortalDashboardPanelProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-muted-foreground text-sm font-medium">
            Loyalty points
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{dashboard.loyaltyPoints.toLocaleString()}</p>
          <p className="text-muted-foreground text-xs">{dashboard.loyaltyTier} tier</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-muted-foreground text-sm font-medium">Total orders</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{context.customer.totalOrders}</p>
          <p className="text-muted-foreground text-xs">
            {context.customer.totalSpendFormatted} spent
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-muted-foreground text-sm font-medium">
            Unread notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{dashboard.unreadNotifications}</p>
          <Link
            href={CUSTOMER_PORTAL_ROUTES.notifications}
            className="text-primary text-xs hover:underline"
          >
            View all
          </Link>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-muted-foreground text-sm font-medium">
            Active rewards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{dashboard.activeRewardsCount}</p>
          <Link
            href={CUSTOMER_PORTAL_ROUTES.rewards}
            className="text-primary text-xs hover:underline"
          >
            Browse rewards
          </Link>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShoppingBag className="h-4 w-4" />
            Recent orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dashboard.recentOrders.length === 0 ? (
            <EmptyState
              title="No orders yet"
              description="Your recent orders will appear here."
              icon={<ShoppingBag className="text-muted-foreground h-6 w-6" />}
            />
          ) : (
            <ul className="divide-y">
              {dashboard.recentOrders.map((order) => (
                <li key={order.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <Link
                      href={CUSTOMER_PORTAL_ROUTES.orderDetail(order.id)}
                      className="font-medium hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                    <p className="text-muted-foreground text-xs">
                      {formatPortalDate(order.placedAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{order.totalAmountFormatted}</p>
                    <Badge variant="secondary">{order.status}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4" />
            Upcoming reservations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dashboard.upcomingReservations.length === 0 ? (
            <EmptyState
              title="No upcoming reservations"
              description="Book a table to see reservations here."
              icon={<Calendar className="text-muted-foreground h-6 w-6" />}
            />
          ) : (
            <ul className="divide-y">
              {dashboard.upcomingReservations.map((reservation) => (
                <li key={reservation.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <Link
                      href={CUSTOMER_PORTAL_ROUTES.reservationDetail(reservation.id)}
                      className="font-medium hover:underline"
                    >
                      {reservation.reservationNumber}
                    </Link>
                    <p className="text-muted-foreground text-xs">
                      {formatPortalDate(reservation.scheduledAt)} · Party of {reservation.partySize}
                    </p>
                  </div>
                  <Badge variant="secondary">{reservation.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2 xl:col-span-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Star className="h-4 w-4" />
            Quick links
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Link href={CUSTOMER_PORTAL_ROUTES.loyalty}>
            <Badge variant="outline" className="cursor-pointer px-3 py-1">
              Loyalty
            </Badge>
          </Link>
          <Link href={CUSTOMER_PORTAL_ROUTES.wallet}>
            <Badge variant="outline" className="cursor-pointer px-3 py-1">
              Wallet
            </Badge>
          </Link>
          <Link href={CUSTOMER_PORTAL_ROUTES.support}>
            <Badge variant="outline" className="cursor-pointer px-3 py-1">
              Support
            </Badge>
          </Link>
          <Link href={CUSTOMER_PORTAL_ROUTES.notifications}>
            <Badge variant="outline" className="cursor-pointer px-3 py-1">
              <Bell className="mr-1 inline h-3 w-3" />
              Notifications
            </Badge>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
