import type { ModifierManagementRecord } from "@/modules/modifier-management/types/modifier-management-types";

interface ModifierPreviewPanelProps {
  modifierGroup: ModifierManagementRecord;
}

function formatPrice(value: number): string {
  const prefix = value >= 0 ? "+" : "";
  return `${prefix}${new Intl.NumberFormat(undefined, { style: "currency", currency: "GBP" }).format(value)}`;
}

export function ModifierPreviewPanel({ modifierGroup }: ModifierPreviewPanelProps) {
  return (
    <section className="rounded-xl border p-4 sm:p-6">
      <h3 className="text-lg font-semibold">Preview</h3>
      <p className="text-muted-foreground mt-1 text-sm">
        How customers and staff will see this modifier group.
      </p>

      <div className="mt-6 space-y-4">
        <div>
          <p className="font-medium">{modifierGroup.name}</p>
          {modifierGroup.description ? (
            <p className="text-muted-foreground text-sm">{modifierGroup.description}</p>
          ) : null}
          <p className="text-muted-foreground mt-1 text-xs">
            {modifierGroup.selectionType === "SINGLE" ? "Choose one" : "Choose multiple"}
            {modifierGroup.isRequired ? " · Required" : " · Optional"}
          </p>
        </div>

        {modifierGroup.options.length === 0 ? (
          <p className="text-muted-foreground text-sm">No options added yet.</p>
        ) : (
          <ul className="space-y-2">
            {modifierGroup.options.map((option) => (
              <li
                key={option.id}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
              >
                <span>{option.name}</span>
                <span className="text-muted-foreground">{formatPrice(option.priceAdjustment)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
