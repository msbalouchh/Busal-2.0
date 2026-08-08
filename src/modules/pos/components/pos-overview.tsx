"use client";

import { PosManagementEmpty } from "@/modules/pos/components/pos-management-empty";
import { PosManagementError } from "@/modules/pos/components/pos-management-error";
import { PosManagementLoading } from "@/modules/pos/components/pos-management-loading";
import { PosOrderStatusBadge } from "@/modules/pos/components/pos-order-status-badge";
import { PosPaymentBadge } from "@/modules/pos/components/pos-payment-badge";
import { usePos } from "@/modules/pos/hooks/use-pos";
import { getPosOrderSummary } from "@/modules/pos/utils/pos-selectors";

export function PosOverview() {
  const { records, refresh, isRefreshing, error } = usePos();

  if (isRefreshing && records.length === 0) {
    return <PosManagementLoading />;
  }

  if (error && records.length === 0) {
    return <PosManagementError message={error} />;
  }

  if (records.length === 0) {
    return <PosManagementEmpty />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">POS Transactions</h2>
          <p className="text-muted-foreground text-sm">{records.length} transaction(s)</p>
        </div>
        <button
          type="button"
          className="text-sm font-medium underline-offset-4 hover:underline"
          onClick={refresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error ? <PosManagementError message={error} /> : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {records.map((record) => (
          <article key={record.order.id} className="rounded-lg border p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="font-medium">#{record.order.orderNumber}</h3>
              <PosOrderStatusBadge status={record.order.status} />
            </div>
            <p className="text-muted-foreground mb-3 text-sm">{getPosOrderSummary(record)}</p>
            <div className="flex items-center justify-between">
              {record.payments[0] ? (
                <PosPaymentBadge paymentType={record.payments[0].paymentType} />
              ) : (
                <span className="text-muted-foreground text-xs">Unpaid</span>
              )}
              <span className="text-sm font-medium">
                £{(record.order.totalCents / 100).toFixed(2)}
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
