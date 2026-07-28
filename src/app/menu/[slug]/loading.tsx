import { Loader2 } from "lucide-react";

export default function PublicMenuLoading() {
  return (
    <main className="bg-muted/30 flex min-h-screen items-center justify-center px-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" aria-hidden="true" />
        <p className="text-muted-foreground text-sm">Loading menu...</p>
      </div>
    </main>
  );
}
