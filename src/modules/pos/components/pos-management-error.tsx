import { AlertCircle } from "lucide-react";

interface PosManagementErrorProps {
  message?: string;
}

export function PosManagementError({ message }: PosManagementErrorProps) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center">
      <AlertCircle className="text-destructive mb-3 h-8 w-8" />
      <h3 className="text-sm font-medium">Unable to load POS data</h3>
      <p className="text-muted-foreground mt-1 max-w-sm text-sm">
        {message ?? "An unexpected error occurred while loading point-of-sale data."}
      </p>
    </div>
  );
}
