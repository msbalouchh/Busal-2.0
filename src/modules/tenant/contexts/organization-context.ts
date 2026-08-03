"use client";

import { createContext } from "react";

import type { OrganizationContextValue } from "@/modules/tenant/types/context";

export const OrganizationContext = createContext<OrganizationContextValue | null>(null);
