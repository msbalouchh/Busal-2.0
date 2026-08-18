"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AUTH_SESSION_WARNING_DIALOG_ATTR } from "@/modules/auth/constants/session";

interface SessionExpiringDialogProps {
  open: boolean;
  secondsRemaining: number;
  isSigningOut: boolean;
  onContinueWorking: () => void;
  onSignOut: () => void;
}

export function SessionExpiringDialog({
  open,
  secondsRemaining,
  isSigningOut,
  onContinueWorking,
  onSignOut,
}: SessionExpiringDialogProps) {
  return (
    <Dialog open={open} onOpenChange={() => undefined}>
      <DialogContent
        {...{ [AUTH_SESSION_WARNING_DIALOG_ATTR]: "true" }}
        className="[&>button]:hidden"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Session Expiring</DialogTitle>
          <DialogDescription>
            You&apos;ve been inactive for a while. For your security, you&apos;ll be signed out in{" "}
            <span className="text-foreground font-medium">{secondsRemaining}</span>{" "}
            {secondsRemaining === 1 ? "second" : "seconds"}.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" onClick={onContinueWorking} disabled={isSigningOut}>
            Continue Working
          </Button>
          <Button type="button" variant="outline" onClick={onSignOut} disabled={isSigningOut}>
            Sign Out
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
