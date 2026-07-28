import type { Metadata } from "next";

import { FilePlatformNav } from "@/modules/file-platform/components/file-platform-nav";

export const metadata: Metadata = {
  title: "File & Document Management",
};

export default function FilePlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Universal File & Document Management
        </h1>
        <p className="text-muted-foreground text-sm">
          Centralized storage, versioning, permissions, sharing, and audit for all Busal modules.
        </p>
      </div>
      <FilePlatformNav />
      {children}
    </div>
  );
}
