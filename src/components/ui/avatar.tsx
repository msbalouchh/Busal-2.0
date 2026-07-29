import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const avatarVariants = cva("relative inline-flex shrink-0 overflow-hidden rounded-full bg-muted", {
  variants: {
    size: {
      sm: "h-8 w-8",
      md: "h-10 w-10",
      lg: "h-12 w-12",
      xl: "h-16 w-16",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export interface AvatarProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof avatarVariants> {
  src?: string;
  alt?: string;
  fallback?: string;
}

function Avatar({ className, src, alt, fallback, size, ...props }: AvatarProps) {
  const [imgError, setImgError] = React.useState(false);
  const showImage = src && !imgError;

  return (
    <span className={cn(avatarVariants({ size, className }))} {...props}>
      {showImage ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="bg-muted text-muted-foreground flex h-full w-full items-center justify-center text-sm font-medium">
          {fallback}
        </span>
      )}
    </span>
  );
}

export { Avatar, avatarVariants };
