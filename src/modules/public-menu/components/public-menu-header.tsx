import { Store, UtensilsCrossed } from "lucide-react";
import Image from "next/image";

import { getBusinessDisplayName } from "@/modules/public-menu/lib/public-menu-utils";
import type { PublicMenuViewModel } from "@/modules/public-menu/lib/public-menu-utils";

interface PublicMenuHeaderProps {
  business: PublicMenuViewModel["business"];
}

export function PublicMenuHeader({ business }: PublicMenuHeaderProps) {
  const displayName = getBusinessDisplayName(business);

  return (
    <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex w-full max-w-3xl items-center gap-4 px-4 py-5 sm:px-6">
        <div className="bg-muted flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full">
          {business.logoUrl ? (
            <Image
              src={business.logoUrl}
              alt={`${displayName} logo`}
              width={56}
              height={56}
              className="h-full w-full object-cover"
              unoptimized
            />
          ) : (
            <Store className="text-muted-foreground h-6 w-6" aria-hidden="true" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold tracking-tight">{displayName}</h1>
          {business.welcomeMessage ? (
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
              {business.welcomeMessage}
            </p>
          ) : null}
        </div>
        <UtensilsCrossed
          className="text-muted-foreground hidden h-5 w-5 sm:block"
          aria-hidden="true"
        />
      </div>
    </header>
  );
}
