"use client";

import { useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { updateAiOperationsCapabilitiesAction } from "@/modules/customer-ai/actions/ai-operations-actions";
import type { AiOperationsCapabilities } from "@/modules/customer-ai/types/customer-ai.types";

interface CapabilityToggle {
  key: keyof AiOperationsCapabilities;
  label: string;
  description: string;
  destructive?: boolean;
  confirmationRequired?: boolean;
  customerFacing?: boolean;
}

const OPERATIONS_TOGGLES: CapabilityToggle[] = [
  {
    key: "readOrders",
    label: "Order lookup",
    description: "Allow AI to read order status for verified customers.",
    confirmationRequired: false,
    customerFacing: true,
  },
  {
    key: "ordersCreate",
    label: "Owner order operations",
    description: "Allow owner AI to create and manage orders.",
    confirmationRequired: true,
  },
  {
    key: "createOrder",
    label: "Customer order creation",
    description: "Allow verified customers to place orders through AI channels.",
    confirmationRequired: true,
    customerFacing: true,
  },
  {
    key: "ordersCancel",
    label: "Order cancellation",
    description: "Allow AI to cancel orders. Destructive — requires confirmation.",
    destructive: true,
    confirmationRequired: true,
  },
  {
    key: "readReservations",
    label: "Reservation lookup",
    description: "Allow AI to read reservation details.",
    customerFacing: true,
  },
  {
    key: "createReservation",
    label: "Reservation creation",
    description: "Allow AI to create reservations.",
    confirmationRequired: true,
    customerFacing: true,
  },
  {
    key: "reservationsUpdate",
    label: "Reservation updates",
    description: "Allow AI to modify existing reservations.",
    confirmationRequired: true,
  },
  {
    key: "reservationsCancel",
    label: "Reservation cancellation",
    description: "Allow AI to cancel reservations. Destructive — requires confirmation.",
    destructive: true,
    confirmationRequired: true,
  },
  {
    key: "readMenu",
    label: "Product & menu operations",
    description: "Allow AI to search and read menu/product catalog.",
    customerFacing: true,
  },
  {
    key: "inventoryRead",
    label: "Inventory operations",
    description: "Allow owner AI to read inventory levels.",
  },
  {
    key: "analyticsRead",
    label: "Analytics & operational insights",
    description: "Allow owner AI to read revenue summaries and operational metrics.",
  },
  {
    key: "requireConfirmation",
    label: "Require confirmation for actions",
    description: "When enabled, write and destructive AI actions wait for explicit confirmation.",
    confirmationRequired: true,
  },
];

interface AiOperationsSettingsSectionProps {
  capabilities: AiOperationsCapabilities;
  canManageSettings: boolean;
}

export function AiOperationsSettingsSection({
  capabilities: initialCapabilities,
  canManageSettings,
}: AiOperationsSettingsSectionProps) {
  const [form, setForm] = useState(initialCapabilities);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        const updated = await updateAiOperationsCapabilitiesAction(form);
        setForm(updated);
        setMessage("AI operations capabilities saved.");
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : "Failed to save operations settings");
      }
    });
  };

  return (
    <section className="rounded-xl border p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">AI Operations Capabilities</h2>
          <p className="text-muted-foreground text-sm">
            Control which business operations AI can perform. Financial actions (refunds, payments) are
            not exposed here.
          </p>
        </div>
        {form.destructiveActionsEnabled ? (
          <Badge variant="destructive">Destructive actions enabled</Badge>
        ) : (
          <Badge variant="secondary">Destructive actions disabled</Badge>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {OPERATIONS_TOGGLES.map((toggle) => (
          <label
            key={toggle.key}
            className={`flex items-start justify-between gap-3 rounded-lg border px-3 py-2 text-sm ${
              toggle.destructive ? "border-destructive/30" : ""
            }`}
          >
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-1">
                <span className="font-medium">{toggle.label}</span>
                {toggle.destructive ? (
                  <Badge variant="destructive" className="text-[10px]">
                    Destructive
                  </Badge>
                ) : null}
                {toggle.confirmationRequired ? (
                  <Badge variant="outline" className="text-[10px]">
                    Confirmation
                  </Badge>
                ) : null}
                {toggle.customerFacing ? (
                  <Badge variant="secondary" className="text-[10px]">
                    Customer
                  </Badge>
                ) : null}
              </div>
              <p className="text-muted-foreground text-xs">{toggle.description}</p>
            </div>
            <input
              type="checkbox"
              className="mt-1 shrink-0"
              checked={Boolean(form[toggle.key])}
              disabled={!canManageSettings || isPending}
              onChange={(event) =>
                setForm((current) => ({ ...current, [toggle.key]: event.target.checked }))
              }
            />
          </label>
        ))}
      </div>

      {error ? <p className="text-destructive mt-3 text-sm">{error}</p> : null}
      {message ? <p className="text-muted-foreground mt-3 text-sm">{message}</p> : null}

      {canManageSettings ? (
        <Button type="button" className="mt-4" disabled={isPending} onClick={handleSave}>
          Save Operations Capabilities
        </Button>
      ) : null}
    </section>
  );
}
