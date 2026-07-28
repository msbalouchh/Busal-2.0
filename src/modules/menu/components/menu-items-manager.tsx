"use client";

import { Loader2, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  assignModifierGroupsAction,
  createMenuItemAction,
  deleteMenuItemAction,
  setMenuItemAvailabilityAction,
  setMenuItemFeaturedAction,
  updateMenuItemAction,
} from "@/modules/menu/actions/menu-actions";
import type {
  CategoryData,
  MenuItemData,
  ModifierGroupData,
} from "@/services/menu-management.service";

interface MenuItemsManagerProps {
  menuItems: MenuItemData[];
  categories: CategoryData[];
  modifierGroups: ModifierGroupData[];
}

interface MenuItemFormState {
  name: string;
  description: string;
  price: string;
  categoryId: string;
  isAvailable: boolean;
  isFeatured: boolean;
  modifierGroupIds: string[];
}

const emptyForm: MenuItemFormState = {
  name: "",
  description: "",
  price: "",
  categoryId: "",
  isAvailable: true,
  isFeatured: false,
  modifierGroupIds: [],
};

export function MenuItemsManager({ menuItems, categories, modifierGroups }: MenuItemsManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MenuItemFormState>(emptyForm);
  const [showForm, setShowForm] = useState(false);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (item: MenuItemData) => {
    setEditingId(item.id);
    setShowForm(true);
    setForm({
      name: item.name,
      description: item.description ?? "",
      price: item.price.toFixed(2),
      categoryId: item.categoryId ?? "",
      isAvailable: item.isAvailable,
      isFeatured: item.isFeatured,
      modifierGroupIds: item.modifierGroupIds,
    });
  };

  const parsePrice = (value: string): number | null => {
    const parsed = Number.parseFloat(value);
    if (Number.isNaN(parsed) || parsed < 0) {
      return null;
    }
    return parsed;
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error("Item name is required");
      return;
    }

    const price = parsePrice(form.price);
    if (price === null) {
      toast.error("Enter a valid price");
      return;
    }

    const payload = {
      name: form.name,
      description: form.description || undefined,
      price,
      categoryId: form.categoryId || null,
      isAvailable: form.isAvailable,
      isFeatured: form.isFeatured,
    };

    startTransition(async () => {
      try {
        if (editingId) {
          await updateMenuItemAction(editingId, payload);
          await assignModifierGroupsAction(editingId, form.modifierGroupIds);
          toast.success("Menu item updated");
        } else {
          await createMenuItemAction(payload);
          toast.success("Menu item created");
        }
        resetForm();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to save menu item");
      }
    });
  };

  const handleDelete = (itemId: string) => {
    startTransition(async () => {
      try {
        await deleteMenuItemAction(itemId);
        toast.success("Menu item deleted");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to delete menu item");
      }
    });
  };

  const handleToggleAvailability = (itemId: string, isAvailable: boolean) => {
    startTransition(async () => {
      try {
        await setMenuItemAvailabilityAction(itemId, isAvailable);
        toast.success(isAvailable ? "Item marked available" : "Item marked unavailable");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to update availability");
      }
    });
  };

  const handleToggleFeatured = (itemId: string, isFeatured: boolean) => {
    startTransition(async () => {
      try {
        await setMenuItemFeaturedAction(itemId, isFeatured);
        toast.success(isFeatured ? "Item featured" : "Item unfeatured");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to update featured status");
      }
    });
  };

  const toggleModifierGroup = (groupId: string) => {
    setForm((current) => ({
      ...current,
      modifierGroupIds: current.modifierGroupIds.includes(groupId)
        ? current.modifierGroupIds.filter((id) => id !== groupId)
        : [...current.modifierGroupIds, groupId],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button type="button" onClick={() => setShowForm(true)} disabled={isPending || showForm}>
          <Plus className="h-4 w-4" />
          Add item
        </Button>
      </div>

      {showForm ? (
        <div className="space-y-4 rounded-lg border p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="item-name">Name</Label>
              <Input
                id="item-name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="item-description">Description</Label>
              <Input
                id="item-description"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-price">Price</Label>
              <Input
                id="item-price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(event) => setForm({ ...form, price: event.target.value })}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-category">Category</Label>
              <select
                id="item-category"
                className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                value={form.categoryId}
                onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
                disabled={isPending}
              >
                <option value="">No category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="item-available"
                type="checkbox"
                checked={form.isAvailable}
                onChange={(event) => setForm({ ...form, isAvailable: event.target.checked })}
                disabled={isPending}
              />
              <Label htmlFor="item-available">Available</Label>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="item-featured"
                type="checkbox"
                checked={form.isFeatured}
                onChange={(event) => setForm({ ...form, isFeatured: event.target.checked })}
                disabled={isPending}
              />
              <Label htmlFor="item-featured">Featured</Label>
            </div>
            {editingId && modifierGroups.length > 0 ? (
              <div className="space-y-2 sm:col-span-2">
                <Label>Modifier groups</Label>
                <div className="flex flex-wrap gap-3">
                  {modifierGroups.map((group) => (
                    <label key={group.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={form.modifierGroupIds.includes(group.id)}
                        onChange={() => toggleModifierGroup(group.id)}
                        disabled={isPending}
                      />
                      {group.name}
                    </label>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button type="button" onClick={handleSubmit} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {editingId ? "Update item" : "Create item"}
            </Button>
            <Button type="button" variant="outline" onClick={resetForm} disabled={isPending}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        {menuItems.length === 0 ? (
          <p className="text-muted-foreground text-sm">No menu items yet.</p>
        ) : (
          menuItems.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-1 text-sm">
                <p className="flex items-center gap-2 font-semibold">
                  {item.name}
                  {item.isFeatured ? <Star className="text-primary h-4 w-4 fill-current" /> : null}
                  {!item.isAvailable ? (
                    <span className="text-muted-foreground font-normal">(Unavailable)</span>
                  ) : null}
                </p>
                <p className="text-muted-foreground">
                  {item.category?.name ?? "Uncategorized"} · ${item.price.toFixed(2)}
                </p>
                {item.description ? (
                  <p className="text-muted-foreground">{item.description}</p>
                ) : null}
                {item.modifierGroupIds.length > 0 ? (
                  <p className="text-muted-foreground">
                    {item.modifierGroupIds.length} modifier group(s)
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => startEdit(item)}
                  disabled={isPending}
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleAvailability(item.id, !item.isAvailable)}
                  disabled={isPending}
                >
                  {item.isAvailable ? "Unavailable" : "Available"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleFeatured(item.id, !item.isFeatured)}
                  disabled={isPending}
                >
                  {item.isFeatured ? "Unfeature" : "Feature"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(item.id)}
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
