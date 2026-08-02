"use client";

import { Minus, Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { validateQrCartModifiers } from "@/modules/qr-ordering-management/lib/qr-ordering-validation";
import { buildCartItemFromProduct } from "@/modules/qr-ordering-management/lib/qr-cart-utils";
import type {
  QrCartItem,
  QrMenuProduct,
} from "@/modules/qr-ordering-management/types/qr-ordering-types";

interface QrProductDetailProps {
  product: QrMenuProduct | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (item: QrCartItem) => void;
}

export function QrProductDetail({ product, open, onOpenChange, onAdd }: QrProductDetailProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [instructions, setInstructions] = useState("");
  const [error, setError] = useState<string | null>(null);

  const modifierTotal = useMemo(() => {
    if (!product) return 0;
    return product.modifierGroups.reduce((sum, group) => {
      return (
        sum +
        group.options
          .filter((option) => selectedOptions.includes(option.id))
          .reduce((groupSum, option) => groupSum + option.priceAdjustment, 0)
      );
    }, 0);
  }, [product, selectedOptions]);

  const lineTotal = product ? (product.price + modifierTotal) * quantity : 0;

  const toggleOption = (groupId: string, optionId: string, maxSelections: number) => {
    setSelectedOptions((current) => {
      const group = product?.modifierGroups.find((entry) => entry.id === groupId);
      if (!group) return current;

      const inGroup = group.options.map((option) => option.id);
      const selectedInGroup = current.filter((id) => inGroup.includes(id));

      if (current.includes(optionId)) {
        return current.filter((id) => id !== optionId);
      }

      if (maxSelections === 1) {
        return [...current.filter((id) => !inGroup.includes(id)), optionId];
      }

      if (selectedInGroup.length >= maxSelections) {
        return current;
      }

      return [...current, optionId];
    });
  };

  const handleAdd = () => {
    if (!product) return;

    try {
      validateQrCartModifiers(product, selectedOptions);
      const item = buildCartItemFromProduct(product, quantity, selectedOptions, instructions);
      onAdd(item);
      onOpenChange(false);
      setQuantity(1);
      setSelectedOptions([]);
      setInstructions("");
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Invalid selection");
    }
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {product.description ? (
            <p className="text-muted-foreground text-sm">{product.description}</p>
          ) : null}

          {product.modifierGroups.map((group) => (
            <div key={group.id} className="space-y-2">
              <div>
                <p className="font-medium">{group.name}</p>
                <p className="text-muted-foreground text-xs">
                  {group.isRequired ? "Required · " : ""}
                  Select {group.minSelections}
                  {group.maxSelections > group.minSelections ? `–${group.maxSelections}` : ""}
                </p>
              </div>
              <div className="space-y-2">
                {group.options.map((option) => {
                  const checked = selectedOptions.includes(option.id);
                  return (
                    <label
                      key={option.id}
                      className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 ${
                        checked ? "border-primary bg-primary/5" : ""
                      }`}
                    >
                      <span className="flex items-center gap-2 text-sm">
                        <input
                          type={group.maxSelections === 1 ? "radio" : "checkbox"}
                          name={group.id}
                          checked={checked}
                          onChange={() => toggleOption(group.id, option.id, group.maxSelections)}
                        />
                        {option.name}
                      </span>
                      {option.priceAdjustment > 0 ? (
                        <span className="text-sm">+${option.priceAdjustment.toFixed(2)}</span>
                      ) : null}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="space-y-2">
            <Label htmlFor="qr-special-instructions">Special instructions</Label>
            <textarea
              id="qr-special-instructions"
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
              placeholder="Optional notes for the kitchen"
              rows={3}
              className="border-input bg-background flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center font-medium">{quantity}</span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setQuantity((value) => value + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-lg font-semibold">${lineTotal.toFixed(2)}</p>
          </div>

          {error ? <p className="text-destructive text-sm">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button type="button" onClick={handleAdd}>
            Add to cart · ${lineTotal.toFixed(2)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
