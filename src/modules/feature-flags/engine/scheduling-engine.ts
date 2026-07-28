export function isWithinScheduledWindow(
  now: Date,
  scheduledActivateAt: Date | null,
  scheduledDeactivateAt: Date | null,
): boolean {
  if (scheduledActivateAt && now < scheduledActivateAt) {
    return false;
  }

  if (scheduledDeactivateAt && now >= scheduledDeactivateAt) {
    return false;
  }

  return true;
}

export function resolveScheduledStatus(
  now: Date,
  scheduledActivateAt: Date | null,
  scheduledDeactivateAt: Date | null,
): "pending" | "active" | "expired" | "none" {
  if (!scheduledActivateAt && !scheduledDeactivateAt) {
    return "none";
  }

  if (scheduledActivateAt && now < scheduledActivateAt) {
    return "pending";
  }

  if (scheduledDeactivateAt && now >= scheduledDeactivateAt) {
    return "expired";
  }

  return "active";
}

export function shouldAutoActivate(now: Date, scheduledActivateAt: Date | null): boolean {
  return scheduledActivateAt !== null && now >= scheduledActivateAt;
}

export function shouldAutoDeactivate(now: Date, scheduledDeactivateAt: Date | null): boolean {
  return scheduledDeactivateAt !== null && now >= scheduledDeactivateAt;
}
