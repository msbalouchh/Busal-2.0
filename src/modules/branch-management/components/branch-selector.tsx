"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BranchManagementRecord } from "@/modules/branch-management/types/branch-management-types";

interface BranchSelectorProps {
  branches: BranchManagementRecord[];
  value?: string;
  onValueChange?: (branchId: string) => void;
  placeholder?: string;
  disabled?: boolean;
  ariaLabel?: string;
}

export function BranchSelector({
  branches,
  value,
  onValueChange,
  placeholder = "Select branch",
  disabled = false,
  ariaLabel = "Branch selector",
}: BranchSelectorProps) {
  const [open, setOpen] = useState(false);
  const activeBranches = useMemo(
    () => branches.filter((branch) => branch.status === "ACTIVE" && branch.isActive),
    [branches],
  );
  const selected = activeBranches.find((branch) => branch.id === value);

  return (
    <div className="relative w-full max-w-sm">
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={disabled || activeBranches.length === 0}
        className="w-full justify-between"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="truncate">{selected?.name ?? placeholder}</span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
      </Button>
      {open ? (
        <ul
          role="listbox"
          aria-label="Branch options"
          className="bg-popover absolute z-20 mt-2 max-h-60 w-full overflow-auto rounded-md border p-1 shadow-md"
        >
          {activeBranches.map((branch) => (
            <li key={branch.id} role="option" aria-selected={branch.id === value}>
              <button
                type="button"
                className={cn(
                  "hover:bg-accent flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm",
                  branch.id === value && "bg-accent",
                )}
                onClick={() => {
                  onValueChange?.(branch.id);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn("h-4 w-4", branch.id === value ? "opacity-100" : "opacity-0")}
                  aria-hidden="true"
                />
                <span className="flex-1 truncate">{branch.name}</span>
                {branch.isPrimary ? (
                  <span className="text-muted-foreground text-xs">Primary</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
