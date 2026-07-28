"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
  type PaymentMethodOption,
} from "@/modules/payments/constants/routes";

interface PaymentMethodSelectorProps {
  value: PaymentMethodOption;
  disabled?: boolean;
  onChange: (method: PaymentMethodOption) => void;
}

export function PaymentMethodSelector({
  value,
  disabled = false,
  onChange,
}: PaymentMethodSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {PAYMENT_METHODS.map((method) => (
        <Button
          key={method}
          type="button"
          size="lg"
          variant={value === method ? "default" : "outline"}
          disabled={disabled}
          className={cn("min-h-12 touch-manipulation")}
          onClick={() => onChange(method)}
        >
          {PAYMENT_METHOD_LABELS[method]}
        </Button>
      ))}
    </div>
  );
}
