"use client";

import { createContext } from "react";

import type { WorkspaceContextValue } from "@/modules/tenant/types/context";

export const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);
