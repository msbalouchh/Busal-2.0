"use client";

import { QRCodeSVG } from "qrcode.react";

interface QrCodePreviewProps {
  value: string;
  size?: number;
  label?: string;
}

export function QrCodePreview({ value, size = 180, label }: QrCodePreviewProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <QRCodeSVG value={value} size={size} level="M" includeMargin />
      </div>
      {label ? <p className="text-muted-foreground text-center text-sm">{label}</p> : null}
    </div>
  );
}
