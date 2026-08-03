"use client";

import { createContext } from "react";

import type { RbacContextValue } from "@/modules/rbac/types/context";

export const RbacContext = createContext<RbacContextValue | null>(null);

RbacContext.displayName = "RbacContext";
