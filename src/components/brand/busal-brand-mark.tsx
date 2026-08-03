import { BusalLogo } from "@/components/brand/busal-logo";
import { cn } from "@/lib/utils";

type BusalBrandMarkProps = {
  compact?: boolean;
  height?: number;
  className?: string;
  priority?: boolean;
};

export function BusalBrandMark({
  compact = false,
  height = 44,
  className,
  priority,
}: BusalBrandMarkProps) {
  return (
    <BusalLogo
      variant="horizontal"
      height={compact ? Math.min(height, 32) : height}
      maxWidth={compact ? 128 : undefined}
      className={cn("shrink-0", className)}
      priority={priority}
    />
  );
}
