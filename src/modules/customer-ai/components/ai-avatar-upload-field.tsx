"use client";

import { ImagePlus, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { uploadCustomerAiAvatarAction } from "@/modules/customer-ai/actions/customer-ai-actions";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_BUSINESS_ASSET_SIZE_BYTES,
} from "@/modules/business/constants/business-profile";
import { cn } from "@/lib/utils";

interface AiAvatarUploadFieldProps {
  currentUrl: string | null;
  disabled?: boolean;
  onUploaded: (url: string) => void;
}

export function AiAvatarUploadField({
  currentUrl,
  disabled = false,
  onUploaded,
}: AiAvatarUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl);
  const [isPending, startTransition] = useTransition();

  const handleSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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
      if (typeof result !== "string") return;

      const base64 = result.split(",")[1] ?? "";
      setPreviewUrl(result);

      startTransition(async () => {
        try {
          const identity = await uploadCustomerAiAvatarAction({
            originalName: file.name,
            mimeType: file.type,
            contentBase64: base64,
          });
          setPreviewUrl(identity.aiAvatarUrl);
          if (identity.aiAvatarUrl) onUploaded(identity.aiAvatarUrl);
          toast.success("AI avatar uploaded");
        } catch (error) {
          setPreviewUrl(currentUrl);
          toast.error(error instanceof Error ? error.message : "Upload failed");
        }
      });
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <Label>AI Profile Picture</Label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className={cn(
            "bg-muted relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border",
          )}
        >
          {previewUrl ? (
            <Image src={previewUrl} alt="AI avatar preview" fill className="object-cover" unoptimized />
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
            Upload avatar
          </Button>
          <p className="text-muted-foreground text-xs">PNG, JPEG, WebP, or SVG up to 5 MB.</p>
        </div>
      </div>
    </div>
  );
}
