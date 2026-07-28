export function getTimeOfDayGreeting(date: Date = new Date()): string {
  const hour = date.getHours();

  if (hour < 12) {
    return "Good Morning";
  }

  if (hour < 17) {
    return "Good Afternoon";
  }

  return "Good Evening";
}

export function resolveDisplayName(
  ownerName: string | null | undefined,
  fallbackFullName: string,
): string {
  const trimmedOwner = ownerName?.trim();
  if (trimmedOwner) {
    return trimmedOwner;
  }

  const trimmedFallback = fallbackFullName.trim();
  if (trimmedFallback) {
    return trimmedFallback;
  }

  return "there";
}

export function resolveBusinessName(businessName: string | null | undefined): string {
  const trimmed = businessName?.trim();
  return trimmed || "your business";
}
