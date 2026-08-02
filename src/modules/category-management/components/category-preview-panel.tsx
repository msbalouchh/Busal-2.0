import { CategoryStatusBadge } from "@/modules/category-management/components/category-status-badge";
import type { CategoryManagementRecord } from "@/modules/category-management/types/category-management-types";

interface CategoryPreviewPanelProps {
  category: CategoryManagementRecord;
}

export function CategoryPreviewPanel({ category }: CategoryPreviewPanelProps) {
  return (
    <section className="overflow-hidden rounded-xl border">
      {category.image ? (
        <div
          className="bg-muted h-40 bg-cover bg-center"
          style={{ backgroundImage: `url(${category.image})` }}
          role="img"
          aria-label={`${category.name} preview`}
        />
      ) : (
        <div className="bg-muted flex h-40 items-center justify-center text-5xl">
          {category.icon || "📁"}
        </div>
      )}
      <div className="space-y-4 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-sm">{category.slug}</p>
            <h3 className="text-2xl font-semibold tracking-tight">{category.name}</h3>
          </div>
          <CategoryStatusBadge status={category.status} isFeatured={category.isFeatured} />
        </div>
        {category.description ? (
          <p className="text-muted-foreground text-sm">{category.description}</p>
        ) : null}
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Parent</dt>
            <dd>{category.parentCategoryName ?? "Root level"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Subcategories</dt>
            <dd>{category.childCount}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">SEO title</dt>
            <dd>{category.seoTitle || category.name}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">SEO description</dt>
            <dd>{category.seoDescription || "—"}</dd>
          </div>
        </dl>
        <p className="text-muted-foreground text-xs">
          Products will appear under this category in a later release.
        </p>
      </div>
    </section>
  );
}
