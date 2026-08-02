"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slugifyCategoryName } from "@/modules/category-management/lib/category-validation";
import type {
  CategoryManagementInput,
  CategoryManagementRecord,
} from "@/modules/category-management/types/category-management-types";

interface CategoryFormProps {
  initialCategory?: CategoryManagementRecord | null;
  parentOptions: CategoryManagementRecord[];
  submitLabel: string;
  disabled?: boolean;
  onSubmit: (input: CategoryManagementInput) => Promise<void>;
}

function buildInitialForm(
  category: CategoryManagementRecord | null | undefined,
): CategoryManagementInput {
  if (category) {
    return {
      name: category.name,
      description: category.description ?? "",
      parentCategoryId: category.parentCategoryId,
      image: category.image ?? "",
      icon: category.icon ?? "",
      displayOrder: category.displayOrder,
      isFeatured: category.isFeatured,
      slug: category.slug,
      seoTitle: category.seoTitle ?? "",
      seoDescription: category.seoDescription ?? "",
    };
  }

  return {
    name: "",
    description: "",
    parentCategoryId: null,
    image: "",
    icon: "",
    displayOrder: 0,
    isFeatured: false,
    slug: "",
    seoTitle: "",
    seoDescription: "",
  };
}

export function CategoryForm({
  initialCategory,
  parentOptions,
  submitLabel,
  disabled = false,
  onSubmit,
}: CategoryFormProps) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<CategoryManagementInput>(() =>
    buildInitialForm(initialCategory),
  );
  const [slugTouched, setSlugTouched] = useState(Boolean(initialCategory?.slug));

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(async () => {
      try {
        await onSubmit({
          ...form,
          description: form.description?.trim() || undefined,
          parentCategoryId: form.parentCategoryId || null,
          image: form.image?.trim() || null,
          icon: form.icon?.trim() || null,
          slug: form.slug?.trim() || slugifyCategoryName(form.name),
          seoTitle: form.seoTitle?.trim() || null,
          seoDescription: form.seoDescription?.trim() || null,
        });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to save category");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="category-name">Category name</Label>
          <Input
            id="category-name"
            value={form.name}
            onChange={(event) => {
              const name = event.target.value;
              setForm((current) => ({
                ...current,
                name,
                slug: slugTouched ? current.slug : slugifyCategoryName(name),
              }));
            }}
            required
            disabled={disabled || isPending}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="category-description">Description</Label>
          <textarea
            id="category-description"
            value={form.description ?? ""}
            onChange={(event) =>
              setForm((current) => ({ ...current, description: event.target.value }))
            }
            className="border-input bg-background min-h-24 w-full rounded-md border px-3 py-2 text-sm"
            disabled={disabled || isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category-parent">Parent category</Label>
          <select
            id="category-parent"
            className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
            value={form.parentCategoryId ?? ""}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                parentCategoryId: event.target.value || null,
              }))
            }
            disabled={disabled || isPending}
          >
            <option value="">Root level</option>
            {parentOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category-slug">Slug</Label>
          <Input
            id="category-slug"
            value={form.slug ?? ""}
            onChange={(event) => {
              setSlugTouched(true);
              setForm((current) => ({ ...current, slug: event.target.value }));
            }}
            disabled={disabled || isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category-display-order">Display order</Label>
          <Input
            id="category-display-order"
            type="number"
            min={0}
            value={form.displayOrder ?? 0}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                displayOrder: Number(event.target.value),
              }))
            }
            disabled={disabled || isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category-icon">Icon</Label>
          <Input
            id="category-icon"
            value={form.icon ?? ""}
            onChange={(event) => setForm((current) => ({ ...current, icon: event.target.value }))}
            placeholder="Emoji or icon key"
            disabled={disabled || isPending}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="category-image">Image URL</Label>
          <Input
            id="category-image"
            value={form.image ?? ""}
            onChange={(event) => setForm((current) => ({ ...current, image: event.target.value }))}
            disabled={disabled || isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category-seo-title">SEO title</Label>
          <Input
            id="category-seo-title"
            value={form.seoTitle ?? ""}
            onChange={(event) =>
              setForm((current) => ({ ...current, seoTitle: event.target.value }))
            }
            disabled={disabled || isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category-seo-description">SEO description</Label>
          <Input
            id="category-seo-description"
            value={form.seoDescription ?? ""}
            onChange={(event) =>
              setForm((current) => ({ ...current, seoDescription: event.target.value }))
            }
            disabled={disabled || isPending}
          />
        </div>

        <div className="flex items-center gap-2 md:col-span-2">
          <input
            id="category-featured"
            type="checkbox"
            checked={form.isFeatured ?? false}
            onChange={(event) =>
              setForm((current) => ({ ...current, isFeatured: event.target.checked }))
            }
            disabled={disabled || isPending}
          />
          <Label htmlFor="category-featured">Featured category</Label>
        </div>
      </div>

      <Button type="submit" disabled={disabled || isPending}>
        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {submitLabel}
      </Button>
    </form>
  );
}
