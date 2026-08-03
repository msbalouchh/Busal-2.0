"use client";

import { useMemo, useState } from "react";

import { useCrm } from "@/modules/crm/hooks/use-crm";

export function useCustomerSearch(initialQuery = "") {
  const { searchCustomers } = useCrm();
  const [query, setQuery] = useState(initialQuery);

  const results = useMemo(() => searchCustomers({ query, limit: 20 }), [searchCustomers, query]);

  return { query, setQuery, results, count: results.length };
}
