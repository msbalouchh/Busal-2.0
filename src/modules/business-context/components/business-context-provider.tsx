"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  switchBranchAction,
  switchBusinessAction,
} from "@/modules/business-context/actions/business-context-actions";
import type { ClientBusinessContext } from "@/modules/business-context/types/business-context";

interface BusinessContextProviderProps {
  initialContext: ClientBusinessContext;
  children: ReactNode;
}

interface BusinessContextValue extends ClientBusinessContext {
  switchBusiness: (businessId: string) => void;
  switchBranch: (branchId: string) => void;
  isPending: boolean;
}

const BusinessContext = createContext<BusinessContextValue | null>(null);

export function BusinessContextProvider({
  initialContext,
  children,
}: BusinessContextProviderProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [context, setContext] = useState(initialContext);

  const switchBusiness = useCallback(
    (businessId: string) => {
      startTransition(async () => {
        try {
          const nextContext = await switchBusinessAction(businessId);
          setContext(nextContext);
          router.refresh();
          toast.success("Business switched");
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Unable to switch business");
        }
      });
    },
    [router],
  );

  const switchBranch = useCallback(
    (branchId: string) => {
      startTransition(async () => {
        try {
          const nextContext = await switchBranchAction(branchId);
          setContext(nextContext);
          router.refresh();
          toast.success("Branch switched");
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Unable to switch branch");
        }
      });
    },
    [router],
  );

  const value = useMemo(
    () => ({
      ...context,
      switchBusiness,
      switchBranch,
      isPending,
    }),
    [context, isPending, switchBranch, switchBusiness],
  );

  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>;
}

export function useBusinessContext(): BusinessContextValue {
  const context = useContext(BusinessContext);

  if (!context) {
    throw new Error("useBusinessContext must be used within BusinessContextProvider");
  }

  return context;
}
