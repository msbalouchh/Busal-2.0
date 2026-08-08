import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ReservationManagementErrorProps {
  message: string;
  onRetry?: () => void;
}

export function ReservationManagementError({ message, onRetry }: ReservationManagementErrorProps) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
      <AlertCircle className="text-destructive h-8 w-8" />
      <div>
        <p className="font-medium">Unable to load reservations</p>
        <p className="text-muted-foreground text-sm">{message}</p>
      </div>
      {onRetry ? (
        <Button type="button" variant="outline" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
