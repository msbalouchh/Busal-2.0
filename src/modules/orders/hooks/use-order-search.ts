"use client";

import { useMemo, useState } from "react";

import { useOrdersContext } from "@/modules/orders/hooks/use-orders";
import type { OrderSearchQuery } from "@/modules/orders/types/order";

export function useOrderSearch(initialQuery = "") {
  const { searchOrders } = useOrdersContext();
  const [query, setQuery] = useState(initialQuery);

  const results = useMemo(() => {
    const params: OrderSearchQuery = {};

    if (query.trim()) {
      params.query = query.trim();
    }

    return searchOrders(params);
  }, [query, searchOrders]);

  return { query, setQuery, results };
}
