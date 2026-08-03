"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";

import { RbacContext } from "@/modules/rbac/contexts/rbac-context";
import {
  buildRbacSnapshot,
  type RbacSelectionInput,
} from "@/modules/rbac/services/mock-rbac.service";
import { createAuthorizationEngine } from "@/modules/rbac/utils/authorization-engine";
import type { RbacContextValue } from "@/modules/rbac/types/context";

interface RbacProviderProps {
  children: ReactNode;
  initialSelection?: RbacSelectionInput;
}

export function RbacProvider({ children, initialSelection }: RbacProviderProps) {
  const [selection] = useState<RbacSelectionInput>(() => initialSelection ?? {});
  const [snapshot, setSnapshot] = useState(() => buildRbacSnapshot(selection));

  const refresh = useCallback(() => {
    setSnapshot(buildRbacSnapshot(selection));
  }, [selection]);

  const value = useMemo<RbacContextValue>(() => {
    const engine = createAuthorizationEngine(snapshot.context);

    return {
      snapshot,
      ...engine,
      refresh,
    };
  }, [snapshot, refresh]);

  return <RbacContext.Provider value={value}>{children}</RbacContext.Provider>;
}
