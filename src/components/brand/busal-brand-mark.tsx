import { BusalLogo } from "@/components/brand/busal-logo";
import { BusalLogoIcon } from "@/components/brand/busal-logo-icon";
import { cn } from "@/lib/utils";

type BusalBrandMarkProps = {
  compact?: boolean;
  height?: number;
  className?: string;
  priority?: boolean;
};

export function BusalBrandMark({
  compact = false,
  height = 32,
  className,
  priority,
}: BusalBrandMarkProps) {
  if (compact) {
    return <BusalLogoIcon size={height} className={cn("shrink-0", className)} />;
  }

  return <BusalLogo height={height} className={cn("shrink-0", className)} priority={priority} />;
}
