"use client";

import { createContext } from "react";

import type { TenantFoundationContextValue } from "@/modules/tenant/types/context";

export const TenantFoundationContext = createContext<TenantFoundationContextValue | null>(null);
