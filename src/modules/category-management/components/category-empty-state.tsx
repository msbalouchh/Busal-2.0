import { FolderTree, Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { CATEGORY_MANAGEMENT_ROUTES } from "@/modules/category-management/constants/routes";

interface CategoryEmptyStateProps {
  menuId: string;
  canCreate?: boolean;
}

export function CategoryEmptyState({ menuId, canCreate = false }: CategoryEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-16 text-center">
      <FolderTree className="text-muted-foreground mb-4 h-10 w-10" aria-hidden="true" />
      <h3 className="text-lg font-semibold">No categories yet</h3>
      <p className="text-muted-foreground mt-2 max-w-md text-sm">
        Create categories to organise products within this menu. Nested categories and drag-and-drop
        ordering are supported.
      </p>
      {canCreate ? (
        <Button asChild className="mt-6">
          <Link href={CATEGORY_MANAGEMENT_ROUTES.create(menuId)}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Create category
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
