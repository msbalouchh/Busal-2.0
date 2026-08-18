"use client";

import Image from "next/image";

import { BUSAL_LOGO, BUSAL_LOGO_DISPLAY_HEIGHT, BUSAL_LOGO_ICON } from "@/constants/brand";
import { cn } from "@/lib/utils";
import { useOptionalPlatformBranding } from "@/modules/platform/providers/platform-branding-provider";

interface PlatformBrandLogoProps {
  className?: string;
  height?: number;
  priority?: boolean;
}

export function PlatformBrandLogo({
  className,
  height = BUSAL_LOGO_DISPLAY_HEIGHT,
  priority = false,
}: PlatformBrandLogoProps) {
  const brandingContext = useOptionalPlatformBranding();
  const branding = brandingContext?.branding;

  const src = branding?.logoUrl ?? BUSAL_LOGO.src;
  const alt = branding?.platformName ?? BUSAL_LOGO.alt;

  return (
    <Image
      src={src}
      alt={alt}
      width={Math.round(height * BUSAL_LOGO.aspectRatio)}
      height={height}
      priority={priority}
      className={cn("h-auto w-auto object-contain", className)}
    />
  );
}

interface PlatformBrandMarkProps {
  className?: string;
  size?: number;
}

export function PlatformBrandMark({ className, size = 32 }: PlatformBrandMarkProps) {
  const brandingContext = useOptionalPlatformBranding();
  const branding = brandingContext?.branding;
  const src = branding?.faviconUrl ?? branding?.logoUrl ?? BUSAL_LOGO_ICON.src;
  const alt = branding?.platformName ?? BUSAL_LOGO.alt;

  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn("rounded-md object-contain", className)}
    />
  );
}
