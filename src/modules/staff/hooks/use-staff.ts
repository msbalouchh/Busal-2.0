"use client";

import { useContext } from "react";

import { StaffContext } from "@/modules/staff/contexts/staff-context";
import type { StaffContextValue } from "@/modules/staff/types/staff-platform";

export function useStaffContext(): StaffContextValue {
  const context = useContext(StaffContext);

  if (!context) {
    throw new Error("useStaffContext must be used within StaffProvider");
  }

  return context;
}

export function useStaff(): StaffContextValue {
  return useStaffContext();
}
