import { BookOpen, Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { MENU_MANAGEMENT_ROUTES } from "@/modules/menu-management/constants/routes";

interface MenuEmptyStateProps {
  canCreate?: boolean;
}

export function MenuEmptyState({ canCreate = false }: MenuEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-16 text-center">
      <BookOpen className="text-muted-foreground mb-4 h-10 w-10" aria-hidden="true" />
      <h3 className="text-lg font-semibold">No menus yet</h3>
      <p className="text-muted-foreground mt-2 max-w-md text-sm">
        Create your first menu to organise breakfast, lunch, dinner, drinks, and seasonal offerings
        across branches.
      </p>
      {canCreate ? (
        <Button asChild className="mt-6">
          <Link href={MENU_MANAGEMENT_ROUTES.create}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Create menu
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
