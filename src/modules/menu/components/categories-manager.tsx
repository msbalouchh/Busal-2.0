"use client";

import { ArrowDown, ArrowUp, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createCategoryAction,
  deleteCategoryAction,
  reorderCategoriesAction,
  setCategoryActiveStatusAction,
  updateCategoryAction,
} from "@/modules/menu/actions/menu-actions";
import type { CategoryData } from "@/services/menu-management.service";

interface CategoriesManagerProps {
  categories: CategoryData[];
}

interface CategoryFormState {
  name: string;
  description: string;
  isActive: boolean;
}

const emptyForm: CategoryFormState = {
  name: "",
  description: "",
  isActive: true,
};

export function CategoriesManager({ categories }: CategoriesManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryFormState>(emptyForm);
  const [showForm, setShowForm] = useState(false);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (category: CategoryData) => {
    setEditingId(category.id);
    setShowForm(true);
    setForm({
      name: category.name,
      description: category.description ?? "",
      isActive: category.isActive,
    });
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    const payload = {
      name: form.name,
      description: form.description || undefined,
      isActive: form.isActive,
    };

    startTransition(async () => {
      try {
        if (editingId) {
          await updateCategoryAction(editingId, payload);
          toast.success("Category updated");
        } else {
          await createCategoryAction(payload);
          toast.success("Category created");
        }
        resetForm();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to save category");
      }
    });
  };

  const handleDelete = (categoryId: string) => {
    startTransition(async () => {
      try {
        await deleteCategoryAction(categoryId);
        toast.success("Category deleted");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to delete category");
      }
    });
  };

  const handleToggleActive = (categoryId: string, isActive: boolean) => {
    startTransition(async () => {
      try {
        await setCategoryActiveStatusAction(categoryId, isActive);
        toast.success(isActive ? "Category activated" : "Category deactivated");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to update status");
      }
    });
  };

  const handleMove = (categoryId: string, direction: "up" | "down") => {
    const index = categories.findIndex((category) => category.id === categoryId);
    if (index === -1) {
      return;
    }

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) {
      return;
    }

    const orderedIds = categories.map((category) => category.id);
    const currentId = orderedIds[index];
    const targetId = orderedIds[targetIndex];
    if (!currentId || !targetId) {
      return;
    }
    orderedIds[index] = targetId;
    orderedIds[targetIndex] = currentId;

    startTransition(async () => {
      try {
        await reorderCategoriesAction(orderedIds);
        toast.success("Category order updated");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to reorder categories");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button type="button" onClick={() => setShowForm(true)} disabled={isPending || showForm}>
          <Plus className="h-4 w-4" />
          Add category
        </Button>
      </div>

      {showForm ? (
        <div className="space-y-4 rounded-lg border p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="category-name">Name</Label>
              <Input
                id="category-name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="category-description">Description</Label>
              <Input
                id="category-description"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                disabled={isPending}
              />
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <input
                id="category-active"
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
                disabled={isPending}
              />
              <Label htmlFor="category-active">Active</Label>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" onClick={handleSubmit} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {editingId ? "Update category" : "Create category"}
            </Button>
            <Button type="button" variant="outline" onClick={resetForm} disabled={isPending}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        {categories.length === 0 ? (
          <p className="text-muted-foreground text-sm">No categories yet.</p>
        ) : (
          categories.map((category, index) => (
            <div
              key={category.id}
              className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-1 text-sm">
                <p className="font-semibold">
                  {category.name}
                  {!category.isActive ? (
                    <span className="text-muted-foreground ml-2 font-normal">(Inactive)</span>
                  ) : null}
                </p>
                <p className="text-muted-foreground">
                  {category.description || "No description"} · {category.itemCount} items
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleMove(category.id, "up")}
                  disabled={isPending || index === 0}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleMove(category.id, "down")}
                  disabled={isPending || index === categories.length - 1}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => startEdit(category)}
                  disabled={isPending}
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleActive(category.id, !category.isActive)}
                  disabled={isPending}
                >
                  {category.isActive ? "Deactivate" : "Activate"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(category.id)}
                  disabled={isPending}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
