"use client";

import { useRef, useTransition } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MediaPlatformNav } from "@/modules/media-platform-management/components/media-platform-nav";
import {
  bulkUploadMediaAction,
  uploadMediaFileAction,
} from "@/modules/media-platform-management/actions/media-platform-actions";
import { formatBytes } from "@/modules/media-platform-management/lib/media-platform-validation";
import type { MediaPlatformContext } from "@/modules/media-platform-management/lib/get-media-platform-context";

interface MediaUploadPanelProps {
  context: MediaPlatformContext;
  recentUploads: Array<{ id: string; name: string; size: number; createdAt: string }>;
}

async function readFileAsBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index] ?? 0);
  }
  return btoa(binary);
}

export function MediaUploadPanel({ context, recentUploads }: MediaUploadPanelProps) {
  const [pending, startTransition] = useTransition();
  const singleInputRef = useRef<HTMLInputElement>(null);
  const bulkInputRef = useRef<HTMLInputElement>(null);

  function uploadFiles(files: FileList | File[]) {
    const fileList = Array.from(files);
    if (fileList.length === 0) {
      return;
    }

    startTransition(async () => {
      try {
        if (fileList.length === 1) {
          const file = fileList[0];
          if (!file) return;
          await uploadMediaFileAction({
            name: file.name,
            originalName: file.name,
            mimeType: file.type || "application/octet-stream",
            size: file.size,
            contentBase64: await readFileAsBase64(file),
          });
        } else {
          const payload = await Promise.all(
            fileList.map(async (file) => ({
              name: file.name,
              mimeType: file.type || "application/octet-stream",
              size: file.size,
              contentBase64: await readFileAsBase64(file),
            })),
          );
          await bulkUploadMediaAction(payload);
        }
        toast.success("Upload complete");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Upload failed");
      }
    });
  }

  return (
    <div className="space-y-8">
      <MediaPlatformNav />
      <p className="text-muted-foreground text-sm">
        Upload files for {context.business.businessName ?? "your business"}.
      </p>

      {context.permissionsFlags.canUpload ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Single upload</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="single-file">Choose file</Label>
                  <Input
                    id="single-file"
                    ref={singleInputRef}
                    type="file"
                    disabled={pending}
                    onChange={(event) => {
                      if (event.target.files) {
                        uploadFiles(event.target.files);
                        event.target.value = "";
                      }
                    }}
                  />
                </div>
                <Button
                  type="button"
                  disabled={pending}
                  onClick={() => singleInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
                  Upload file
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bulk upload</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-muted-foreground/25 rounded-lg border-2 border-dashed p-8 text-center">
                <Upload className="text-muted-foreground mx-auto mb-2 h-8 w-8" aria-hidden="true" />
                <p className="text-muted-foreground text-sm">Select multiple files to upload</p>
              </div>
              <Input
                ref={bulkInputRef}
                type="file"
                multiple
                disabled={pending}
                className="hidden"
                onChange={(event) => {
                  if (event.target.files) {
                    uploadFiles(event.target.files);
                    event.target.value = "";
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => bulkInputRef.current?.click()}
              >
                Choose files
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent uploads</CardTitle>
        </CardHeader>
        <CardContent>
          {recentUploads.length === 0 ? (
            <p className="text-muted-foreground text-sm">No recent uploads.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {recentUploads.map((file) => (
                <li key={file.id} className="flex justify-between">
                  <span>{file.name}</span>
                  <span className="text-muted-foreground">{formatBytes(file.size)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
