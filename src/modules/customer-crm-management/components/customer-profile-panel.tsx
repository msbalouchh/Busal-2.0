"use client";

import Link from "next/link";
import { Gift, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddressManagerPanel } from "@/modules/customer-crm-management/components/address-manager-panel";
import { CustomerStatusBadge } from "@/modules/customer-crm-management/components/customer-status-badge";
import { MembershipCard } from "@/modules/customer-crm-management/components/membership-card";
import { CUSTOMER_CRM_ROUTES } from "@/modules/customer-crm-management/constants/routes";
import { LOYALTY_TRANSACTION_LABELS } from "@/modules/customer-crm-management/lib/customer-crm-validation";
import type { CustomerCrmPermissions } from "@/modules/customer-crm-management/lib/get-customer-crm-context";
import type { CustomerProfileBundle } from "@/modules/customer-crm-management/types/customer-crm-types";

interface CustomerProfilePanelProps {
  profile: CustomerProfileBundle;
  permissionsFlags: CustomerCrmPermissions;
}

export function CustomerProfilePanel({ profile, permissionsFlags }: CustomerProfilePanelProps) {
  const { customer } = profile;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-semibold">{customer.name}</h2>
            <CustomerStatusBadge status={customer.status} />
          </div>
          <p className="text-muted-foreground text-sm">
            {customer.customerCode ?? "No code"} · Joined{" "}
            {new Date(customer.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {permissionsFlags.canViewLoyalty && customer.loyaltyAccount ? (
            <Button asChild variant="outline">
              <Link href={CUSTOMER_CRM_ROUTES.loyalty(customer.id)}>
                <Gift className="mr-2 h-4 w-4" />
                Loyalty
              </Link>
            </Button>
          ) : null}
          {permissionsFlags.canUpdate ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`${CUSTOMER_CRM_ROUTES.profile(customer.id)}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle>Customer details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <DetailItem label="Email" value={customer.email ?? "—"} />
              <DetailItem label="Phone" value={customer.phone ?? "—"} />
              <DetailItem label="Date of birth" value={customer.dateOfBirth ?? "—"} />
              <DetailItem label="Gender" value={customer.gender ?? "—"} />
              <DetailItem label="Language" value={customer.preferredLanguage ?? "—"} />
              <DetailItem
                label="Marketing consent"
                value={customer.marketingConsent ? "Yes" : "No"}
              />
              <DetailItem label="Total orders" value={String(customer.totalOrders)} />
              <DetailItem label="Total spend" value={`£${customer.totalSpend.toFixed(2)}`} />
              <DetailItem
                label="Average order"
                value={`£${customer.averageOrderValue.toFixed(2)}`}
              />
              <DetailItem
                label="Last order"
                value={customer.lastOrderAt ? new Date(customer.lastOrderAt).toLocaleString() : "—"}
              />
              <DetailItem
                label="Tags"
                value={customer.tags.length ? customer.tags.join(", ") : "—"}
              />
              <DetailItem label="Notes" value={customer.notes ?? "—"} />
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.timeline.length === 0 ? (
                <p className="text-muted-foreground text-sm">No activity yet.</p>
              ) : (
                profile.timeline.map((event) => (
                  <div key={event.id} className="border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{event.title}</p>
                      <span className="text-muted-foreground text-xs">
                        {new Date(event.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {event.description ? (
                      <p className="text-muted-foreground mt-1 text-sm">{event.description}</p>
                    ) : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <HistorySection
            title="Order history"
            emptyLabel="No orders yet."
            count={profile.orders.length}
          >
            {profile.orders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between border-b py-3 last:border-0"
              >
                <div>
                  <p className="font-medium">{order.orderNumber}</p>
                  <p className="text-muted-foreground text-sm">
                    {order.orderType} · {new Date(order.placedAt).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p>£{order.totalAmount.toFixed(2)}</p>
                  <p className="text-muted-foreground text-sm">{order.status}</p>
                </div>
              </div>
            ))}
          </HistorySection>

          <HistorySection
            title="Reservation history"
            emptyLabel="No reservations yet."
            count={profile.reservations.length}
          >
            {profile.reservations.map((reservation) => (
              <div
                key={reservation.id}
                className="flex items-center justify-between border-b py-3 last:border-0"
              >
                <div>
                  <p className="font-medium">{reservation.reservationNumber}</p>
                  <p className="text-muted-foreground text-sm">
                    Party of {reservation.partySize} ·{" "}
                    {new Date(reservation.scheduledAt).toLocaleString()}
                  </p>
                </div>
                <p className="text-muted-foreground text-sm">{reservation.status}</p>
              </div>
            ))}
          </HistorySection>

          <HistorySection
            title="Payment history"
            emptyLabel="No payments yet."
            count={profile.payments.length}
          >
            {profile.payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between border-b py-3 last:border-0"
              >
                <div>
                  <p className="font-medium">{payment.paymentNumber}</p>
                  <p className="text-muted-foreground text-sm">
                    {payment.paymentMethod} ·{" "}
                    {payment.paidAt ? new Date(payment.paidAt).toLocaleString() : "Pending"}
                  </p>
                </div>
                <p>£{payment.amountPaid.toFixed(2)}</p>
              </div>
            ))}
          </HistorySection>
        </div>

        <div className="space-y-6">
          {customer.loyaltyAccount ? (
            <MembershipCard
              customerName={customer.name}
              customerCode={customer.customerCode}
              account={customer.loyaltyAccount}
            />
          ) : null}

          {permissionsFlags.canUpdate ? (
            <AddressManagerPanel customerId={customer.id} addresses={profile.addresses} />
          ) : (
            <Card className="rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle>Addresses</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {profile.addresses.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No saved addresses.</p>
                ) : (
                  profile.addresses.map((address) => (
                    <div key={address.id} className="rounded-lg border p-3 text-sm">
                      <p className="font-medium">{address.label ?? "Address"}</p>
                      <p>{address.addressLine1}</p>
                      <p className="text-muted-foreground">
                        {[address.city, address.postcode, address.country]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}

          {profile.loyaltyTransactions.length > 0 ? (
            <Card className="rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle>Recent points activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {profile.loyaltyTransactions.slice(0, 5).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p>{LOYALTY_TRANSACTION_LABELS[transaction.type]}</p>
                      <p className="text-muted-foreground text-xs">
                        {new Date(transaction.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span className={transaction.points >= 0 ? "text-green-600" : "text-red-600"}>
                      {transaction.points >= 0 ? "+" : ""}
                      {transaction.points}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function HistorySection({
  title,
  emptyLabel,
  count,
  children,
}: {
  title: string;
  emptyLabel: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {count > 0 ? children : <p className="text-muted-foreground text-sm">{emptyLabel}</p>}
      </CardContent>
    </Card>
  );
}
