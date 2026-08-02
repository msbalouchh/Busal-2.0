import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { INVENTORY_SUPPLIER_ROUTES } from "@/modules/inventory-supplier-management/constants/routes";

export const metadata: Metadata = {
  title: "Low Stock",
};

interface LowStockRedirectPageProps {
  searchParams: Promise<{ branchId?: string }>;
}

export default async function LowStockRedirectPage({ searchParams }: LowStockRedirectPageProps) {
  const params = await searchParams;
  redirect(INVENTORY_SUPPLIER_ROUTES.lowStock(params.branchId));
}
