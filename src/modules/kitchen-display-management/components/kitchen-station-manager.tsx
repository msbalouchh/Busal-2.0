"use client";

import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  assignKitchenStationProductsAction,
  createKitchenStationAction,
  updateKitchenStationAction,
} from "@/modules/kitchen-display-management/actions/kitchen-display-actions";
import type { KitchenDisplayContext } from "@/modules/kitchen-display-management/lib/get-kitchen-display-context";
import type { KitchenStationRecord } from "@/modules/kitchen-display-management/types/kitchen-display-types";

interface KitchenStationManagerProps {
  context: KitchenDisplayContext;
  stations: KitchenStationRecord[];
  products: Array<{ id: string; label: string; preparationTime: number | null }>;
}

export function KitchenStationManager({ context, stations, products }: KitchenStationManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const branchId = context.selectedBranchId ?? "";
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedStationId, setSelectedStationId] = useState(stations[0]?.id ?? "");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(
    stations[0]?.productIds ?? [],
  );

  const runAction = async (action: () => Promise<{ success: boolean }>, message: string) => {
    startTransition(async () => {
      try {
        await action();
        toast.success(message);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Action failed");
      }
    });
  };

  const toggleProduct = (productId: string) => {
    setSelectedProductIds((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId],
    );
  };

  const selectStation = (station: KitchenStationRecord) => {
    setSelectedStationId(station.id);
    setSelectedProductIds(station.productIds);
    setName(station.name);
    setDescription(station.description ?? "");
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Stations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {stations.length === 0 ? (
            <p className="text-muted-foreground text-sm">No stations yet.</p>
          ) : (
            stations.map((station) => (
              <button
                key={station.id}
                type="button"
                className={`hover:bg-muted/50 w-full rounded-lg border p-3 text-left text-sm ${
                  selectedStationId === station.id ? "border-primary" : ""
                }`}
                onClick={() => selectStation(station)}
              >
                <p className="font-medium">{station.name}</p>
                <p className="text-muted-foreground text-xs">
                  {station.productCount} products · {station.status.toLowerCase()}
                </p>
              </button>
            ))
          )}
        </CardContent>
      </Card>

      <div className="space-y-6">
        {context.permissionsFlags.canManage ? (
          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">
                {selectedStationId ? "Edit station" : "Create station"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Station name (e.g. Grill, Fry, Cold)"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              <Input
                placeholder="Description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
              <Button
                disabled={isPending || !name.trim()}
                onClick={() =>
                  runAction(
                    async () => {
                      if (selectedStationId) {
                        await updateKitchenStationAction(selectedStationId, {
                          branchId,
                          name,
                          description,
                          productIds: selectedProductIds,
                        });
                      } else {
                        await createKitchenStationAction({
                          branchId,
                          name,
                          description,
                          productIds: selectedProductIds,
                        });
                      }
                      return { success: true };
                    },
                    selectedStationId ? "Station updated" : "Station created",
                  )
                }
              >
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {selectedStationId ? "Save station" : "Create station"}
              </Button>
              {!selectedStationId ? (
                <Button
                  variant="outline"
                  disabled={isPending}
                  onClick={() => {
                    setName("");
                    setDescription("");
                    setSelectedProductIds([]);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New form
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        {context.permissionsFlags.canAssignStation && selectedStationId ? (
          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Assign products</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid max-h-80 gap-2 overflow-y-auto sm:grid-cols-2">
                {products.map((product) => (
                  <label
                    key={product.id}
                    className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={selectedProductIds.includes(product.id)}
                      onChange={() => toggleProduct(product.id)}
                    />
                    <span>{product.label}</span>
                  </label>
                ))}
              </div>
              <Button
                disabled={isPending}
                onClick={() =>
                  runAction(
                    () =>
                      assignKitchenStationProductsAction(
                        selectedStationId,
                        branchId,
                        selectedProductIds,
                      ),
                    "Products assigned",
                  )
                }
              >
                Save product assignments
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
