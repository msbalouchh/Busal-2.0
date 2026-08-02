"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  archiveCategoryManagementAction,
  deleteCategoryManagementAction,
  duplicateCategoryManagementAction,
  publishCategoryManagementAction,
  restoreCategoryManagementAction,
} from "@/modules/category-management/actions/category-management-actions";
import { CategoryPreviewPanel } from "@/modules/category-management/components/category-preview-panel";
import { CategoryStatusBadge } from "@/modules/category-management/components/category-status-badge";
import { CATEGORY_MANAGEMENT_ROUTES } from "@/modules/category-management/constants/routes";
import { PRODUCT_MANAGEMENT_ROUTES } from "@/modules/product-management/constants/routes";
import type { CategoryManagementContext } from "@/modules/category-management/lib/get-category-management-context";
import type { CategoryManagementRecord } from "@/modules/category-management/types/category-management-types";

interface CategoryDetailsPanelProps {
  context: CategoryManagementContext;
  category: CategoryManagementRecord;
}

export function CategoryDetailsPanel({ context, category }: CategoryDetailsPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const menuId = context.menu.id;

  const runAction = (
    action: () => Promise<unknown>,
    successMessage: string,
    redirectToList = false,
  ) => {
    startTransition(async () => {
      try {
        await action();
        toast.success(successMessage);
        if (redirectToList) {
          router.push(CATEGORY_MANAGEMENT_ROUTES.list(menuId));
        } else {
          router.refresh();
        }
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
            <p className="text-muted-foreground text-sm">{category.slug}</p>
            <h2 className="text-2xl font-semibold tracking-tight">{category.name}</h2>
            <div className="mt-2">
              <CategoryStatusBadge status={category.status} isFeatured={category.isFeatured} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {context.permissionsFlags.canCreate ? (
              <Button asChild variant="secondary">
                <Link
                  href={`${PRODUCT_MANAGEMENT_ROUTES.create(menuId)}?categoryId=${category.id}`}
                >
                  Add product
                </Link>
              </Button>
            ) : null}
            {context.permissionsFlags.canUpdate && category.status !== "ARCHIVED" ? (
              <Button asChild variant="outline">
                <Link href={CATEGORY_MANAGEMENT_ROUTES.edit(menuId, category.id)}>
                  Edit category
                </Link>
              </Button>
            ) : null}
            {context.permissionsFlags.canCreate ? (
              <Button
                variant="outline"
                disabled={isPending}
                onClick={() =>
                  runAction(
                    () => duplicateCategoryManagementAction(menuId, category.id),
                    "Category duplicated",
                  )
                }
              >
                Duplicate
              </Button>
            ) : null}
            {context.permissionsFlags.canPublish &&
            category.status !== "ACTIVE" &&
            category.status !== "ARCHIVED" ? (
              <Button
                disabled={isPending}
                onClick={() =>
                  runAction(
                    () => publishCategoryManagementAction(menuId, category.id),
                    "Category published",
                  )
                }
              >
                Publish
              </Button>
            ) : null}
            {context.permissionsFlags.canDelete && category.status !== "ARCHIVED" ? (
              <>
                <Button
                  variant="destructive"
                  disabled={isPending}
                  onClick={() =>
                    runAction(
                      () => archiveCategoryManagementAction(menuId, category.id),
                      "Category archived",
                    )
                  }
                >
                  Archive
                </Button>
                <Button
                  variant="outline"
                  disabled={isPending}
                  onClick={() =>
                    runAction(
                      () => deleteCategoryManagementAction(menuId, category.id),
                      "Category deleted",
                      true,
                    )
                  }
                >
                  Delete
                </Button>
              </>
            ) : null}
            {context.permissionsFlags.canUpdate && category.status === "ARCHIVED" ? (
              <Button
                disabled={isPending}
                onClick={() =>
                  runAction(
                    () => restoreCategoryManagementAction(menuId, category.id),
                    "Category restored",
                  )
                }
              >
                Restore
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <CategoryPreviewPanel category={category} />
        <section className="space-y-3 rounded-xl border p-4 sm:p-6">
          <h3 className="text-lg font-semibold">Category details</h3>
          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Parent</dt>
              <dd>{category.parentCategoryName ?? "Root level"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Display order</dt>
              <dd>{category.displayOrder}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Subcategories</dt>
              <dd>{category.childCount}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Created</dt>
              <dd>{new Date(category.createdAt).toLocaleString()}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Updated</dt>
              <dd>{new Date(category.updatedAt).toLocaleString()}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
