"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OperationsAgentNav } from "@/modules/ai-operations-agent-management/components/operations-agent-nav";
import type { InventoryHealthSnapshot } from "@/services/ai-operations-inventory-health.service";
import type { ResourceUtilizationSnapshot } from "@/services/ai-operations-resource-optimization.service";

interface OperationsResourcesPanelProps {
  resources: ResourceUtilizationSnapshot;
  inventory: InventoryHealthSnapshot;
}

export function OperationsResourcesPanel({ resources, inventory }: OperationsResourcesPanelProps) {
  return (
    <div className="space-y-8">
      <OperationsAgentNav />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active staff</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{resources.activeStaff}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Staff utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{resources.utilizationRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Low stock items</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{inventory.lowStockCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Open purchase orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{inventory.openPurchaseOrders}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top performers</CardTitle>
          </CardHeader>
          <CardContent>
            {resources.topPerformers.length === 0 ? (
              <p className="text-muted-foreground text-sm">No staff performance data.</p>
            ) : (
              <ul className="space-y-2">
                {resources.topPerformers.map((staff) => (
                  <li key={staff.name} className="flex justify-between text-sm">
                    <span>{staff.name}</span>
                    <span className="text-muted-foreground">{staff.ordersHandled} orders</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Underutilized staff</CardTitle>
          </CardHeader>
          <CardContent>
            {resources.underutilized.length === 0 ? (
              <p className="text-muted-foreground text-sm">No underutilized staff detected.</p>
            ) : (
              <ul className="space-y-2">
                {resources.underutilized.map((staff) => (
                  <li key={staff.name} className="flex justify-between text-sm">
                    <span>{staff.name}</span>
                    <span className="text-muted-foreground">{staff.ordersHandled} orders</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {inventory.affectedItems.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Inventory shortages affecting operations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {inventory.affectedItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
