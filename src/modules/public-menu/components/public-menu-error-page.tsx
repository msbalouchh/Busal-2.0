import { QrCode } from "lucide-react";

import { PUBLIC_MENU_INVALID_MESSAGE } from "@/modules/public-menu/constants/routes";

export function PublicMenuErrorPage() {
  return (
    <main className="bg-background flex min-h-screen items-center justify-center px-4 py-12">
      <div className="mx-auto flex w-full max-w-md flex-col items-center text-center">
        <div className="bg-muted mb-6 flex h-16 w-16 items-center justify-center rounded-full">
          <QrCode className="text-muted-foreground h-8 w-8" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">Menu unavailable</h1>
        <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
          {PUBLIC_MENU_INVALID_MESSAGE}
        </p>
      </div>
    </main>
  );
}
