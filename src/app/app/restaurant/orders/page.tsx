import type { Metadata } from "next";
import { ClipboardList } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { OrderListPanel } from "@/modules/order-management/components/order-list-panel";
import { getOrderListContext } from "@/modules/order-management/lib/get-order-management-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";
import type {
  OrderListQuery,
  OrderSortField,
} from "@/modules/order-management/types/order-management-types";
import type {
  OrderType,
  RestaurantOrderPaymentStatus,
  RestaurantOrderStatus,
} from "@prisma/client";

interface OrdersPageProps {
  searchParams: Promise<{
    branchId?: string;
    search?: string;
    status?: string;
    orderType?: string;
    paymentStatus?: string;
    sortBy?: string;
    sortDirection?: string;
    page?: string;
    view?: string;
  }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Orders" };
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const params = await searchParams;
  const query: OrderListQuery = {
    branchId: params.branchId ?? "",
    search: params.search,
    status: (params.status as RestaurantOrderStatus | "ALL") ?? "ALL",
    orderType: (params.orderType as OrderType | "ALL") ?? "ALL",
    paymentStatus: (params.paymentStatus as RestaurantOrderPaymentStatus | "ALL") ?? "ALL",
    sortBy: (params.sortBy as OrderSortField) ?? "placedAt",
    sortDirection: (params.sortDirection as OrderListQuery["sortDirection"]) ?? "desc",
    page: params.page ? Number(params.page) : 1,
  };

  const context = await getOrderListContext(params.branchId ?? "", query);

  return (
    <ApplicationPageTemplate
      title="Orders"
      description="Manage dine-in, takeaway, and delivery orders across branches."
      icon={ClipboardList}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        { label: "Orders" },
      ]}
    >
      <OrderListPanel
        context={context}
        list={context.list}
        stats={context.stats}
        queueOrders={context.queueOrders}
        initialSearch={params.search ?? ""}
        initialStatus={params.status ?? "ALL"}
        initialOrderType={params.orderType ?? "ALL"}
        initialPaymentStatus={params.paymentStatus ?? "ALL"}
        initialSortBy={params.sortBy ?? "placedAt"}
        initialSortDirection={params.sortDirection ?? "desc"}
        initialView={(params.view as "list" | "queue") ?? "list"}
      />
    </ApplicationPageTemplate>
  );
}
