"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";

import { RbacContext } from "@/modules/rbac/contexts/rbac-context";
import type { RbacSelectionInput } from "@/modules/rbac/types/selection";
import { createAuthorizationEngine } from "@/modules/rbac/utils/authorization-engine";
import type { RbacContextValue, RbacSnapshot } from "@/modules/rbac/types/context";

interface RbacProviderProps {
  children: ReactNode;
  initialSelection?: RbacSelectionInput;
  initialSnapshot: RbacSnapshot;
}

export function RbacProvider({ children, initialSelection, initialSnapshot }: RbacProviderProps) {
  const [selection] = useState<RbacSelectionInput>(() => initialSelection ?? {});
  const [snapshot, setSnapshot] = useState(() => initialSnapshot);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/rbac/snapshot");
    if (!response.ok) {
      return;
    }

    const nextSnapshot = (await response.json()) as RbacSnapshot;
    setSnapshot(nextSnapshot);
  }, []);

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
