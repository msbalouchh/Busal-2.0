import Image from "next/image";

import { BUSAL_LOGO_ICON } from "@/constants/brand";
import { cn } from "@/lib/utils";

import "./busal-logo-icon.css";

type BusalLogoIconProps = {
  className?: string;
  size?: number;
};

export function BusalLogoIcon({ className, size = 32 }: BusalLogoIconProps) {
  return (
    <Image
      src={BUSAL_LOGO_ICON.src}
      alt={BUSAL_LOGO_ICON.alt}
      width={BUSAL_LOGO_ICON.width}
      height={BUSAL_LOGO_ICON.height}
      className={cn("busal-logo-icon", className)}
      style={{ width: size, height: size }}
    />
  );
}
