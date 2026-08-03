"use client";

import { createContext } from "react";

import type { BranchContextValue } from "@/modules/tenant/types/context";

export const BranchContext = createContext<BranchContextValue | null>(null);
