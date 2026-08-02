"use client";

import Link from "next/link";
import { Loader2, Plus, Search, Upload, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CustomerDashboardStatsCards } from "@/modules/customer-crm-management/components/customer-dashboard-stats-cards";
import { CustomerStatusBadge } from "@/modules/customer-crm-management/components/customer-status-badge";
import { LoyaltyTierBadge } from "@/modules/customer-crm-management/components/loyalty-tier-badge";
import {
  CUSTOMER_CRM_ROUTES,
  CUSTOMER_STATUS_FILTER_OPTIONS,
} from "@/modules/customer-crm-management/constants/routes";
import type { CustomerCrmContext } from "@/modules/customer-crm-management/lib/get-customer-crm-context";
import type {
  CustomerDashboardStats,
  CustomerListResult,
} from "@/modules/customer-crm-management/types/customer-crm-types";

interface CustomerDashboardPanelProps {
  context: CustomerCrmContext;
  list: CustomerListResult;
  stats: CustomerDashboardStats;
  initialSearch?: string;
  initialStatus?: string;
}

export function CustomerDashboardPanel({
  context,
  list,
  stats,
  initialSearch = "",
  initialStatus = "ALL",
}: CustomerDashboardPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);

  const applyFilters = (page = 1) => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (status !== "ALL") params.set("status", status);
    if (page > 1) params.set("page", String(page));

    startTransition(() => {
      router.push(`${CUSTOMER_CRM_ROUTES.dashboard()}?${params.toString()}`);
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Customer analytics</h2>
          <p className="text-muted-foreground text-sm">
            Central customer database for orders, reservations, and loyalty.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {context.permissionsFlags.canImport ? (
            <Button asChild variant="outline">
              <Link href={CUSTOMER_CRM_ROUTES.import()}>
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Link>
            </Button>
          ) : null}
          {context.permissionsFlags.canCreate ? (
            <Button asChild>
              <Link href={CUSTOMER_CRM_ROUTES.create()}>
                <Plus className="mr-2 h-4 w-4" />
                Add customer
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <CustomerDashboardStatsCards stats={stats} />

      <div className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-4">
          <div className="relative lg:col-span-2">
            <Search className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, email, phone, or code"
              className="pl-9"
            />
          </div>
          <select
            className="border-input bg-background flex h-10 rounded-md border px-3 py-2 text-sm"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            {CUSTOMER_STATUS_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Button onClick={() => applyFilters()} disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Apply filters
          </Button>
        </div>

        {list.items.length === 0 ? (
          <Card className="rounded-xl shadow-sm">
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <Users className="text-muted-foreground h-10 w-10" />
              <p className="font-medium">No customers found</p>
              <p className="text-muted-foreground text-sm">
                Register customers or import an existing list to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {list.items.map((customer) => (
              <Link key={customer.id} href={CUSTOMER_CRM_ROUTES.profile(customer.id)}>
                <Card className="h-full rounded-xl shadow-sm transition-shadow hover:shadow-md">
                  <CardHeader className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{customer.name}</CardTitle>
                      <CustomerStatusBadge status={customer.status} />
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {customer.customerCode ?? "No code"} ·{" "}
                      {customer.email ?? customer.phone ?? "No contact"}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Orders</span>
                      <span>{customer.totalOrders}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total spend</span>
                      <span>£{customer.totalSpend.toFixed(2)}</span>
                    </div>
                    {customer.loyaltyAccount ? (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Loyalty</span>
                        <LoyaltyTierBadge tier={customer.loyaltyAccount.tier} />
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {list.totalPages > 1 ? (
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              Page {list.page} of {list.totalPages} · {list.total} customers
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={list.page <= 1 || isPending}
                onClick={() => applyFilters(list.page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={list.page >= list.totalPages || isPending}
                onClick={() => applyFilters(list.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
