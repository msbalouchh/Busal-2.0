"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { assignModifierGroupsAction } from "@/modules/modifier-management/actions/modifier-management-actions";
import type { ModifierManagementContext } from "@/modules/modifier-management/lib/get-modifier-management-context";
import type {
  ModifierManagementRecord,
  ProductModifierAssignmentRecord,
} from "@/modules/modifier-management/types/modifier-management-types";

interface ProductModifierAssignmentPanelProps {
  context: ModifierManagementContext;
  modifierGroups: ModifierManagementRecord[];
  products: Array<{ id: string; name: string; categoryName: string }>;
  assignment: ProductModifierAssignmentRecord | null;
  selectedProductId: string | null;
}

export function ProductModifierAssignmentPanel({
  context,
  modifierGroups,
  products,
  assignment,
  selectedProductId,
}: ProductModifierAssignmentPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [productId, setProductId] = useState(selectedProductId ?? "");
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(
    assignment?.modifierGroupIds ?? [],
  );
  const menuId = context.menu.id;

  useEffect(() => {
    setProductId(selectedProductId ?? "");
    setSelectedGroupIds(assignment?.modifierGroupIds ?? []);
  }, [assignment?.modifierGroupIds, selectedProductId]);

  const handleProductChange = (nextProductId: string) => {
    setProductId(nextProductId);
    router.push(`/app/restaurant/menus/${menuId}/modifiers/assign?productId=${nextProductId}`);
  };

  const toggleGroup = (groupId: string) => {
    setSelectedGroupIds((current) =>
      current.includes(groupId) ? current.filter((id) => id !== groupId) : [...current, groupId],
    );
  };

  const handleSave = () => {
    if (!productId) {
      toast.error("Select a product first");
      return;
    }

    startTransition(async () => {
      try {
        await assignModifierGroupsAction({
          menuId,
          productId,
          modifierGroupIds: selectedGroupIds,
        });
        toast.success("Modifier groups assigned");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Assignment failed");
      }
    });
  };

  if (!context.permissionsFlags.canAssign) {
    return (
      <p className="text-muted-foreground text-sm">
        You do not have permission to assign modifier groups.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border p-4 sm:p-6">
        <div className="space-y-2">
          <Label htmlFor="assign-product">Product</Label>
          <select
            id="assign-product"
            className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
            value={productId}
            onChange={(event) => handleProductChange(event.target.value)}
            disabled={isPending || products.length === 0}
          >
            {products.length === 0 ? <option value="">No products in this menu</option> : null}
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} · {product.categoryName}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="rounded-xl border p-4 sm:p-6">
        <h3 className="text-lg font-semibold">Modifier groups</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          Select reusable modifier groups to attach to this product.
        </p>

        {modifierGroups.length === 0 ? (
          <p className="text-muted-foreground mt-4 text-sm">Create modifier groups first.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {modifierGroups.map((group) => (
              <li key={group.id} className="rounded-md border px-3 py-2">
                <label className="flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedGroupIds.includes(group.id)}
                    onChange={() => toggleGroup(group.id)}
                    disabled={isPending || group.status === "ARCHIVED"}
                  />
                  <span>
                    <span className="font-medium">{group.name}</span>
                    <span className="text-muted-foreground block">
                      {group.optionCount} options · {group.selectionType.toLowerCase()}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}

        <Button
          type="button"
          className="mt-6"
          disabled={isPending || !productId || products.length === 0}
          onClick={handleSave}
        >
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save assignments
        </Button>
      </section>
    </div>
  );
}
