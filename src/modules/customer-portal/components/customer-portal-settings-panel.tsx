"use client";

import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CUSTOMER_PORTAL_NAV,
  CUSTOMER_PORTAL_ROUTES,
} from "@/modules/customer-portal/constants/routes";
import type { CustomerPortalContextData } from "@/services/customer-portal.service";

interface CustomerPortalSettingsPanelProps {
  context: CustomerPortalContextData;
}

export function CustomerPortalSettingsPanel({ context }: CustomerPortalSettingsPanelProps) {
  const accountLinks = CUSTOMER_PORTAL_NAV.filter((item) =>
    ["Profile", "Preferences", "Security", "Addresses", "Payments"].includes(item.label),
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Name:</span> {context.userFullName}
          </p>
          <p>
            <span className="text-muted-foreground">Email:</span> {context.userEmail}
          </p>
          <p>
            <span className="text-muted-foreground">Business:</span> {context.business.businessName}
          </p>
          {context.business.businessCode ? (
            <p>
              <span className="text-muted-foreground">Business code:</span>{" "}
              {context.business.businessCode}
            </p>
          ) : null}
          <p>
            <span className="text-muted-foreground">Customer status:</span>{" "}
            {context.customer.status}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick navigation</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm lg:hidden">
            {CUSTOMER_PORTAL_NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-primary hover:underline">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <ul className="hidden space-y-2 text-sm lg:block">
            {accountLinks.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-primary hover:underline">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href={CUSTOMER_PORTAL_ROUTES.dashboard}
                className="text-primary hover:underline"
              >
                Dashboard
              </Link>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
