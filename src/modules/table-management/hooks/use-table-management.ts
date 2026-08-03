"use client";

import { useContext } from "react";

import { TableManagementContext } from "@/modules/table-management/contexts/table-management-context";
import type { TableManagementContextValue } from "@/modules/table-management/types/table-management";

export function useTableManagementContext(): TableManagementContextValue {
  const context = useContext(TableManagementContext);

  if (!context) {
    throw new Error("useTableManagementContext must be used within TableManagementProvider");
  }

  return context;
}

export function useTableManagement(): TableManagementContextValue {
  return useTableManagementContext();
}
