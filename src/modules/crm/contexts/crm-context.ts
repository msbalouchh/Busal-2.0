"use client";

import { createContext } from "react";

import type { CrmContextValue } from "@/modules/crm/types/customer";

export const CrmContext = createContext<CrmContextValue | null>(null);

CrmContext.displayName = "CrmContext";
