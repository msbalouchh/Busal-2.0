import { Layers, Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { MODIFIER_MANAGEMENT_ROUTES } from "@/modules/modifier-management/constants/routes";

interface ModifierEmptyStateProps {
  menuId: string;
  canCreate?: boolean;
}

export function ModifierEmptyState({ menuId, canCreate = false }: ModifierEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-16 text-center">
      <Layers className="text-muted-foreground mb-4 h-10 w-10" aria-hidden="true" />
      <h3 className="text-lg font-semibold">No modifier groups yet</h3>
      <p className="text-muted-foreground mt-2 max-w-md text-sm">
        Create reusable modifier groups like Size, Cheese, Spice Level, and Toppings, then assign
        them to products across your menu.
      </p>
      {canCreate ? (
        <Button asChild className="mt-6">
          <Link href={MODIFIER_MANAGEMENT_ROUTES.create(menuId)}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Create modifier group
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
