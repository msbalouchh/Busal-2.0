import Image from "next/image";

import { BUSAL_LOGO } from "@/constants/brand";
import { cn } from "@/lib/utils";

import "./busal-logo.css";

type BusalLogoProps = {
  className?: string;
  height?: number;
  priority?: boolean;
};

export function BusalLogo({ className, height = 32, priority }: BusalLogoProps) {
  return (
    <Image
      src={BUSAL_LOGO.src}
      alt={BUSAL_LOGO.alt}
      width={BUSAL_LOGO.width}
      height={BUSAL_LOGO.height}
      className={cn("busal-logo", className)}
      style={{ height, width: "auto" }}
      priority={priority}
    />
  );
}
