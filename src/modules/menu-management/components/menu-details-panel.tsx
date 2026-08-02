"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  archiveMenuManagementAction,
  duplicateMenuManagementAction,
  publishMenuManagementAction,
  restoreMenuManagementAction,
  setDefaultMenuManagementAction,
} from "@/modules/menu-management/actions/menu-management-actions";
import { MenuBranchAssignmentPanel } from "@/modules/menu-management/components/menu-branch-assignment-panel";
import { MenuPreviewPanel } from "@/modules/menu-management/components/menu-preview-panel";
import { MenuStatusBadge } from "@/modules/menu-management/components/menu-status-badge";
import { CATEGORY_MANAGEMENT_ROUTES } from "@/modules/category-management/constants/routes";
import { MODIFIER_MANAGEMENT_ROUTES } from "@/modules/modifier-management/constants/routes";
import { PRODUCT_MANAGEMENT_ROUTES } from "@/modules/product-management/constants/routes";
import {
  MENU_MANAGEMENT_ROUTES,
  MENU_TYPE_FILTER_OPTIONS,
} from "@/modules/menu-management/constants/routes";
import type { MenuManagementContext } from "@/modules/menu-management/lib/get-menu-management-context";
import type { MenuManagementRecord } from "@/modules/menu-management/types/menu-management-types";

interface MenuDetailsPanelProps {
  context: MenuManagementContext;
  menu: MenuManagementRecord;
}

function getMenuTypeLabel(menuType: MenuManagementRecord["menuType"]): string {
  return MENU_TYPE_FILTER_OPTIONS.find((option) => option.value === menuType)?.label ?? menuType;
}

export function MenuDetailsPanel({ context, menu }: MenuDetailsPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const runAction = (action: () => Promise<unknown>, successMessage: string) => {
    startTransition(async () => {
      try {
        await action();
        toast.success(successMessage);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Action failed");
      }
    });
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-muted-foreground text-sm">{getMenuTypeLabel(menu.menuType)}</p>
            <h2 className="text-2xl font-semibold tracking-tight">{menu.name}</h2>
            <div className="mt-2">
              <MenuStatusBadge status={menu.status} isDefault={menu.isDefault} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary">
              <Link href={CATEGORY_MANAGEMENT_ROUTES.list(menu.id)}>Manage categories</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href={PRODUCT_MANAGEMENT_ROUTES.list(menu.id)}>Manage products</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href={MODIFIER_MANAGEMENT_ROUTES.list(menu.id)}>Manage modifiers</Link>
            </Button>
            {context.permissionsFlags.canUpdate && menu.status !== "ARCHIVED" ? (
              <Button asChild variant="outline">
                <Link href={MENU_MANAGEMENT_ROUTES.edit(menu.id)}>Edit menu</Link>
              </Button>
            ) : null}
            {context.permissionsFlags.canCreate ? (
              <Button
                variant="outline"
                disabled={isPending}
                onClick={() =>
                  runAction(() => duplicateMenuManagementAction(menu.id), "Menu duplicated")
                }
              >
                Duplicate
              </Button>
            ) : null}
            {context.permissionsFlags.canPublish &&
            menu.status !== "ACTIVE" &&
            menu.status !== "ARCHIVED" ? (
              <Button
                disabled={isPending}
                onClick={() =>
                  runAction(() => publishMenuManagementAction(menu.id), "Menu published")
                }
              >
                Publish
              </Button>
            ) : null}
            {context.permissionsFlags.canUpdate && !menu.isDefault && menu.status !== "ARCHIVED" ? (
              <Button
                variant="secondary"
                disabled={isPending}
                onClick={() =>
                  runAction(() => setDefaultMenuManagementAction(menu.id), "Default menu updated")
                }
              >
                Set default
              </Button>
            ) : null}
            {context.permissionsFlags.canDelete && menu.status !== "ARCHIVED" ? (
              <Button
                variant="destructive"
                disabled={isPending}
                onClick={() =>
                  runAction(() => archiveMenuManagementAction(menu.id), "Menu archived")
                }
              >
                Archive
              </Button>
            ) : null}
            {context.permissionsFlags.canUpdate && menu.status === "ARCHIVED" ? (
              <Button
                disabled={isPending}
                onClick={() =>
                  runAction(() => restoreMenuManagementAction(menu.id), "Menu restored")
                }
              >
                Restore
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <MenuPreviewPanel menu={menu} />
        <section className="space-y-3 rounded-xl border p-4 sm:p-6">
          <h3 className="text-lg font-semibold">Menu details</h3>
          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Description</dt>
              <dd className="text-right">{menu.description || "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Primary branch</dt>
              <dd>{menu.branchName ?? "Business-wide"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Display order</dt>
              <dd>{menu.displayOrder}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Created</dt>
              <dd>{new Date(menu.createdAt).toLocaleString()}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Updated</dt>
              <dd>{new Date(menu.updatedAt).toLocaleString()}</dd>
            </div>
          </dl>
        </section>
      </div>

      {context.permissionsFlags.canUpdate ? (
        <MenuBranchAssignmentPanel
          menu={menu}
          branches={context.branches}
          disabled={menu.status === "ARCHIVED"}
        />
      ) : null}
    </div>
  );
}
