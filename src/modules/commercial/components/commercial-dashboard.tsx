import type { CommercialDashboardView } from "@/modules/commercial/utils/commercial-utils";

interface CommercialDashboardProps {
  dashboard: CommercialDashboardView;
}

export function CommercialDashboard({ dashboard }: CommercialDashboardProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Categories</p>
        <p className="text-2xl font-semibold">{dashboard.totalCategories}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Products</p>
        <p className="text-2xl font-semibold">{dashboard.totalProducts}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Active Products</p>
        <p className="text-2xl font-semibold">{dashboard.activeProducts}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Bundles</p>
        <p className="text-2xl font-semibold">{dashboard.totalBundles}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Price Books</p>
        <p className="text-2xl font-semibold">{dashboard.totalPriceBooks}</p>
      </div>
    </div>
  );
}
