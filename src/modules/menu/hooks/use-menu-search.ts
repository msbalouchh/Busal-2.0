"use client";

import { useMemo, useState } from "react";

import { useMenuContext } from "@/modules/menu/hooks/use-menu";
import type { MenuSearchQuery } from "@/modules/menu/types/menu";

export function useMenuSearch(initialQuery = "") {
  const { searchItems } = useMenuContext();
  const [query, setQuery] = useState(initialQuery);

  const results = useMemo(() => {
    const params: MenuSearchQuery = {};
    if (query.trim()) params.query = query.trim();
    return searchItems(params);
  }, [query, searchItems]);

  return { query, setQuery, results };
}
