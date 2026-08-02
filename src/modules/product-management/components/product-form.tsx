"use client";

import type { ProductType } from "@prisma/client";
import { Loader2, Plus, X } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PRODUCT_TYPE_OPTIONS } from "@/modules/product-management/constants/routes";
import {
  normalizeProductSku,
  slugifyProductName,
} from "@/modules/product-management/lib/product-validation";
import type {
  ProductManagementInput,
  ProductManagementRecord,
} from "@/modules/product-management/types/product-management-types";
import type { CategoryManagementRecord } from "@/modules/category-management/types/category-management-types";

interface ProductFormProps {
  initialProduct?: ProductManagementRecord | null;
  categories: CategoryManagementRecord[];
  defaultCategoryId?: string;
  submitLabel: string;
  disabled?: boolean;
  onSubmit: (input: ProductManagementInput) => Promise<void>;
}

function buildInitialForm(
  product: ProductManagementRecord | null | undefined,
  defaultCategoryId?: string,
): ProductManagementInput {
  if (product) {
    return {
      categoryId: product.categoryId,
      sku: product.sku,
      barcode: product.barcode ?? "",
      name: product.name,
      description: product.description ?? "",
      shortDescription: product.shortDescription ?? "",
      image: product.image ?? "",
      gallery: product.gallery,
      productType: product.productType,
      price: product.price,
      costPrice: product.costPrice,
      taxRate: product.taxRate,
      preparationTime: product.preparationTime,
      calories: product.calories,
      allergens: product.allergens,
      ingredients: product.ingredients,
      isVegetarian: product.isVegetarian,
      isVegan: product.isVegan,
      isHalal: product.isHalal,
      isGlutenFree: product.isGlutenFree,
      isFeatured: product.isFeatured,
      trackInventory: product.trackInventory,
      displayOrder: product.displayOrder,
      slug: product.slug,
      seoTitle: product.seoTitle ?? "",
      seoDescription: product.seoDescription ?? "",
    };
  }

  return {
    categoryId: defaultCategoryId ?? "",
    sku: "",
    barcode: "",
    name: "",
    description: "",
    shortDescription: "",
    image: "",
    gallery: [],
    productType: "FOOD",
    price: 0,
    costPrice: null,
    taxRate: null,
    preparationTime: null,
    calories: null,
    allergens: [],
    ingredients: [],
    isVegetarian: false,
    isVegan: false,
    isHalal: false,
    isGlutenFree: false,
    isFeatured: false,
    trackInventory: false,
    displayOrder: 0,
    slug: "",
    seoTitle: "",
    seoDescription: "",
  };
}

