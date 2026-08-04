import Image from "next/image";

import { BUSAL_LOGO, BUSAL_LOGO_DISPLAY_HEIGHT, BUSAL_LOGO_HORIZONTAL } from "@/constants/brand";
import { cn } from "@/lib/utils";

import "./busal-logo.css";

type BusalLogoProps = {
  className?: string;
  /** Max height in pixels — width scales from the official aspect ratio. */
  height?: number;
  /** Optional max width cap for tight surfaces (sidebar, mobile). */
  maxWidth?: number;
  variant?: "horizontal" | "stacked";
  priority?: boolean;
};

export function BusalLogo({
  className,
  height = BUSAL_LOGO_DISPLAY_HEIGHT,
  maxWidth,
  variant = "horizontal",
  priority,
}: BusalLogoProps) {
  const asset = variant === "horizontal" ? BUSAL_LOGO_HORIZONTAL : BUSAL_LOGO;
  const computedWidth = Math.round(height * asset.aspectRatio);

  return (
    <Image
      src={asset.src}
      alt={asset.alt}
      width={asset.width}
      height={asset.height}
      className={cn("busal-logo", variant === "horizontal" && "busal-logo--horizontal", className)}
      style={{
        height,
        width: "auto",
        maxWidth: maxWidth ?? computedWidth,
      }}
      priority={priority}
    />
  );
}
