"use client";

import { ChevronDown, ChevronRight, GripVertical } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { reorderCategoriesManagementAction } from "@/modules/category-management/actions/category-management-actions";
import { CategoryStatusBadge } from "@/modules/category-management/components/category-status-badge";
import { CATEGORY_MANAGEMENT_ROUTES } from "@/modules/category-management/constants/routes";
import type { CategoryTreeNode } from "@/modules/category-management/types/category-management-types";

interface CategoryTreeViewProps {
  menuId: string;
  tree: CategoryTreeNode[];
  canReorder?: boolean;
}

function TreeNode({
  menuId,
  node,
  depth,
  canReorder,
}: {
  menuId: string;
  node: CategoryTreeNode;
  depth: number;
  canReorder?: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div
        className="hover:bg-muted/40 flex items-center gap-2 rounded-md px-2 py-2"
        style={{ paddingLeft: `${depth * 1.25 + 0.5}rem` }}
      >
        {canReorder ? (
          <GripVertical className="text-muted-foreground h-4 w-4 shrink-0" aria-hidden="true" />
        ) : null}
        {hasChildren ? (
          <button
            type="button"
            className="text-muted-foreground"
            onClick={() => setExpanded((value) => !value)}
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        ) : (
          <span className="w-4" />
        )}
        <Link
          href={CATEGORY_MANAGEMENT_ROUTES.details(menuId, node.id)}
          className="flex flex-1 items-center justify-between gap-3"
        >
          <span className="font-medium">{node.name}</span>
          <CategoryStatusBadge status={node.status} isFeatured={node.isFeatured} />
        </Link>
      </div>
      {expanded && hasChildren
        ? node.children.map((child) => (
            <TreeNode
              key={child.id}
              menuId={menuId}
              node={child}
              depth={depth + 1}
              canReorder={canReorder}
            />
          ))
        : null}
    </div>
  );
}

export function CategoryTreeView({ menuId, tree, canReorder = false }: CategoryTreeViewProps) {
  const [isPending, startTransition] = useTransition();

  const handleReorderRoots = () => {
    startTransition(async () => {
      try {
        await reorderCategoriesManagementAction({
          menuId,
          orderedIds: tree.map((node) => node.id),
          parentCategoryId: null,
        });
        toast.success("Category order updated");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to reorder categories");
      }
    });
  };

  if (tree.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 rounded-xl border p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">Category tree</h3>
        {canReorder ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={handleReorderRoots}
          >
            Save root order
          </Button>
        ) : null}
      </div>
      <div className="space-y-1">
        {tree.map((node) => (
          <TreeNode key={node.id} menuId={menuId} node={node} depth={0} canReorder={canReorder} />
        ))}
      </div>
    </div>
  );
}
