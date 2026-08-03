"use client";

import { createContext } from "react";

import type { TenantContextValue } from "@/modules/tenant/types/context";

export const TenantContext = createContext<TenantContextValue | null>(null);
