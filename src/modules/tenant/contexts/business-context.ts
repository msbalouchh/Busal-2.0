"use client";

import { createContext } from "react";

import type { BusinessContextValue } from "@/modules/tenant/types/context";

export const BusinessContext = createContext<BusinessContextValue | null>(null);
