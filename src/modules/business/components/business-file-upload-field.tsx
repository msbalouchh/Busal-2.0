"use client";

import { ImagePlus, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { uploadBusinessAssetAction } from "@/modules/business/actions/business-profile-actions";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_BUSINESS_ASSET_SIZE_BYTES,
} from "@/modules/business/constants/business-profile";
import { cn } from "@/lib/utils";

interface BusinessFileUploadFieldProps {
  label: string;
  assetType: "logo" | "cover" | "favicon";
  currentUrl: string | null;
  disabled?: boolean;
  previewClassName?: string;
}

export function BusinessFileUploadField({
  label,
  assetType,
  currentUrl,
  disabled = false,
  previewClassName,
}: BusinessFileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl);
  const [isPending, startTransition] = useTransition();

  const handleSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
      toast.error("Unsupported image type. Use PNG, JPEG, WebP, or SVG.");
      return;
    }

    if (file.size > MAX_BUSINESS_ASSET_SIZE_BYTES) {
      toast.error("File exceeds the 5 MB limit.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        return;
      }

      const base64 = result.split(",")[1] ?? "";
      setPreviewUrl(result);

      startTransition(async () => {
        try {
          const response = await uploadBusinessAssetAction({
            assetType,
            originalName: file.name,
            mimeType: file.type,
            contentBase64: base64,
          });

          const nextUrl =
            assetType === "logo"
              ? response.profile.branding.logoUrl
              : assetType === "cover"
                ? response.profile.branding.coverUrl
                : response.profile.branding.faviconUrl;

          setPreviewUrl(nextUrl);
          toast.success(`${label} uploaded`);
        } catch (error) {
          setPreviewUrl(currentUrl);
          toast.error(
            error instanceof Error ? error.message : `Unable to upload ${label.toLowerCase()}`,
          );
        }
      });
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className={cn(
            "bg-muted relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg border",
            previewClassName,
          )}
        >
          {previewUrl ? (
            <Image
              src={previewUrl}
              alt={`${label} preview`}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <ImagePlus className="text-muted-foreground h-8 w-8" aria-hidden="true" />
          )}
        </div>
        <div className="space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept={ALLOWED_IMAGE_MIME_TYPES.join(",")}
            className="sr-only"
            disabled={disabled || isPending}
            onChange={handleSelect}
          />
          <Button
            type="button"
            variant="outline"
            disabled={disabled || isPending}
            onClick={() => inputRef.current?.click()}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Upload {label.toLowerCase()}
          </Button>
          <p className="text-muted-foreground text-xs">PNG, JPEG, WebP, or SVG up to 5 MB.</p>
        </div>
      </div>
    </div>
  );
}
