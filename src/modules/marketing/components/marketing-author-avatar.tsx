import { cn } from "@/lib/utils";

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #3b82f6, #6366f1)",
  "linear-gradient(135deg, #8b5cf6, #a855f7)",
  "linear-gradient(135deg, #06b6d4, #3b82f6)",
  "linear-gradient(135deg, #f97316, #ef4444)",
  "linear-gradient(135deg, #10b981, #059669)",
  "linear-gradient(135deg, #ec4899, #8b5cf6)",
] as const;

function gradientForName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash + name.charCodeAt(i) * (i + 1)) % 997;
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length]!;
}

type MarketingAuthorAvatarProps = {
  initials: string;
  name: string;
  className?: string;
  size?: "sm" | "md";
};

export function MarketingAuthorAvatar({
  initials,
  name,
  className,
  size = "sm",
}: MarketingAuthorAvatarProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white",
        size === "sm" ? "h-7 w-7 text-[0.625rem]" : "h-9 w-9 text-xs",
        className,
      )}
      style={{ background: gradientForName(name) }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}