export function ProductForm({
  initialProduct,
  categories,
  defaultCategoryId,
  submitLabel,
  disabled = false,
  onSubmit,
}: ProductFormProps) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<ProductManagementInput>(() =>
    buildInitialForm(initialProduct, defaultCategoryId),
  );
  const [slugTouched, setSlugTouched] = useState(Boolean(initialProduct?.slug));
  const [galleryInput, setGalleryInput] = useState("");
  const [allergenInput, setAllergenInput] = useState("");
  const [ingredientInput, setIngredientInput] = useState("");

  const addToList = (
    key: "gallery" | "allergens" | "ingredients",
    value: string,
    reset: () => void,
  ) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setForm((current) => ({
      ...current,
      [key]: [...(current[key] ?? []), trimmed],
    }));
    reset();
  };

  const removeFromList = (key: "gallery" | "allergens" | "ingredients", index: number) => {
    setForm((current) => ({
      ...current,
      [key]: (current[key] ?? []).filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(async () => {
      try {
        await onSubmit({
          ...form,
          sku: normalizeProductSku(form.sku),
          barcode: form.barcode?.trim() || null,
          description: form.description?.trim() || undefined,
          shortDescription: form.shortDescription?.trim() || null,
          image: form.image?.trim() || null,
          slug: form.slug?.trim() || slugifyProductName(form.name),
          seoTitle: form.seoTitle?.trim() || null,
          seoDescription: form.seoDescription?.trim() || null,
        });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to save product");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="product-name">Product name</Label>
          <Input
            id="product-name"
            value={form.name}
            onChange={(event) => {
              const name = event.target.value;
              setForm((current) => ({
                ...current,
                name,
                slug: slugTouched ? current.slug : slugifyProductName(name),
              }));
            }}
            required
            disabled={disabled || isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="product-category">Category</Label>
          <select
            id="product-category"
            className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
            value={form.categoryId}
            onChange={(event) =>
              setForm((current) => ({ ...current, categoryId: event.target.value }))
            }
            required
            disabled={disabled || isPending}
          >
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="product-type">Product type</Label>
          <select
            id="product-type"
            className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
            value={form.productType}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                productType: event.target.value as ProductType,
              }))
            }
            disabled={disabled || isPending}
          >
            {PRODUCT_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="product-sku">SKU</Label>
          <Input
            id="product-sku"
            value={form.sku}
            onChange={(event) => setForm((current) => ({ ...current, sku: event.target.value }))}
            required
            disabled={disabled || isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="product-barcode">Barcode</Label>
          <Input
            id="product-barcode"
            value={form.barcode ?? ""}
            onChange={(event) =>
              setForm((current) => ({ ...current, barcode: event.target.value }))
            }
            disabled={disabled || isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="product-price">Price</Label>
          <Input
            id="product-price"
            type="number"
            min={0}
            step="0.01"
            value={form.price}
            onChange={(event) =>
              setForm((current) => ({ ...current, price: Number(event.target.value) }))
            }
            required
            disabled={disabled || isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="product-cost">Cost price</Label>
          <Input
            id="product-cost"
            type="number"
            min={0}
            step="0.01"
            value={form.costPrice ?? ""}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                costPrice: event.target.value ? Number(event.target.value) : null,
              }))
            }
            disabled={disabled || isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="product-tax">Tax rate (%)</Label>
          <Input
            id="product-tax"
            type="number"
            min={0}
            max={100}
            step="0.01"
            value={form.taxRate ?? ""}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                taxRate: event.target.value ? Number(event.target.value) : null,
              }))
            }
            disabled={disabled || isPending}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="product-description">Description</Label>
          <textarea
            id="product-description"
            value={form.description ?? ""}
            onChange={(event) =>
              setForm((current) => ({ ...current, description: event.target.value }))
            }
            className="border-input bg-background min-h-24 w-full rounded-md border px-3 py-2 text-sm"
            disabled={disabled || isPending}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="product-image">Primary image URL</Label>
          <Input
            id="product-image"
            value={form.image ?? ""}
            onChange={(event) => setForm((current) => ({ ...current, image: event.target.value }))}
            disabled={disabled || isPending}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="product-slug">Slug</Label>
          <Input
            id="product-slug"
            value={form.slug ?? ""}
            onChange={(event) => {
              setSlugTouched(true);
              setForm((current) => ({ ...current, slug: event.target.value }));
            }}
            disabled={disabled || isPending}
          />
        </div>
      </section>

      <section className="space-y-3">
        <Label>Gallery</Label>
        <div className="flex gap-2">
          <Input
            value={galleryInput}
            onChange={(event) => setGalleryInput(event.target.value)}
            placeholder="Image URL"
            disabled={disabled || isPending}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => addToList("gallery", galleryInput, () => setGalleryInput(""))}
            disabled={disabled || isPending}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <ul className="space-y-2">
          {(form.gallery ?? []).map((url, index) => (
            <li
              key={`${url}-${index}`}
              className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
            >
              <span className="truncate">{url}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeFromList("gallery", index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <Label>Allergens</Label>
        <div className="flex gap-2">
          <Input
            value={allergenInput}
            onChange={(event) => setAllergenInput(event.target.value)}
            placeholder="Allergen name"
            disabled={disabled || isPending}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => addToList("allergens", allergenInput, () => setAllergenInput(""))}
            disabled={disabled || isPending}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <ul className="space-y-2">
          {(form.allergens ?? []).map((item, index) => (
            <li
              key={`${item}-${index}`}
              className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
            >
              <span className="truncate">{item}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeFromList("allergens", index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <Label>Ingredients</Label>
        <div className="flex gap-2">
          <Input
            value={ingredientInput}
            onChange={(event) => setIngredientInput(event.target.value)}
            placeholder="Ingredient name"
            disabled={disabled || isPending}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => addToList("ingredients", ingredientInput, () => setIngredientInput(""))}
            disabled={disabled || isPending}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <ul className="space-y-2">
          {(form.ingredients ?? []).map((item, index) => (
            <li
              key={`${item}-${index}`}
              className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
            >
              <span className="truncate">{item}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeFromList("ingredients", index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(
          [
            { key: "isVegetarian", label: "Vegetarian" },
            { key: "isVegan", label: "Vegan" },
            { key: "isHalal", label: "Halal" },
            { key: "isGlutenFree", label: "Gluten free" },
            { key: "isFeatured", label: "Featured" },
            { key: "trackInventory", label: "Track inventory" },
          ] as const
        ).map(({ key, label }) => (
          <label key={key} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(form[key])}
              onChange={(event) =>
                setForm((current) => ({ ...current, [key]: event.target.checked }))
              }
              disabled={disabled || isPending}
            />
            {label}
          </label>
        ))}
      </section>

      <Button type="submit" disabled={disabled || isPending}>
        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {submitLabel}
      </Button>
    </form>
  );
}
